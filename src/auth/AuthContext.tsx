import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import { db } from '@/offline/db'
import { setStatus } from '@/offline/sync/status'

export type Role = 'STUDENT' | 'TUTOR' | 'COMPANY' | 'COORDINATOR'

export interface AuthUser {
  id: number
  email: string
  fullName: string
  role: Role
  // Solo relevante para Role.COMPANY (ver User.companyId en el backend); el
  // resto de roles lo trae null. CompanyOffersPage lo usa para armar
  // CreateOfferDto sin tener que adivinar o listar todas las empresas.
  companyId: number | null
}

interface LoginResponse {
  accessToken: string
  user: AuthUser
}

interface AuthContextValue {
  user: AuthUser | null
  role: Role | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredUser(): AuthUser | null {
  if (!localStorage.getItem('access_token')) return null
  const raw = localStorage.getItem('user')
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser())
  const navigate = useNavigate()
  const logoutInProgress = useRef(false)
  const cleanup = useRef<Promise<void>>(Promise.resolve())

  async function login(email: string, password: string) {
    await cleanup.current
    const { accessToken, user: loggedUser } = await api<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('session_id', crypto.randomUUID())
    localStorage.setItem('user', JSON.stringify(loggedUser))
    setUser(loggedUser)
  }

  const clearLocalSession = useCallback(async () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    localStorage.removeItem('session_id')
    sessionStorage.clear()
    setUser(null)
    setStatus({ pending: 0, syncing: false, lastSyncAt: null })
    await db.transaction('rw', db.tables, async () => {
      await Promise.all(db.tables.map((table) => table.clear()))
    })
  }, [])

  // Una máquina de laboratorio compartida es el caso normal de este dominio:
  // si no se borra Dexie, el checkpoint de sync y los datos del estudiante
  // anterior sobreviven a esta sesión y contaminan la del siguiente.
  const logout = useCallback(async (reason?: string) => {
    if (logoutInProgress.current) return
    logoutInProgress.current = true
    try {
      let message = reason
      const token = localStorage.getItem('access_token')
      const localCleanup = clearLocalSession()
      navigate('/login', { replace: true, state: { message } })
      const serverLogout = api('/auth/logout', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: AbortSignal.timeout(5000),
      }).catch(() => {
        message = [reason, 'No se pudo confirmar el cierre de sesión en el servidor.']
          .filter(Boolean)
          .join(' ')
      })
      cleanup.current = Promise.all([localCleanup, serverLogout]).then(() => undefined)
      await cleanup.current
      navigate('/login', { replace: true, state: { message } })
    } finally {
      logoutInProgress.current = false
    }
  }, [clearLocalSession, navigate])

  useEffect(() => {
    function handleUnauthorized() {
      logout('Tu sesión ha expirado.').catch((error: unknown) => {
        console.error('No se pudo limpiar la sesión local', error)
      })
    }
    
    function handleStorageChange(event: StorageEvent) {
      if ((event.key === 'access_token' || event.key === null) && !event.newValue) {
        cleanup.current = clearLocalSession()
        cleanup.current.catch(console.error)
        navigate('/login', { replace: true, state: { message: 'Sesión cerrada en otra pestaña.' } })
      }
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [clearLocalSession, logout, navigate])

  useEffect(() => {
    if (!user) return
    const checkExpiration = () => {
      const token = localStorage.getItem('access_token')
      if (!token) return
      try {
        const encoded = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
        const payload = JSON.parse(atob(encoded)) as { exp?: number }
        if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp) || payload.exp * 1000 <= Date.now()) {
          logout('Tu sesión ha expirado. Inicia sesión nuevamente.').catch(console.error)
        }
      } catch {
        // El servidor rechaza tokens corruptos; no interrumpir el render del cliente.
      }
    }
    checkExpiration()
    const interval = window.setInterval(checkExpiration, 1000)
    window.addEventListener('focus', checkExpiration)
    document.addEventListener('visibilitychange', checkExpiration)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', checkExpiration)
      document.removeEventListener('visibilitychange', checkExpiration)
    }
  }, [user, logout])

  return (
    <AuthContext.Provider value={{ user, role: user?.role ?? null, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
