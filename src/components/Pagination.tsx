import { FilterTabs } from '@/components/FilterTabs'
import { Button } from '@/components/ui/button'
import { PAGE_SIZES } from '@/lib/pagination'

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  from: number
  to: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

const SIZE_OPTIONS = PAGE_SIZES.map((size) => ({ value: String(size), label: String(size) }))

export function Pagination({
  page,
  totalPages,
  total,
  from,
  to,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-paperRule px-[18px] py-3">
      <span aria-live="polite" className="font-data text-12 text-inkBody">
        Mostrando {from}–{to} de {total} registros
      </span>
      <div className="flex flex-wrap items-center gap-3">
        <FilterTabs
          label="Registros por página"
          surface="well"
          options={SIZE_OPTIONS}
          value={String(pageSize)}
          onChange={(value) => onPageSizeChange(Number(value))}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Anterior
        </Button>
        <span className="font-data text-12 text-inkSoft">
          Página {page} de {totalPages}
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Siguiente
        </Button>
      </div>
    </div>
  )
}
