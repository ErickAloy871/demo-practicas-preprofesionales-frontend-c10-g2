import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { SyncGutter, type SyncState } from './SyncGutter'

interface LedgerRowProps {
  syncState: SyncState
  children: ReactNode
  className?: string
  note?: string | null
}

export function LedgerRow({ syncState, children, className, note }: LedgerRowProps) {
  return (
    <div
      className={cn(
        'flex min-h-row items-stretch gap-3 px-[18px] py-2.5 transition-colors hover:bg-well',
        className,
      )}
    >
      <SyncGutter state={syncState} />
      <div className="flex flex-1 flex-col justify-center gap-1">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">{children}</div>
        {syncState === 'failed' && note ? <p className="text-12 text-void">{note}</p> : null}
      </div>
    </div>
  )
}
