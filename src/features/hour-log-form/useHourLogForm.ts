import { useReducer } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/offline/db'
import { sumHoursForDate } from '@/lib/hour-log-validation'
import { computeDurationLabel, formatDateForConfirmation } from './format'
import { hourLogFormReducer, hoursWarning, initialHourLogFormState, type HourLogFields } from './state'
import { saveHourLogLocally } from './storage'
import { submitHourLog } from './submit'

export function useHourLogForm(placementId: number, onSaved?: () => void) {
  const [state, dispatch] = useReducer(hourLogFormReducer, undefined, initialHourLogFormState)
  const { fields } = state
  const dailyHours = useLiveQuery(
    async () => sumHoursForDate(await db.hourLogs.toArray(), fields.date),
    [fields.date],
    0,
  ) ?? 0

  return {
    ...state,
    confirmationLabel: formatDateForConfirmation(fields.date),
    durationLabel: computeDurationLabel(fields.startTime, fields.endTime),
    liveHoursWarning: fields.hours ? hoursWarning(fields, dailyHours) : null,
    change: (field: keyof HourLogFields, value: string) => dispatch({ type: 'change', field, value }),
    submit: () => submitHourLog({
      fields, dailyHours, placementId, dispatch, save: saveHourLogLocally, onSaved,
    }),
  }
}
