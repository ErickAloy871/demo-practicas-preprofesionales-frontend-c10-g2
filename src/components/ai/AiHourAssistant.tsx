import { useState } from 'react'
import { Sparkles, Check, ArrowRight, X } from 'lucide-react'
import { analyzeActivity, type AiAnalysisResult } from '@/lib/ai-assistant'

interface AiHourAssistantProps {
  currentActivity: string
  onSelectSuggestion: (text: string) => void
}

export function AiHourAssistant({ currentActivity, onSelectSuggestion }: AiHourAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [analysis, setAnalysis] = useState<AiAnalysisResult | null>(null)
  const [appliedIndex, setAppliedIndex] = useState<number | null>(null)

  function handleAnalyze() {
    const result = analyzeActivity(currentActivity)
    setAnalysis(result)
    setIsOpen(true)
    setAppliedIndex(null)
  }

  function handleApply(suggestion: string, index: number) {
    onSelectSuggestion(suggestion)
    setAppliedIndex(index)
    setTimeout(() => {
      setAppliedIndex(null)
      setIsOpen(false)
    }, 450)
  }

  const levelColor =
    analysis?.level === 'Profesional'
      ? 'border-dotPassed/30 bg-chipPassed text-stamp'
      : analysis?.level === 'Aceptable'
        ? 'border-dotPending/30 bg-chipPending text-pending'
        : 'border-line bg-well text-inkSoft'

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleAnalyze}
          data-testid="ai-assistant-trigger"
          className="group inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/5 px-2.5 py-1 text-12 font-medium text-primary transition-all hover:border-primary/45 hover:bg-primary/10 hover:shadow-sm"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary transition-transform group-hover:rotate-12" />
          <span>✨ Mejorar con IA</span>
        </button>
      </div>

      {isOpen && analysis ? (
        <div
          data-testid="ai-assistant-panel"
          className="relative flex flex-col gap-3 rounded-xl border border-primary/20 bg-gradient-to-b from-primary/[0.03] to-surface p-3.5 shadow-sm transition-all"
        >
          <div className="flex items-start justify-between gap-2 border-b border-line/60 pb-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-heading text-13 font-semibold text-ink">Copiloto IA Técnico</span>
              <span className={`rounded-full border px-2 py-0.5 text-11 font-medium ${levelColor}`}>
                Calidad: {analysis.level} ({analysis.score}/100)
              </span>
              <span className="rounded-full border border-stamp/20 bg-chipStamp/40 px-2 py-0.5 text-11 font-medium text-stamp">
                ~{analysis.approvalProbability}% aprobación estimada
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar asistente IA"
              className="rounded-md p-1 text-inkSoft hover:bg-well hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="text-12 text-inkSoft">{analysis.feedback}</p>

          {analysis.competencies.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-11 font-medium text-inkSoft">Competencias:</span>
              {analysis.competencies.map((comp) => (
                <span
                  key={comp}
                  className="rounded-md border border-line bg-well/80 px-2 py-0.5 text-11 font-medium text-ink"
                >
                  {comp}
                </span>
              ))}
            </div>
          ) : null}

          {analysis.suggestions.length > 0 ? (
            <div className="flex flex-col gap-2 pt-1">
              <span className="text-11 font-semibold uppercase tracking-wider text-inkSoft">
                Sugerencias de redacción formal:
              </span>
              {analysis.suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="group flex flex-col gap-2 rounded-lg border border-line/80 bg-surface p-2.5 transition-colors hover:border-primary/40 hover:bg-primary/[0.02]"
                >
                  <p className="text-12 leading-relaxed text-ink">{suggestion}</p>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      data-testid={`ai-apply-btn-${index}`}
                      onClick={() => handleApply(suggestion, index)}
                      className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-12 font-medium text-primary hover:bg-primary hover:text-white transition-colors"
                    >
                      {appliedIndex === index ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>¡Aplicado!</span>
                        </>
                      ) : (
                        <>
                          <span>Usar esta redacción</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
