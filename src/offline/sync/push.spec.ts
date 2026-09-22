import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/api/client'
import { db } from '@/offline/db'
import { enqueue, pushOutbox } from './push'

vi.mock('@/api/client', () => ({ api: vi.fn() }))

const mockedApi = vi.mocked(api)

beforeEach(async () => {
  await db.delete()
  await db.open()
  mockedApi.mockReset()
})

describe('enqueue', () => {
  it('adds an outbox entry and marks the local hour log as queued', async () => {
    await db.hourLogs.put({
      id: 9,
      placementId: 1,
      date: '2026-04-01',
      startTime: '08:00',
      endTime: '12:00',
      hours: 4,
      activity: 'Soporte',
      status: 'SUBMITTED',
      version: 1,
      updatedAt: '2026-04-01T00:00:00.000Z',
      syncState: 'local',
    })

    await enqueue({
      entity: 'hourLog',
      op: 'create',
      payload: { id: 9, hours: 4 },
      baseVersion: null,
    })

    await expect(db.outbox.count()).resolves.toBe(1)
    await expect(db.hourLogs.get(9)).resolves.toMatchObject({ syncState: 'queued' })
  })
})

describe('pushOutbox', () => {
  it('no llama a la red cuando el outbox está vacío', async () => {
    const result = await pushOutbox()

    expect(result).toEqual({ applied: 0, failed: 0 })
    expect(api).not.toHaveBeenCalled()
  })

  it('envía las operaciones en cola, vacía el outbox y aplica los resultados', async () => {
    await db.hourLogs.put({
      id: 10,
      placementId: 1,
      date: '2026-04-01',
      startTime: '08:00',
      endTime: '12:00',
      hours: 4,
      activity: 'Soporte',
      status: 'SUBMITTED',
      version: 1,
      updatedAt: '2026-04-01T00:00:00.000Z',
      syncState: 'local',
    })
    await enqueue({
      entity: 'hourLog',
      op: 'create',
      payload: { id: 10, hours: 4 },
      baseVersion: null,
    })
    const [entry] = await db.outbox.toArray()

    mockedApi.mockResolvedValue({
      results: [{ clientOpId: entry.clientOpId, status: 'applied', server: { id: 10, version: 2 }, reason: null }],
    })

    const result = await pushOutbox()

    expect(result).toEqual({ applied: 1, failed: 0 })
    await expect(db.outbox.count()).resolves.toBe(0)
    await expect(db.hourLogs.get(10)).resolves.toMatchObject({ syncState: 'synced', version: 2 })
  })

  it('reintenta con espera creciente y deja la operación fallida al agotar el máximo', async () => {
    await db.hourLogs.put({
      id: 11,
      placementId: 1,
      date: '2026-04-01',
      startTime: '08:00',
      endTime: '12:00',
      hours: 4,
      activity: 'Soporte',
      status: 'SUBMITTED',
      version: 1,
      updatedAt: '2026-04-01T00:00:00.000Z',
      syncState: 'local',
    })
    await enqueue({ entity: 'hourLog', op: 'create', payload: { id: 11, hours: 4 }, baseVersion: null })
    mockedApi.mockRejectedValue(new Error('sin conexión'))
    vi.useFakeTimers()

    try {
      const promise = pushOutbox({ baseDelayMs: 10, maxDelayMs: 20, maxAttempts: 3 })
      await vi.runAllTimersAsync()
      await expect(promise).resolves.toEqual({ applied: 0, failed: 1 })
    } finally {
      vi.useRealTimers()
    }

    expect(mockedApi).toHaveBeenCalledTimes(3)
    await expect(db.outbox.toArray()).resolves.toMatchObject([{ attempts: 3, lastError: 'sin conexión' }])
    await expect(db.hourLogs.get(11)).resolves.toMatchObject({ syncState: 'failed', reviewNote: 'sin conexión' })
  })

  it('espera a recuperar la conexión antes de iniciar un intento', async () => {
    await db.hourLogs.put({
      id: 12,
      placementId: 1,
      date: '2026-04-01',
      startTime: '08:00',
      endTime: '12:00',
      hours: 4,
      activity: 'Soporte',
      status: 'SUBMITTED',
      version: 1,
      updatedAt: '2026-04-01T00:00:00.000Z',
      syncState: 'local',
    })
    await enqueue({ entity: 'hourLog', op: 'create', payload: { id: 12, hours: 4 }, baseVersion: null })
    mockedApi.mockResolvedValue({ results: [] })
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false })

    const promise = pushOutbox({ baseDelayMs: 1, maxDelayMs: 1, maxAttempts: 1 })
    await Promise.resolve()
    expect(mockedApi).not.toHaveBeenCalled()

    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true })
    window.dispatchEvent(new Event('online'))
    await expect(promise).resolves.toEqual({ applied: 0, failed: 0 })
  })
})
