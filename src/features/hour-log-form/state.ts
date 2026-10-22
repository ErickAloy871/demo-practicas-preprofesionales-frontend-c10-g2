import { validateHourLogValues } from '@/lib/hour-log-validation'
import { todayAsInputValue } from './format'

export interface HourLogFields {
  date: string
  startTime: string
  endTime: string
  hours: string
  activity: string
}

export type HourLogErrors = Partial<Record<keyof HourLogFields, string>>

export interface HourLogFormState {
  fields: HourLogFields
  errors: HourLogErrors
  submitting: boolean
  submitError: string | null
}

export type HourLogFormAction =
  | { type: 'change'; field: keyof HourLogFields; value: string }
  | { type: 'invalid'; errors: HourLogErrors }
  | { type: 'saving' }
  | { type: 'saved'; now: Date }
  | { type: 'failed'; message: string }

export function initialHourLogFormState(now = new Date()): HourLogFormState {
  return {
    fields: { date: todayAsInputValue(now), startTime: '', endTime: '', hours: '', activity: '' },
    errors: {},
    submitting: false,
    submitError: null,
  }
}

export function hourLogFormReducer(state: HourLogFormState, action: HourLogFormAction): HourLogFormState {
  switch (action.type) {
    case 'change':
      return { ...state, fields: { ...state.fields, [action.field]: action.value } }
    case 'invalid':
      return { ...state, errors: action.errors, submitting: false, submitError: null }
    case 'saving':
      return { ...state, errors: {}, submitting: true, submitError: null }
    case 'saved':
      return initialHourLogFormState(action.now)
    case 'failed':
      return { ...state, submitting: false, submitError: action.message }
  }
}

export function hoursWarning(fields: HourLogFields, dailyHours: number): string | null {
  return validateHourLogValues({
    hours: Number(fields.hours),
    startTime: fields.startTime,
    endTime: fields.endTime,
    alreadyRegisteredHours: dailyHours,
  })
}

export function validateHourLogForm(fields: HourLogFields, dailyHours: number): HourLogErrors {
  const errors: HourLogErrors = {}
  if (!fields.date) errors.date = 'La fecha es obligatoria'
  if (!fields.startTime) errors.startTime = 'La hora de inicio es obligatoria'
  if (!fields.endTime) errors.endTime = 'La hora de fin es obligatoria'
  if (!fields.activity.trim()) errors.activity = 'Describe la actividad realizada'
  const message = hoursWarning(fields, dailyHours)
  if (message) errors.hours = message
  return errors
}
