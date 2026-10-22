import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/offline/db'
import { getStatus } from '@/offline/sync/status'
import { buildLocalHourLog } from './operation'
import { saveHourLogLocally } from './storage'

const fields = { date: '2026-04-02', startTime: '08:00', endTime: '12:00', hours: '4', activity: 'Soporte' }

beforeEach(async () => {
  await db.delete()
  await db.open()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('persistencia offline del formulario', () => {
  it('guarda y encola sin red, y los datos sobreviven al reabrir IndexedDB', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    const fetch = vi.fn().mockRejectedValue(new Error('Sin conexión'))
    vi.stubGlobal('fetch', fetch)
    const row = buildLocalHourLog(fields, 7, new Date('2026-04-02T15:00:00Z'))
    await saveHourLogLocally(row)
    db.close()
    await db.open()

    expect(await db.hourLogs.get(row.id)).toEqual({ ...row, syncState: 'queued' })
    const entries = await db.outbox.toArray()
    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({
      entity: 'hourLog', op: 'create', baseVersion: null, attempts: 0, lastError: null,
      payload: { id: row.id, hours: 4, activity: 'Soporte' },
    })
    expect(entries[0].clientOpId).toEqual(expect.any(String))
    expect(getStatus().pending).toBe(1)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('revierte la escritura del registro si falla el encolado', async () => {
    vi.spyOn(db.outbox, 'add').mockRejectedValueOnce(new Error('No se puede encolar'))
    const row = buildLocalHourLog(fields, 7)
    await expect(saveHourLogLocally(row)).rejects.toThrow('No se puede encolar')
    expect(await db.hourLogs.count()).toBe(0)
    expect(await db.outbox.count()).toBe(0)
  })
})
