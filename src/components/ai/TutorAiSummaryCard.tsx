import { useState } from 'react'
import { Sparkles, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'
import { generateTutorAiSummary } from '@/lib/tutor-ai-summary'

interface TutorAiSummaryCardProps {
  logs: Array<{ hours: number; activity: string; date: string }>
}

export function TutorAiSummaryCard({ logs }: TutorAiSummaryCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!logs || logs.length === 0) return null

  const summary = generateTutorAiSummary(logs)

  function handleCopy() {
    void navigator.clipboard.writeText(summary.pedagogicalFeedback)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      data-testid="tutor-ai-card"
      className="rounded-xl border border-primary/20 bg-gradient-to-b from-primary/[0.04] via-surface to-surface p-4 shadow-xs transition-all"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-heading text-14 font-semibold text-ink">
              Resumen Ejecutivo con IA
            </h3>
            <p className="text-12 text-inkSoft">
              Auditoría y desglose de competencias en {summary.logsAnalyzed} bitácoras
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden rounded-full border border-dotPassed/30 bg-chipPassed px-2.5 py-0.5 text-11 font-medium text-stamp sm:inline-block">
            Consistencia {summary.consistencyLevel} ({summary.consistencyScore}/100)
          </span>
          <button
            type="button"
            data-testid="tutor-ai-toggle"
            onClick={() => setIsOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-12 font-medium text-ink shadow-xs hover:bg-well"
          >
            <span>{isOpen ? 'Ocultar informe' : 'Ver informe'}</span>
            {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {isOpen ? (
        <div data-testid="tutor-ai-content" className="mt-4 flex flex-col gap-4 border-t border-line/70 pt-4">
          <p className="text-13 leading-relaxed text-ink">{summary.executiveSummary}</p>

          <div className="flex flex-col gap-2">
            <span className="text-11 font-semibold uppercase tracking-wider text-inkSoft">
              Distribución de competencias formativas
            </span>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {summary.competencies.map((comp) => (
                <div key={comp.name} className="flex flex-col gap-1 rounded-lg border border-line/60 bg-well/40 p-2.5">
                  <div className="flex justify-between text-12">
                    <span className="font-medium text-ink">{comp.name}</span>
                    <span className="font-data font-semibold text-primary">
                      {comp.hours}h ({comp.percentage}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${comp.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-line/80 bg-surface p-3">
            <div className="flex items-center justify-between gap-2 pb-1.5">
              <span className="text-11 font-semibold uppercase tracking-wider text-inkSoft">
                Sugerencia de retroalimentación pedagógica
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-11 font-medium text-primary hover:underline"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
            <p className="text-12 leading-relaxed text-inkSoft italic">"{summary.pedagogicalFeedback}"</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
