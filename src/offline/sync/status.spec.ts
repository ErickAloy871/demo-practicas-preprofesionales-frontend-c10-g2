import { afterAll, describe, expect, it, vi } from 'vitest'
import { channel, getStatus, setStatus, subscribe } from './status'

afterAll(() => {
  if (channel) channel.close()
})

describe('sync status store', () => {
  it('merges a partial patch into the current status', () => {
    setStatus({ pending: 3 })
    expect(getStatus()).toMatchObject({ pending: 3 })

    setStatus({ syncing: true })
    expect(getStatus()).toMatchObject({ pending: 3, syncing: true })
  })

  it('notifies subscribers on every update and stops after unsubscribing', () => {
    const listener = vi.fn()
    const unsubscribe = subscribe(listener)

    setStatus({ online: false })
    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()
    setStatus({ online: true })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('broadcasts status changes to other tabs and handles incoming messages', () => {
    if (channel) {
      const postMessageSpy = vi.spyOn(channel, 'postMessage')
      setStatus({ pending: 5 })
      expect(postMessageSpy).toHaveBeenCalledWith({ pending: 5 })

      const listener = vi.fn()
      subscribe(listener)
      channel.onmessage!({ data: { pending: 10, syncing: true } } as MessageEvent)
      
      expect(getStatus().pending).toBe(10)
      expect(getStatus().syncing).toBe(true)
      expect(listener).toHaveBeenCalled()
    }
  })
})
