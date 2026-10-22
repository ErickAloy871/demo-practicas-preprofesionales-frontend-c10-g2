import { useMemo, useState } from 'react'
import { type HourLogStatusFilter, filterHourLogs } from '@/lib/hourLogFilters'
import { usePagedList } from '@/lib/usePagedList'
import type { LocalHourLog } from '@/offline/db'

/** Filtra y pagina los registros de horas, del más reciente al más antiguo. */
export function useHourLogView(logs: readonly LocalHourLog[] | undefined) {
  const [status, setStatus] = useState<HourLogStatusFilter>('ALL')
  const [query, setQuery] = useState('')
  const visibleLogs = useMemo(
    () => filterHourLogs([...(logs ?? [])].reverse(), status, query),
    [logs, status, query],
  )
  const paged = usePagedList(visibleLogs, `${status}|${query}`)

  return { status, setStatus, query, setQuery, visibleLogs, paged }
}
