import { useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  Award,
  BookOpen,
  Briefcase,
  Clock,
  FileText,
  Send,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useAuth, type Role } from '@/auth/AuthContext'
import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/BrandLogo'
import { SyncIndicator } from '@/components/SyncIndicator'
import { startSync } from '@/offline/sync/scheduler'
import { cn } from '@/lib/utils'

const ROLE_LABEL: Record<Role, string> = {
  STUDENT: 'Estudiante',
  TUTOR: 'Tutor',
  COMPANY: 'Empresa',
  COORDINATOR: 'Coordinador',
}

interface NavItem {
  path: string
  label: string
  icon: LucideIcon
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const NAV_BY_ROLE: Record<Role, NavGroup[]> = {
  STUDENT: [
    {
      title: 'Mi práctica',
      items: [
        { path: '/mi-practica', label: 'Inicio', icon: BookOpen },
        { path: '/horas', label: 'Mis horas', icon: Clock },
        { path: '/documentos', label: 'Documentos', icon: FileText },
      ],
    },
    {
      title: 'Buscar práctica',
      items: [
        { path: '/ofertas', label: 'Ofertas', icon: Briefcase },
        { path: '/postulaciones', label: 'Mis postulaciones', icon: Send },
      ],
    },
  ],
  TUTOR: [
    {
      title: 'Prácticas',
      items: [{ path: '/practicantes', label: 'Mis practicantes', icon: Users }],
    },
  ],
  COMPANY: [
    {
      title: 'Reclutamiento',
      items: [{ path: '/ofertas-empresa', label: 'Mis ofertas', icon: Briefcase }],
    },
  ],
  COORDINATOR: [
    {
      title: 'Cierre',
      items: [{ path: '/acreditacion', label: 'Acreditación', icon: Award }],
    },
  ],
}

function initialsOf(fullName: string | undefined): string {
  if (!fullName) return '··'
  const parts = fullName.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const second = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : ''
  return (first + second).toUpperCase() || '··'
}

export function AppLayout() {
  const { user, role, logout } = useAuth()

  // Se llama una sola vez para toda la sesión autenticada: AppLayout envuelve
  // todas las rutas protegidas vía <Outlet />, así que no se remonta al
  // navegar entre pantallas y no se crean timers duplicados.
  useEffect(() => {
    return startSync()
  }, [])

  const navGroups = role ? NAV_BY_ROLE[role] : []

  return (
    <div className="flex min-h-screen flex-col bg-paper md:h-screen md:overflow-hidden">
      <header className="flex h-topbar flex-none items-center gap-4 border-b-2 border-stamp bg-surface px-[18px] shadow-xs">
        <div className="flex flex-none items-center gap-2.5">
          <BrandLogo size="sm" />
          <div className="flex flex-col leading-none">
            <span className="font-display text-17 font-bold tracking-[-0.02em] text-ink">
              prácticas.
            </span>
            <span className="hidden font-medium text-11 text-inkMute sm:block">
              Gestión académica
            </span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2.5 rounded-full border border-line/80 bg-well/60 py-1 pl-1 pr-3 shadow-xs">
            <span
              aria-hidden="true"
              className="flex size-7 flex-none items-center justify-center rounded-full bg-stamp text-12 font-semibold !text-white shadow-xs"
            >
              {initialsOf(user?.fullName)}
            </span>
            <span className="hidden leading-tight sm:block">
              <span className="block text-13 font-semibold text-ink">{user?.fullName}</span>
              <span className="block text-11 text-inkSoft">{role ? ROLE_LABEL[role] : ''}</span>
            </span>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => void logout()}>
            Salir
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:grid md:grid-cols-[theme(width.sidebar)_1fr]">
        <div className="flex min-h-0 flex-col gap-3 px-3.5 py-3.5 md:pr-2">
          <nav
            aria-label="Navegación principal"
            className="flex min-h-0 flex-1 flex-col gap-3.5 md:overflow-y-auto"
          >
            {navGroups.map((group) => (
              <div key={group.title}>
                <div className="px-2.5 pb-1.5 text-11 uppercase tracking-[0.07em] text-inkMute">
                  {group.title}
                </div>
                <div className="flex flex-wrap gap-1 md:flex-col md:flex-nowrap">
                  {group.items.map((item) => {
                    const Icon = item.icon
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                          cn(
                            'flex h-9 items-center gap-2.5 rounded-lg px-3 text-14 transition-all',
                            isActive
                              ? 'bg-stamp !text-white font-semibold shadow-xs'
                              : 'text-inkBody hover:bg-well/80 hover:text-ink font-medium',
                          )
                        }
                      >
                        <Icon className="size-4 shrink-0 stroke-[2]" />
                        <span>{item.label}</span>
                      </NavLink>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          <SyncIndicator />
        </div>

        <main className="min-h-0 min-w-0 px-4 pb-6 md:overflow-y-auto md:pl-2">
          <div className="flex flex-col gap-4 pt-3.5">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
