export const PAGE_SIZES = [10, 20, 50] as const
export const DEFAULT_PAGE_SIZE = 10

export interface Page<T> {
  items: T[]
  page: number
  totalPages: number
  total: number
  from: number
  to: number
}

export function paginate<T>(items: readonly T[], page: number, pageSize: number): Page<T> {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(Math.max(1, page), totalPages)
  const start = (current - 1) * pageSize
  const slice = items.slice(start, start + pageSize)

  return {
    items: slice,
    page: current,
    totalPages,
    total,
    from: total === 0 ? 0 : start + 1,
    to: start + slice.length,
  }
}
