import type { ReactNode } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface HourLogFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  hint?: ReactNode
  type?: 'date' | 'time' | 'number'
  multiline?: boolean
}

export function HourLogField({
  id, label, value, onChange, error, hint, type, multiline = false,
}: HourLogFieldProps) {
  const commonProps = {
    id,
    value,
    onChange: (event: { target: { value: string } }) => onChange(event.target.value),
    'aria-invalid': Boolean(error),
    'aria-describedby': error ? `${id}-error` : undefined,
  }
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {multiline ? (
        <Textarea {...commonProps} rows={3} placeholder="Qué hiciste durante este bloque de horas" />
      ) : (
        <Input
          {...commonProps}
          type={type}
          inputMode={type === 'number' ? 'decimal' : undefined}
          step={type === 'number' ? '0.5' : undefined}
          className={type === 'number' ? 'font-data tabular-nums' : 'font-data'}
        />
      )}
      {hint}
      {error ? <p id={`${id}-error`} role="alert" className="text-12 text-void">{error}</p> : null}
    </div>
  )
}
