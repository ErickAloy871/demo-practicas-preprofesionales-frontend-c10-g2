import type { HourLogErrors, HourLogFields } from './state'
import { HourLogField } from './HourLogField'

interface HourLogFormFieldsProps {
  fields: HourLogFields
  errors: HourLogErrors
  change: (field: keyof HourLogFields, value: string) => void
  confirmationLabel: string
  durationLabel: string | null
  liveHoursWarning: string | null
}

export function HourLogFormFields({
  fields, errors, change, confirmationLabel, durationLabel, liveHoursWarning,
}: HourLogFormFieldsProps) {
  return (
    <>
      <HourLogField
        id="hourlog-date" label="Fecha" type="date" value={fields.date}
        onChange={(value) => change('date', value)} error={errors.date}
        hint={confirmationLabel ? <p className="font-data text-12 text-inkSoft">{confirmationLabel}</p> : null}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <HourLogField
          id="hourlog-start" label="Hora de inicio" type="time" value={fields.startTime}
          onChange={(value) => change('startTime', value)} error={errors.startTime}
        />
        <HourLogField
          id="hourlog-end" label="Hora de fin" type="time" value={fields.endTime}
          onChange={(value) => change('endTime', value)} error={errors.endTime}
        />
      </div>
      {durationLabel ? <p className="-mt-2 font-data text-12 text-inkSoft">{durationLabel}</p> : null}
      <HourLogField
        id="hourlog-hours" label="Horas" type="number" value={fields.hours}
        onChange={(value) => change('hours', value)} error={errors.hours}
        hint={liveHoursWarning && !errors.hours ? <p className="text-12 text-pending">{liveHoursWarning}</p> : null}
      />
      <HourLogField
        id="hourlog-activity" label="Actividad" multiline value={fields.activity}
        onChange={(value) => change('activity', value)} error={errors.activity}
      />
    </>
  )
}
