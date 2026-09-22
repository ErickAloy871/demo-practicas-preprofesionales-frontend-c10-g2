import { api } from '@/api/client'
import { db, type OutboxEntry } from '@/offline/db'
import { applyResults, type SyncOperationResult } from './conflict'
import { DEFAULT_RETRY_CONFIG, isRetryable, retryDelayMs, type RetryConfig } from './retry'
import { setStatus } from './status'

export async function enqueue(
  op: Omit<OutboxEntry, 'id' | 'clientOpId' | 'createdAt' | 'attempts' | 'lastError'>,
): Promise<void> {
  const entry: OutboxEntry = {
    ...op,
    clientOpId: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    attempts: 0,
    lastError: null,
  }

  await db.transaction('rw', [db.outbox, db.hourLogs], async () => {
    await db.outbox.add(entry)
    const rowId = entry.payload.id
    if (typeof rowId === 'number') {
      await db.hourLogs.update(rowId, { syncState: 'queued' })
    }
  })

  // Sin esto, el contador "N pendientes" solo se recalcula tras un push
  // exitoso (scheduler.ts:34) y jamás refleja lo que se acaba de encolar
  // mientras no hay conexión.
  setStatus({ pending: await db.outbox.count() })
}

function isOnline(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine
}

function waitForOnline(): Promise<void> {
  if (isOnline()) return Promise.resolve()

  return new Promise((resolve) => {
    const handleOnline = () => {
      window.removeEventListener('online', handleOnline)
      resolve()
    }
    window.addEventListener('online', handleOnline)
  })
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

async function waitBeforeRetry(attempt: number, config: RetryConfig): Promise<void> {
  const deadline = Date.now() + retryDelayMs(attempt, config)
  while (Date.now() < deadline) {
    await waitForOnline()
    await wait(Math.max(0, deadline - Date.now()))
  }
}

async function recordFailure(entries: OutboxEntry[], error: unknown, attempt: number, config: RetryConfig): Promise<void> {
  const lastError = error instanceof Error ? error.message : String(error)
  await db.transaction('rw', [db.outbox, db.hourLogs], async () => {
    for (const entry of entries) {
      const attempts = entry.attempts + attempt
      await db.outbox.update(entry.id as number, { attempts, lastError })
      if (attempts >= config.maxAttempts) {
        const rowId = entry.payload.id
        if (typeof rowId === 'number') {
          await db.hourLogs.update(rowId, { syncState: 'failed', reviewNote: lastError })
        }
      }
    }
  })
}

export async function pushOutbox(config: RetryConfig = DEFAULT_RETRY_CONFIG): Promise<{ applied: number; failed: number }> {
  const entries = (await db.outbox.orderBy('createdAt').limit(500).toArray()).filter((entry) => isRetryable(entry, config))
  if (entries.length === 0) return { applied: 0, failed: 0 }

  for (let attempt = 1; attempt <= config.maxAttempts; attempt += 1) {
    await waitForOnline()
    await db.outbox.bulkUpdate(entries.map((entry) => ({ key: entry.id as number, changes: { attempts: entry.attempts + attempt } })))

    try {
      const ops = entries.map((e) => ({
        clientOpId: e.clientOpId,
        entity: e.entity,
        op: e.op,
        baseVersion: e.baseVersion,
        payload: e.payload,
      }))
      const localIds = new Map(entries.map((e) => [e.clientOpId, Number(e.payload.id)]))
      const { results } = await api<{ results: SyncOperationResult[] }>('/sync/push', {
        method: 'POST',
        body: JSON.stringify({ ops }),
      })

      await applyResults(results, localIds)
      await db.outbox.bulkDelete(entries.map((e) => e.id as number))
      return {
        applied: results.filter((r) => r.status === 'applied').length,
        failed: results.filter((r) => r.status !== 'applied').length,
      }
    } catch (error) {
      await recordFailure(entries, error, attempt, config)
      if (attempt === config.maxAttempts) {
        return { applied: 0, failed: entries.length }
      }
      await waitBeforeRetry(attempt, config)
    }
  }

  return { applied: 0, failed: entries.length }
}
