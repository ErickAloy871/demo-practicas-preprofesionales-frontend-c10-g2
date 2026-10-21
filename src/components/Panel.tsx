import type { ReactNode } from 'react'
import { AlertCircle, FolderKanban, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PanelProps {
  /** Barra superior del panel, separada por una regla. */
  toolbar?: ReactNode
  children: ReactNode
  className?: string
}

/** Contenedor blanco de esquinas grandes: la caja base de listados y tablas. */
export function Panel({ toolbar, children, className }: PanelProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-line/80 bg-surface shadow-[0_1px_3px_rgba(14,58,107,0.03)] transition-all',
        className,
      )}
    >
      {toolbar ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-paperRule bg-well/40 px-[18px] py-3.5">
          {toolbar}
        </div>
      ) : null}
      {children}
    </div>
  )
}

interface SectionProps {
  title: ReactNode
  /** Dato o enlace alineado a la derecha del título. */
  aside?: ReactNode
  children: ReactNode
  className?: string
}

/** Panel con cabecera de sección: título a la izquierda, dato a la derecha. */
export function Section({ title, aside, children, className }: SectionProps) {
  return (
    <Panel className={className}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-paperRule bg-well/20 px-[18px] py-3.5">
        <h2 className="font-display text-15 font-semibold text-ink">{title}</h2>
        {aside}
      </div>
      {children}
    </Panel>
  )
}

/**
 * Reparto y aire de una fila de listado, compartido por todas las tablas que
 * no llevan canalón de sincronización.
 */
export const rowClass =
  'flex min-h-row flex-col justify-center gap-1 px-[18px] py-2.5 transition-colors hover:bg-well sm:flex-row sm:items-center sm:gap-3'

/** Fila de cabecera de una tabla sin canalón. */
export function TableHeaderRow({ children }: { children: ReactNode }) {
  return <div className="hidden items-center gap-3 px-[18px] py-2.5 sm:flex">{children}</div>
}

interface EmptyStateProps {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-5 py-14 text-center">
      <div
        aria-hidden="true"
        className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-chipStamp/50 text-stamp ring-8 ring-chipStamp/20"
      >
        <FolderKanban className="size-6 stroke-[1.75]" />
      </div>
      <p className="font-display text-16 font-semibold text-ink">{title}</p>
      {description ? <p className="max-w-[420px] text-14 text-inkMid">{description}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  )
}

/** Mensaje de error de carga, con el mismo aire que el estado vacío. */
export function ErrorState({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-2 px-5 py-14 text-center text-14 text-void"
    >
      <div
        aria-hidden="true"
        className="flex size-10 items-center justify-center rounded-full bg-chipVoid text-void ring-4 ring-chipVoid/30"
      >
        <AlertCircle className="size-5" />
      </div>
      <p>{children}</p>
    </div>
  )
}

export function LoadingState({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 px-5 py-14 text-center">
      <Loader2 className="size-5 animate-spin text-stamp" />
      <p className="text-14 text-inkSoft">{children}</p>
    </div>
  )
}

interface AsyncSectionProps<T> {
  /** Mensaje de error de carga; tiene prioridad sobre el resto. */
  error?: string | null
  /** `undefined` mientras carga, arreglo vacío cuando no hay nada. */
  data: T[] | undefined
  loadingLabel: ReactNode
  empty: ReactNode
  children: (data: T[]) => ReactNode
}

/**
 * Resuelve los cuatro estados de un listado — error, cargando, vacío y con
 * datos — para que cada pantalla no repita la misma escalera de ternarios.
 * Los tres primeros van dentro de su propio panel; el contenido decide su
 * envoltorio.
 */
export function AsyncSection<T>({
  error,
  data,
  loadingLabel,
  empty,
  children,
}: AsyncSectionProps<T>) {
  if (error) {
    return (
      <Panel>
        <ErrorState>{error}</ErrorState>
      </Panel>
    )
  }
  if (data === undefined) {
    return (
      <Panel>
        <LoadingState>{loadingLabel}</LoadingState>
      </Panel>
    )
  }
  if (data.length === 0) return <Panel>{empty}</Panel>
  return <>{children(data)}</>
}
