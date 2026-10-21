import type { LocalHourLog } from '@/offline/db'
import { buildLocalHourLog } from './operation'
import { validateHourLogForm, type HourLogFields, type HourLogFormAction } from './state'

export const HOUR_LOG_SAVE_ERROR = 'No se pudo guardar el registro en este dispositivo. Intenta de nuevo.'

interface SubmitHourLogOptions {
  fields: HourLogFields
  dailyHours: number
  placementId: number
  dispatch: (action: HourLogFormAction) => void
  save: (row: LocalHourLog) => Promise<void>
  now?: () => Date
  onSaved?: () => void
}

export async function submitHourLog({
  fields, dailyHours, placementId, dispatch, save, now = () => new Date(), onSaved,
}: SubmitHourLogOptions): Promise<void> {
  const errors = validateHourLogForm(fields, dailyHours)
  if (Object.keys(errors).length > 0) {
    dispatch({ type: 'invalid', errors })
    return
  }

  dispatch({ type: 'saving' })
  try {
    await save(buildLocalHourLog(fields, placementId, now()))
    dispatch({ type: 'saved', now: now() })
    onSaved?.()
  } catch {
    dispatch({ type: 'failed', message: HOUR_LOG_SAVE_ERROR })
  }
}
