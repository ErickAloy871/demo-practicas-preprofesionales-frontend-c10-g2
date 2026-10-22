import { ListFilters } from '@/components/ListFilters'
import { HOUR_LOG_STATUS_OPTIONS, type HourLogStatusFilter } from '@/lib/hourLogFilters'

interface HourLogFiltersProps {
  status: HourLogStatusFilter
  onStatusChange: (status: HourLogStatusFilter) => void
  query: string
  onQueryChange: (query: string) => void
}

export function HourLogFilters({ status, onStatusChange, query, onQueryChange }: HourLogFiltersProps) {
  return (
    <ListFilters
      statusLabel="Filtrar por estado"
      options={HOUR_LOG_STATUS_OPTIONS}
      status={status}
      onStatusChange={(value) => onStatusChange(value as HourLogStatusFilter)}
      searchLabel="Buscar registros"
      searchPlaceholder="Buscar por actividad o fecha"
      query={query}
      onQueryChange={onQueryChange}
    />
  )
}
