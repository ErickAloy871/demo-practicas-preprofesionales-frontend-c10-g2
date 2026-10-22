import type { ReactNode } from 'react'

interface HeroPanelProps {
  title: ReactNode
  description: ReactNode
  /** Bloque de la derecha: atajos o datos de contexto. */
  aside?: ReactNode
  children?: ReactNode
}

/** Panel teñido de la parte alta de una pantalla: lo que hay que atender hoy. */
export function HeroPanel({ title, description, aside, children }: HeroPanelProps) {
  return (
    <section className="relative flex flex-wrap items-center justify-between gap-x-8 gap-y-5 overflow-hidden rounded-2xl border border-stamp/15 bg-gradient-to-br from-hero via-hero to-[hsl(212_55%_86%)] px-7 py-6 shadow-[0_2px_8px_-2px_rgba(14,58,107,0.07)]">
      <div className="min-w-[280px] flex-1">
        <h2 className="font-display text-22 font-bold tracking-[-0.01em] text-ink">{title}</h2>
        <p className="mt-1.5 max-w-[540px] text-14 leading-relaxed text-inkDeep">{description}</p>
        {children ? <div className="mt-4 max-w-[560px]">{children}</div> : null}
      </div>
      {aside ? <div className="flex flex-wrap gap-2.5">{aside}</div> : null}
    </section>
  )
}

/** Pastilla blanca con un dato, para el costado del panel. */
export function HeroCard({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="w-[190px] rounded-xl border border-line/75 bg-surface px-4 py-3.5 shadow-xs transition-shadow hover:shadow-sm">
      <div className="text-12 font-medium text-inkSoft">{label}</div>
      <div className="mt-1.5 font-display text-15 font-semibold leading-snug text-ink">
        {children}
      </div>
    </div>
  )
}
