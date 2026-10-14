const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

export class ApiError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const tokenUsed = localStorage.getItem('access_token')
  const sessionId = localStorage.getItem('session_id')
  const isAuthRequest = ['/auth/login', '/auth/refresh', '/auth/logout'].includes(path)
  const assertSession = () => {
    if (!isAuthRequest && tokenUsed && (
      !localStorage.getItem('access_token') || localStorage.getItem('session_id') !== sessionId
    )) throw new ApiError(401, 'Sesión cerrada.')
  }
  const req = async (tokenOverride?: string) => {
    const token = tokenOverride ?? localStorage.getItem('access_token')
    return fetch(`${API_URL}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    })
  }

  let res = await req(tokenUsed ?? undefined)
  assertSession()

  if (res.status === 401 && tokenUsed && !isAuthRequest) {
    if (!isRefreshing) {
      isRefreshing = true
      const refreshSession = async () => {
        const currentToken = localStorage.getItem('access_token')
        if (currentToken && currentToken !== tokenUsed) return currentToken

        const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        })
        if (!refreshRes.ok) throw new Error('Refresh failed')
        const data = await refreshRes.json()
        assertSession()
        if (typeof data.accessToken !== 'string' || !data.accessToken) throw new Error('Invalid refresh response')
        localStorage.setItem('access_token', data.accessToken)
        return data.accessToken
      }
      refreshPromise = (async () => {
        if (navigator.locks) {
          return navigator.locks.request('auth-session-refresh', refreshSession)
        }
        return refreshSession()
      })().catch(() => {
        if (localStorage.getItem('access_token') && localStorage.getItem('session_id') === sessionId) {
          window.dispatchEvent(new CustomEvent('auth:unauthorized'))
        }
        return null
      }).finally(() => {
        isRefreshing = false
      })
    }

    const newToken = await refreshPromise
    assertSession()
    if (newToken) {
      res = await req(newToken)
      assertSession()
      if (res.status === 401) {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'))
      }
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body.message ?? `Error ${res.status}`)
  }
  const data = await res.json() as T
  assertSession()
  return data
}
