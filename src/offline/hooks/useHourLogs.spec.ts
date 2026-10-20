import { renderHook, waitFor, act } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { db, type LocalHourLog } from '@/offline/db'
import { useHourLogs } from './useHourLogs'

const sampleLog1: LocalHourLog = {
  id: 1,
  placementId: 10,
  date: '2026-04-02',
  startTime: '08:00',
  endTime: '12:00',
  hours: 4,
  activity: 'Desarrollo frontend',
  status: 'SUBMITTED',
  version: 1,
  updatedAt: '2026-04-02T12:00:00.000Z',
  syncState: 'synced',
}

const sampleLog2: LocalHourLog = {
  id: 2,
  placementId: 10,
  date: '2026-04-01',
  startTime: '14:00',
  endTime: '18:00',
  hours: 4,
  activity: 'Pruebas unitarias',
  status: 'APPROVED',
  version: 1,
  updatedAt: '2026-04-01T18:00:00.000Z',
  syncState: 'synced',
}

const otherPlacementLog: LocalHourLog = {
  id: 3,
  placementId: 99,
  date: '2026-04-03',
  startTime: '08:00',
  endTime: '12:00',
  hours: 4,
  activity: 'Otra práctica',
  status: 'DRAFT',
  version: 1,
  updatedAt: '2026-04-03T12:00:00.000Z',
  syncState: 'queued',
}

describe('useHourLogs', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it('inicia en estado de carga (undefined)', () => {
    const { result } = renderHook(() => useHourLogs(10))
    expect(result.current).toBeUndefined()
  })

  it('retorna una colección vacía cuando no existen registros para el placement', async () => {
    const { result } = renderHook(() => useHourLogs(10))

    await waitFor(() => {
      expect(result.current).toEqual([])
    })
  })

  it('retorna los datos presentes ordenados por fecha cuando existen registros', async () => {
    await db.hourLogs.bulkPut([sampleLog1, sampleLog2, otherPlacementLog])

    const { result } = renderHook(() => useHourLogs(10))

    await waitFor(() => {
      expect(result.current).toBeDefined()
      expect(result.current).toHaveLength(2)
    })

    // Debe filtrar únicamente por placementId y ordenar ascendentemente por fecha
    expect(result.current).toEqual([sampleLog2, sampleLog1])
  })

  it('actualiza los registros reactivamente ante cambios en la base local', async () => {
    await db.hourLogs.put(sampleLog2)

    const { result } = renderHook(() => useHourLogs(10))

    await waitFor(() => {
      expect(result.current).toEqual([sampleLog2])
    })

    // Insertar un nuevo log en tiempo real
    await act(async () => {
      await db.hourLogs.put(sampleLog1)
    })

    await waitFor(() => {
      expect(result.current).toHaveLength(2)
      expect(result.current).toEqual([sampleLog2, sampleLog1])
    })

    // Eliminar un registro en tiempo real
    await act(async () => {
      await db.hourLogs.delete(sampleLog2.id)
    })

    await waitFor(() => {
      expect(result.current).toEqual([sampleLog1])
    })
  })

  it('actualiza la consulta al cambiar de placementId', async () => {
    await db.hourLogs.bulkPut([sampleLog1, otherPlacementLog])

    const { result, rerender } = renderHook(({ id }) => useHourLogs(id), {
      initialProps: { id: 10 },
    })

    await waitFor(() => {
      expect(result.current).toEqual([sampleLog1])
    })

    rerender({ id: 99 })

    await waitFor(() => {
      expect(result.current).toEqual([otherPlacementLog])
    })
  })
})
