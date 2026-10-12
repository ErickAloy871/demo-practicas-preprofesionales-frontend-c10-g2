import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, api } from './client'

afterEach(() => {
  localStorage.clear()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('api', () => {
  it('does not restore a token when logout happens during refresh', async () => {
    localStorage.setItem('access_token', 'old_tok')
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) })
      .mockImplementationOnce(async () => {
        localStorage.removeItem('access_token')
        return { ok: true, json: async () => ({ accessToken: 'late-token' }) }
      })
    vi.stubGlobal('fetch', fetchMock)
    await expect(api('/protected')).rejects.toMatchObject({ statusCode: 401 })
    expect(localStorage.getItem('access_token')).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(dispatchSpy).not.toHaveBeenCalled()
  })

  it('discards a private response from the previous session', async () => {
    localStorage.setItem('access_token', 'old_tok')
    localStorage.setItem('session_id', 'previous-session')
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => {
      localStorage.setItem('access_token', 'another-user-token')
      localStorage.setItem('session_id', 'next-session')
      return { ok: true, json: async () => ({ private: 'previous user' }) }
    }))
    await expect(api('/protected')).rejects.toMatchObject({ statusCode: 401 })
  })
  it('attaches the bearer token and returns parsed json', async () => {
    localStorage.setItem('access_token', 'tok')
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 1 }) })
    vi.stubGlobal('fetch', fetchMock)

    await expect(api<{ id: number }>('/offers')).resolves.toEqual({ id: 1 })

    const [, init] = fetchMock.mock.calls[0]
    expect(init.headers.Authorization).toBe('Bearer tok')
    expect(init.credentials).toBe('include')
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
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      method: 'POST',
      credentials: 'include',
    })
    expect(fetchMock.mock.calls[1][1].headers).toBeUndefined()
    const retryCall = fetchMock.mock.calls[2][1]
    expect(retryCall.headers.Authorization).toBe('Bearer new_tok')
    expect(retryCall.credentials).toBe('include')
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
    expect(dispatchSpy).toHaveBeenCalledTimes(1)
  })

  it('dispatches auth:unauthorized if the retried request is still unauthorized', async () => {
    localStorage.setItem('access_token', 'old_tok')
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ accessToken: 'new_tok' }) })
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) })
    vi.stubGlobal('fetch', fetchMock)

    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

    await expect(api('/protected')).rejects.toMatchObject({ statusCode: 401 })

    expect(dispatchSpy.mock.calls.filter(([event]) => event.type === 'auth:unauthorized')).toHaveLength(1)
  })

  it('does not try refreshing again when the logout endpoint returns 401', async () => {
    localStorage.setItem('access_token', 'expired-token')
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'unauthorized' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(api('/auth/logout', { method: 'POST' })).rejects.toBeInstanceOf(ApiError)

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
