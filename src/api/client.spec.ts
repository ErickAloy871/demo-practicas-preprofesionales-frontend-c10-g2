import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, api } from './client'

afterEach(() => vi.unstubAllGlobals())

describe('api', () => {
  it('attaches the bearer token and returns parsed json', async () => {
    localStorage.setItem('access_token', 'tok')
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 1 }) })
    vi.stubGlobal('fetch', fetchMock)

    await expect(api<{ id: number }>('/offers')).resolves.toEqual({ id: 1 })

    const [, init] = fetchMock.mock.calls[0]
    expect(init.headers.Authorization).toBe('Bearer tok')
  })

  it('throws ApiError carrying the backend message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 403,
      json: async () => ({ statusCode: 403, message: 'rol insuficiente' }),
    }))

    await expect(api('/offers')).rejects.toMatchObject({ statusCode: 403, message: 'rol insuficiente' })
    await expect(api('/offers')).rejects.toBeInstanceOf(ApiError)
  })

  it('attempts to refresh token on 401 and retries original request', async () => {
    localStorage.setItem('access_token', 'old_tok')
    
    // fetch will be called 3 times:
    // 1. Original request -> 401
    // 2. Refresh request -> 200 with new token
    // 3. Retry original request -> 200 with data
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ accessToken: 'new_tok' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 2 }) })
    
    vi.stubGlobal('fetch', fetchMock)

    const result = await api<{ id: number }>('/protected')
    expect(result).toEqual({ id: 2 })
    
    // Check if new token is set
    expect(localStorage.getItem('access_token')).toBe('new_tok')
    
    // Verify fetch calls
    expect(fetchMock).toHaveBeenCalledTimes(3)
    const retryCall = fetchMock.mock.calls[2][1]
    expect(retryCall.headers.Authorization).toBe('Bearer new_tok')
  })

  it('dispatches auth:unauthorized if refresh fails', async () => {
    localStorage.setItem('access_token', 'old_tok')
    
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) })
    
    vi.stubGlobal('fetch', fetchMock)
    
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

    await expect(api('/protected')).rejects.toThrow(ApiError)
    
    expect(dispatchSpy).toHaveBeenCalled()
    const eventArg = dispatchSpy.mock.calls[0][0] as CustomEvent
    expect(eventArg.type).toBe('auth:unauthorized')
  })
})
