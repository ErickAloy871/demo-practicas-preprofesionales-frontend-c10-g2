import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/offline/db'
import { pullChanges } from './pull'
import { pushOutbox } from './push'
import { startSync, syncNow } from './scheduler'
import { getStatus, subscribe, type SyncStatus } from './status'

vi.spyOn(db.outbox, 'count').mockResolvedValue(3)

vi.mock('./pull', () => ({ pullChanges: vi.fn() }))
vi.mock('./push', () => ({ pushOutbox: vi.fn() }))

const mockedPull = vi.mocked(pullChanges)
const mockedPush = vi.mocked(pushOutbox)

beforeEach(async () => {
  await db.delete()
  await db.open()
  localStorage.clear()
  mockedPull.mockReset()
  mockedPush.mockReset()
})

describe('syncNow', () => {
  it('no sincroniza sin sesión activa', async () => {
    await syncNow()

    expect(mockedPull).not.toHaveBeenCalled()
    expect(mockedPush).not.toHaveBeenCalled()
  })

  it('hace pull hasta agotar hasMore y luego push cuando hay sesión', async () => {
    localStorage.setItem('access_token', 'tok')
    mockedPull
      .mockResolvedValueOnce({ applied: 1, hasMore: true })
      .mockResolvedValueOnce({ applied: 0, hasMore: false })
    mockedPush.mockResolvedValue({ applied: 0, failed: 0 })

    await syncNow()

    expect(mockedPull).toHaveBeenCalledTimes(2)
    expect(mockedPush).toHaveBeenCalledTimes(1)
    expect(getStatus().syncing).toBe(false)
  })

  it('reutiliza la corrida en curso si ya hay una sincronización en vuelo', async () => {
    localStorage.setItem('access_token', 'tok')
    mockedPull.mockResolvedValue({ applied: 0, hasMore: false })
    mockedPush.mockResolvedValue({ applied: 0, failed: 0 })

    await Promise.all([syncNow(), syncNow()])

    expect(mockedPush).toHaveBeenCalledTimes(1)
  })

  it('atrapa errores de red y deja de sincronizar sin propagar la excepción', async () => {
    localStorage.setItem('access_token', 'tok')
    mockedPull.mockRejectedValue(new Error('sin conexión'))

    await expect(syncNow()).resolves.toBeUndefined()
    expect(getStatus().syncing).toBe(false)
  })

  it('utiliza navigator.locks si está disponible para evitar colisiones entre pestañas', async () => {
    localStorage.setItem('access_token', 'tok')
    mockedPull.mockResolvedValue({ applied: 0, hasMore: false })
    mockedPush.mockResolvedValue({ applied: 0, failed: 0 })

    const requestMock = vi.fn().mockImplementation((name, options, cb) => {
      return cb({}) // Simulate lock acquired
    })

    vi.stubGlobal('navigator', { locks: { request: requestMock } })

    await syncNow()

    expect(requestMock).toHaveBeenCalledWith('yura-sync-lock', { ifAvailable: true }, expect.any(Function))
    
    vi.unstubAllGlobals()
  })

  it('no hace nada si navigator.locks deniega el lock (otra pestaña sincronizando)', async () => {
    localStorage.setItem('access_token', 'tok')
    mockedPull.mockResolvedValue({ applied: 0, hasMore: false })
    mockedPush.mockResolvedValue({ applied: 0, failed: 0 })

    const requestMock = vi.fn().mockImplementation((name, options, cb) => {
      return cb(null) // Simulate lock denied
    })

    vi.stubGlobal('navigator', { locks: { request: requestMock } })

    await syncNow()

    expect(mockedPull).not.toHaveBeenCalled()
    expect(mockedPush).not.toHaveBeenCalled()
    
    vi.unstubAllGlobals()
  })

  it('nunca expone syncing:false con un pending desactualizado tras el push', async () => {
    localStorage.setItem('access_token', 'tok')
    mockedPull.mockResolvedValue({ applied: 0, hasMore: false })
    mockedPush.mockResolvedValue({ applied: 0, failed: 0 })

    const snapshots: SyncStatus[] = []
    const unsubscribe = subscribe(() => {
      snapshots.push({ ...getStatus() })
    })

    try {
      await syncNow()
    } finally {
      unsubscribe()
    }

    const finalSnapshot = snapshots[snapshots.length - 1]
    expect(finalSnapshot.syncing).toBe(false)
    expect(finalSnapshot.lastSyncAt).not.toBeNull()
    expect(finalSnapshot.pending).toBe(3)

    const finalPending = finalSnapshot.pending
    for (const snap of snapshots) {
      if (snap.syncing === false) {
        expect(snap.pending).toBe(finalPending)
      }
    }

    const syncingFalseCount = snapshots.filter((s) => s.syncing === false).length
    expect(syncingFalseCount).toBe(1)
  })

  it('marca lastSyncAt sólo cuando el push termina sin errores y con pending real', async () => {
    localStorage.setItem('access_token', 'tok')
    mockedPull.mockResolvedValue({ applied: 0, hasMore: false })
    mockedPush.mockResolvedValue({ applied: 0, failed: 0 })

    const before = new Date().toISOString()
    await syncNow()
    const after = new Date().toISOString()

    const final = getStatus()
    expect(final.syncing).toBe(false)
    expect(final.lastSyncAt).not.toBeNull()
    expect(final.lastSyncAt! >= before).toBe(true)
    expect(final.lastSyncAt! <= after).toBe(true)
    expect(final.pending).toBe(3)
  })
})

describe('startSync', () => {
  it('registra los listeners de online/offline y los retira al desmontar', () => {
    mockedPull.mockResolvedValue({ applied: 0, hasMore: false })
    mockedPush.mockResolvedValue({ applied: 0, failed: 0 })

    const addSpy = vi.spyOn(window, 'addEventListener')
    const removeSpy = vi.spyOn(window, 'removeEventListener')

    const stop = startSync()
    expect(addSpy).toHaveBeenCalledWith('online', expect.any(Function))
    expect(addSpy).toHaveBeenCalledWith('offline', expect.any(Function))

    stop()
    expect(removeSpy).toHaveBeenCalledWith('online', expect.any(Function))
    expect(removeSpy).toHaveBeenCalledWith('offline', expect.any(Function))
  })
})
