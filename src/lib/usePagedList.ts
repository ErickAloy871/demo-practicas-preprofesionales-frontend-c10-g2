import { useState } from 'react'
import { DEFAULT_PAGE_SIZE, type Page, paginate } from '@/lib/pagination'

interface PagedList<T> extends Page<T> {
  pageSize: number
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
}

/** Estado de página y tamaño; vuelve a la página 1 cuando cambia `resetKey`. */
export function usePagedList<T>(items: readonly T[], resetKey: string): PagedList<T> {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE)
  const [lastResetKey, setLastResetKey] = useState(resetKey)

  if (lastResetKey !== resetKey) {
    setLastResetKey(resetKey)
    setPage(1)
  }

  function setPageSize(next: number) {
    setPageSizeState(next)
    setPage(1)
  }

  return { ...paginate(items, page, pageSize), pageSize, setPage, setPageSize }
}
