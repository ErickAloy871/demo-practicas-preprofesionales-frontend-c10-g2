import type { FilterOption } from '@/components/FilterTabs'
import { formatDate } from '@/lib/date'
import type { LocalHourLog } from '@/offline/db'

export type HourLogStatusFilter = 'ALL' | LocalHourLog['status']

export const HOUR_LOG_STATUS_OPTIONS: FilterOption[] = [
  { value: 'ALL', label: 'Todos' },
  { value: 'SUBMITTED', label: 'Por revisar' },
  { value: 'APPROVED', label: 'Aprobados' },
  { value: 'REJECTED', label: 'Rechazados' },
  { value: 'DRAFT', label: 'Borradores' },
]

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

export function filterHourLogs(
  logs: readonly LocalHourLog[],
  status: HourLogStatusFilter,
  query: string,
): LocalHourLog[] {
  const needle = normalize(query.trim())

  return logs.filter((log) => {
    if (status !== 'ALL' && log.status !== status) return false
    if (needle === '') return true
    return normalize(`${log.activity} ${log.date} ${formatDate(log.date)}`).includes(needle)
  })
}
