import { Button } from '@/components/ui/button'
import { HourLogFormFields } from '@/features/hour-log-form/HourLogFormFields'
import { useHourLogForm } from '@/features/hour-log-form/useHourLogForm'

interface HourLogFormProps {
  placementId: number
  onSaved?: () => void
}

export function HourLogForm({ placementId, onSaved }: HourLogFormProps) {
  const form = useHourLogForm(placementId, onSaved)

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        return form.submit()
      }}
      noValidate
    >
      <HourLogFormFields
        fields={form.fields}
        errors={form.errors}
        change={form.change}
        confirmationLabel={form.confirmationLabel}
        durationLabel={form.durationLabel}
        liveHoursWarning={form.liveHoursWarning}
      />
      {form.submitError ? <p role="alert" className="text-14 text-void">{form.submitError}</p> : null}
      <p className="text-12 text-inkSoft">
        Se guarda en este dispositivo aunque no tengas conexión. Se sincroniza solo cuando vuelvas a estar en línea
      </p>
      <Button type="submit" disabled={form.submitting}>
        {form.submitting ? 'Guardando…' : 'Guardar horas'}
      </Button>
    </form>
  )
}
