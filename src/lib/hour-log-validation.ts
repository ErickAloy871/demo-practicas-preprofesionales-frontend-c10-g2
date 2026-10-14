/** Fuente única de configuración de horas por estudiante y día. */
export const HOUR_LOG_DAILY_HOURS_LIMIT = 8
export const HOUR_LOG_MINIMUM_HOURS = 0.5

export const HOUR_LOG_DAILY_LIMIT_MESSAGE = `No puedes registrar más de ${HOUR_LOG_DAILY_HOURS_LIMIT} horas en un mismo día`
export const HOUR_LOG_INVALID_HOURS_MESSAGE = `Las horas deben ser de al menos ${HOUR_LOG_MINIMUM_HOURS}`
export const HOUR_LOG_TIME_ORDER_MESSAGE = 'La hora de fin debe ser posterior a la de inicio'

interface HourLogValues {
  hours: number
  startTime: string
  endTime: string
  alreadyRegisteredHours: number
}

export function validateHourLogValues({ hours, startTime, endTime, alreadyRegisteredHours }: HourLogValues): string | null {
  if (!Number.isFinite(hours)) return 'Ingresa un número de horas válido'
  if (hours < HOUR_LOG_MINIMUM_HOURS) return HOUR_LOG_INVALID_HOURS_MESSAGE
  if (startTime && endTime && endTime <= startTime) return HOUR_LOG_TIME_ORDER_MESSAGE
  if (alreadyRegisteredHours + hours > HOUR_LOG_DAILY_HOURS_LIMIT) return HOUR_LOG_DAILY_LIMIT_MESSAGE
  return null
}

export function sumHoursForDate(logs: ReadonlyArray<{ date: string; hours: number }>, date: string): number {
  return logs
    .filter((log) => log.date.slice(0, 10) === date)
    .reduce((total, log) => total + log.hours, 0)
}
