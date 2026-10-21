import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface LedgerProps {
  header?: ReactNode
  children: ReactNode
  className?: string
}

export function Ledger({ header, children, className }: LedgerProps) {
  return (
    <div
      className={cn(
        'divide-y divide-paperRule overflow-hidden rounded-2xl border border-line/80 bg-surface shadow-[0_1px_3px_rgba(14,58,107,0.03)]',
        className,
      )}
    >
      {header ? (
        <div className="border-b border-paperRule bg-well/70 font-display text-12 font-medium text-inkSoft">
          {header}
        </div>
      ) : null}
      {children}
    </div>
  )
}

/** Fila de cabecera: mismo reparto de columnas que las filas de datos. */
export function LedgerHeaderRow({ children }: { children: ReactNode }) {
  return (
    <div className="hidden items-center gap-3 px-[18px] py-2.5 sm:flex">
      <span aria-hidden="true" className="block w-1 flex-none" />
      <div className="flex flex-1 items-center gap-3">{children}</div>
    </div>
  )
}
