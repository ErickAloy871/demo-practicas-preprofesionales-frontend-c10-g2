export function todayAsInputValue(now = new Date()): string {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDateForConfirmation(dateValue: string): string {
  if (!dateValue) return ''
  const [year, month, day] = dateValue.split('-').map(Number)
  if (!year || !month || !day) return ''
  const parsed = new Date(year, month - 1, day)
  if (Number.isNaN(parsed.getTime())) return ''
  return new Intl.DateTimeFormat('es-EC', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  }).format(parsed)
}

// Informativo: las horas registradas siguen viniendo del campo "Horas".
export function computeDurationLabel(startTime: string, endTime: string): string | null {
  if (!startTime || !endTime) return null
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)
  if ([startHour, startMinute, endHour, endMinute].some(Number.isNaN)) return null
  const diffMinutes = endHour * 60 + endMinute - (startHour * 60 + startMinute)
  if (diffMinutes <= 0) return null
  return `Duración calculada: ${(diffMinutes / 60).toFixed(1)} h`
}
