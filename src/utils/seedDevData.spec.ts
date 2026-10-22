// Tests para buildMockHourLogs (función pura) y seedDexieWithMockData (Dexie/fake-indexeddb)
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/offline/db'
import { buildMockHourLogs, seedDexieWithMockData } from './seedDevData'

describe('buildMockHourLogs', () => {
  it('devuelve exactamente `count` registros', () => {
    const logs = buildMockHourLogs(1, 10)
    expect(logs).toHaveLength(10)
  })

  it('asigna IDs secuenciales a partir de startId', () => {
    const startId = 500
    const logs = buildMockHourLogs(1, 5, startId)
    logs.forEach((log, i) => {
      expect(log.id).toBe(startId + i)
    })
  })

  it('usa startId = 1000 como valor por defecto', () => {
    const logs = buildMockHourLogs(1, 3)
    expect(logs[0].id).toBe(1000)
    expect(logs[1].id).toBe(1001)
    expect(logs[2].id).toBe(1002)
  })

  it('asigna el placementId correcto a todos los registros', () => {
    const placementId = 42
    const logs = buildMockHourLogs(placementId, 8)
    logs.forEach((log) => {
      expect(log.placementId).toBe(placementId)
    })
  })

  it('las fechas decrecen un día por cada registro (el más reciente primero)', () => {
    const logs = buildMockHourLogs(1, 3, 1)
    const dates = logs.map((l) => l.date)
    expect(dates[0] >= dates[1]).toBe(true)
    expect(dates[1] >= dates[2]).toBe(true)
  })

  it('el formato de fecha es YYYY-MM-DD', () => {
    const logs = buildMockHourLogs(1, 1)
    expect(logs[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('el formato de startTime y endTime es HH:mm', () => {
    const logs = buildMockHourLogs(1, 4)
    logs.forEach((log) => {
      expect(log.startTime).toMatch(/^\d{2}:\d{2}$/)
      expect(log.endTime).toMatch(/^\d{2}:\d{2}$/)
    })
  })

  it('las horas son deterministas entre 1 y 4', () => {
    const logs = buildMockHourLogs(1, 8)
    logs.forEach((log) => {
      expect(log.hours).toBeGreaterThanOrEqual(1)
      expect(log.hours).toBeLessThanOrEqual(4)
    })
  })

  it('endTime es siempre posterior a startTime', () => {
    const logs = buildMockHourLogs(1, 8)
    logs.forEach((log) => {
      const [sh] = log.startTime.split(':').map(Number)
      const [eh] = log.endTime.split(':').map(Number)
      expect(eh).toBeGreaterThan(sh)
    })
  })

  it('el status cicla en orden por los cuatro estados', () => {
    const logs = buildMockHourLogs(1, 4)
    expect(logs[0].status).toBe('APPROVED')
    expect(logs[1].status).toBe('SUBMITTED')
    expect(logs[2].status).toBe('DRAFT')
    expect(logs[3].status).toBe('REJECTED')
  })

  it('el syncState cicla entre los cuatro estados de sincronización', () => {
    const logs = buildMockHourLogs(1, 4)
    expect(logs[0].syncState).toBe('synced')
    expect(logs[1].syncState).toBe('queued')
    expect(logs[2].syncState).toBe('local')
    expect(logs[3].syncState).toBe('failed')
  })

  it('asigna reviewNote solo cuando el status es REJECTED', () => {
    const logs = buildMockHourLogs(1, 4)
    // índice 3 → REJECTED
    expect(logs[3].status).toBe('REJECTED')
    expect(logs[3].reviewNote).not.toBeNull()
    // el resto no son REJECTED
    expect(logs[0].reviewNote).toBeNull()
    expect(logs[1].reviewNote).toBeNull()
    expect(logs[2].reviewNote).toBeNull()
  })

  it('todos los registros tienen version = 1', () => {
    const logs = buildMockHourLogs(1, 5)
    logs.forEach((log) => expect(log.version).toBe(1))
  })

  it('updatedAt es un ISO string válido', () => {
    const logs = buildMockHourLogs(1, 5)
    logs.forEach((log) => {
      expect(() => new Date(log.updatedAt)).not.toThrow()
      expect(new Date(log.updatedAt).toISOString()).toBe(log.updatedAt)
    })
  })

  it('devuelve un arreglo vacío cuando count es 0', () => {
    const logs = buildMockHourLogs(1, 0)
    expect(logs).toHaveLength(0)
  })
})

describe('seedDexieWithMockData', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it('inserta exactamente `count` registros en Dexie para el placementId dado', async () => {
    await seedDexieWithMockData(1, 10)

    const count = await db.hourLogs.where('placementId').equals(1).count()
    expect(count).toBe(10)
  })

  it('cuando se llama dos veces, reemplaza los registros previos del mismo placement', async () => {
    await seedDexieWithMockData(1, 20)
    await seedDexieWithMockData(1, 10)

    const count = await db.hourLogs.where('placementId').equals(1).count()
    // Debe haber exactamente 10, no 30
    expect(count).toBe(10)
  })

  it('cuando no se pasa placementId y hay una práctica en Dexie, la usa automáticamente', async () => {
    await db.placements.put({
      id: 99,
      studentId: 5,
      tutorId: 7,
      companyId: 1,
      startDate: '2026-01-01',
      endDate: '2026-06-01',
      requiredHours: 200,
      status: 'ACTIVE',
      version: 1,
      updatedAt: '2026-01-01T00:00:00.000Z',
    })

    await seedDexieWithMockData(undefined, 5)

    const count = await db.hourLogs.where('placementId').equals(99).count()
    expect(count).toBe(5)
  })

  it('cuando no se pasa placementId y no hay prácticas, usa placementId = 1', async () => {
    await seedDexieWithMockData(undefined, 5)

    const count = await db.hourLogs.where('placementId').equals(1).count()
    expect(count).toBe(5)
  })

  it('los registros insertados incluyen id numérico, date, startTime y endTime válidos', async () => {
    await seedDexieWithMockData(1, 3)

    const logs = await db.hourLogs.where('placementId').equals(1).toArray()
    logs.forEach((log) => {
      expect(typeof log.id).toBe('number')
      expect(log.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(log.startTime).toMatch(/^\d{2}:\d{2}$/)
      expect(log.endTime).toMatch(/^\d{2}:\d{2}$/)
    })
  })

  it('los registros insertados no tienen id indefinido (no dispara DataError de IndexedDB)', async () => {
    await seedDexieWithMockData(1, 5)

    const logs = await db.hourLogs.toArray()
    logs.forEach((log) => {
      expect(log.id).toBeDefined()
      expect(log.id).not.toBeNaN()
    })
  })
})
