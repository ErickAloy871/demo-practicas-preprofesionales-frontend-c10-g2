import { FilterTabs } from '@/components/FilterTabs'
import { Button } from '@/components/ui/button'
import { PAGE_SIZES } from '@/lib/pagination'
import type { PagedList } from '@/lib/usePagedList'

interface PaginationProps {
  paged: PagedList<unknown>
  noun?: string
}

const SIZE_OPTIONS = PAGE_SIZES.map((size) => ({ value: String(size), label: String(size) }))

export function Pagination({ paged, noun = 'registros' }: PaginationProps) {
  const { page, totalPages, total, from, to, pageSize, setPage, setPageSize } = paged
  if (total === 0) return null

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-paperRule px-[18px] py-3">
      <span aria-live="polite" className="font-data text-12 text-inkBody">
        Mostrando {from}–{to} de {total} {noun}
      </span>
      <div className="flex flex-wrap items-center gap-3">
        <FilterTabs
          label="Registros por página"
          surface="well"
          options={SIZE_OPTIONS}
          value={String(pageSize)}
          onChange={(value) => setPageSize(Number(value))}
        />
        <Button type="button" size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
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
          onClick={() => setPage(page + 1)}
        >
          Siguiente
        </Button>
      </div>
    </div>
  )
}
