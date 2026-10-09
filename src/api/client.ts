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
  const req = async (tokenOverride?: string) => {
    const token = tokenOverride ?? localStorage.getItem('access_token')
    return fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    })
  }

  let res = await req()

  if (res.status === 401 && path !== '/auth/login' && path !== '/auth/refresh') {
    if (!isRefreshing) {
      isRefreshing = true
      refreshPromise = (async () => {
        const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        })
        if (!refreshRes.ok) throw new Error('Refresh failed')
        const data = await refreshRes.json()
        localStorage.setItem('access_token', data.accessToken)
        return data.accessToken
      })().catch(() => {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'))
        return null
      }).finally(() => {
        isRefreshing = false
      })
    }

    const newToken = await refreshPromise
    if (newToken) {
      res = await req(newToken)
    } else {
       // Si no se pudo renovar, el primer res (que era 401) se procesará y lanzará error
       window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body.message ?? `Error ${res.status}`)
  }
  return res.json() as Promise<T>
}
