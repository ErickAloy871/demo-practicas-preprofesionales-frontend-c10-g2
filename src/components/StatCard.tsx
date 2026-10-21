import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type NoteTone = 'neutral' | 'pending' | 'void' | 'stamp'

interface StatCardProps {
  label: ReactNode
  value: ReactNode
  /** Glosa breve junto al número: "de 240", "sin aprobar". */
  note?: ReactNode
  noteTone?: NoteTone
  className?: string
}

export function StatCard({ label, value, note, noteTone = 'neutral', className }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-line/80 bg-surface px-5 py-4 shadow-xs transition-all hover:border-stamp/30 hover:shadow-sm',
        className,
      )}
    >
      <div className="text-12 font-semibold uppercase tracking-wider text-inkMute">{label}</div>
      <div className="mt-2.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <span className="font-data text-26 font-bold leading-none tracking-tight text-ink">
          {value}
        </span>
        {note ? (
          <span
            className={cn(
              'inline-flex items-center rounded-full border px-2 py-0.5 text-11 font-semibold',
              noteTone === 'pending' && 'border-dotPending/25 bg-chipPending text-pending',
              noteTone === 'void' && 'border-dotVoid/25 bg-chipVoid text-void',
              noteTone === 'stamp' && 'border-stamp/25 bg-chipStamp text-stamp',
              noteTone === 'neutral' && 'border-line bg-soft text-inkSoft',
            )}
          >
            {note}
          </span>
        ) : null}
      </div>
    </div>
  )
}

/** Rejilla de KPIs: se adapta al ancho sin romper la altura de las tarjetas. */
export function StatGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3">{children}</div>
  )
}
