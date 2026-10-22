import { FilterTabs, type FilterOption } from '@/components/FilterTabs'
import { Input } from '@/components/ui/input'

interface ListFiltersProps {
  statusLabel: string
  options: FilterOption[]
  status: string
  onStatusChange: (value: string) => void
  searchLabel: string
  searchPlaceholder: string
  query: string
  onQueryChange: (value: string) => void
}

export function ListFilters({
  statusLabel,
  options,
  status,
  onStatusChange,
  searchLabel,
  searchPlaceholder,
  query,
  onQueryChange,
}: ListFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-paperRule px-[18px] py-3">
      <FilterTabs label={statusLabel} options={options} value={status} onChange={onStatusChange} />
      <Input
        type="search"
        aria-label={searchLabel}
        placeholder={searchPlaceholder}
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        className="sm:ml-auto sm:max-w-xs"
      />
    </div>
  )
}
