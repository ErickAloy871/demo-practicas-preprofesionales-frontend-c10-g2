import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { setStatus } from '@/offline/sync/status'
import { useSyncStatus } from './useSyncStatus'

describe('useSyncStatus', () => {
  beforeEach(() => {
    setStatus({ online: true, pending: 0, syncing: false, lastSyncAt: null })
  })

  it('obtiene el estado de sincronización actual en el montaje', () => {
    setStatus({ online: true, pending: 3, syncing: true, lastSyncAt: '2026-04-01T10:00:00.000Z' })

    const { result } = renderHook(() => useSyncStatus())

    expect(result.current).toEqual({
      online: true,
      pending: 3,
      syncing: true,
      lastSyncAt: '2026-04-01T10:00:00.000Z',
    })
  })

  it('se actualiza reactivamente cuando cambia el estado de sincronización', () => {
    const { result } = renderHook(() => useSyncStatus())

    expect(result.current.syncing).toBe(false)
    expect(result.current.pending).toBe(0)

    act(() => {
      setStatus({ pending: 5, syncing: true, lastSyncAt: null })
    })

    expect(result.current).toMatchObject({
      pending: 5,
      syncing: true,
      lastSyncAt: null,
    })

    act(() => {
      setStatus({ pending: 0, syncing: false, lastSyncAt: '2026-04-02T12:00:00.000Z' })
    })

    expect(result.current).toMatchObject({
      pending: 0,
      syncing: false,
      lastSyncAt: '2026-04-02T12:00:00.000Z',
    })
  })
})
