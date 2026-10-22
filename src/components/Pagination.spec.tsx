import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { PagedList } from '@/lib/usePagedList'
import { Pagination } from './Pagination'

function pagedList(overrides: Partial<PagedList<unknown>> = {}): PagedList<unknown> {
  return {
    items: [],
    page: 2,
    totalPages: 5,
    total: 48,
    from: 11,
    to: 20,
    pageSize: 10,
    setPage: vi.fn(),
    setPageSize: vi.fn(),
    ...overrides,
  }
}

describe('Pagination', () => {
  it('shows the range, the total and the current page', () => {
    render(<Pagination paged={pagedList()} />)

    expect(screen.getByText('Mostrando 11–20 de 48 registros')).toBeInTheDocument()
    expect(screen.getByText('Página 2 de 5')).toBeInTheDocument()
  })

  it('uses the given noun in the range', () => {
    render(<Pagination paged={pagedList()} noun="practicantes" />)

    expect(screen.getByText('Mostrando 11–20 de 48 practicantes')).toBeInTheDocument()
  })

  it('renders nothing when there are no items', () => {
    const { container } = render(<Pagination paged={pagedList({ total: 0, from: 0, to: 0, totalPages: 1, page: 1 })} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('goes to the previous and next page', async () => {
    const setPage = vi.fn()
    render(<Pagination paged={pagedList({ setPage })} />)

    await userEvent.click(screen.getByRole('button', { name: 'Anterior' }))
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }))

    expect(setPage).toHaveBeenNthCalledWith(1, 1)
    expect(setPage).toHaveBeenNthCalledWith(2, 3)
  })

  it('disables Anterior on the first page', () => {
    render(<Pagination paged={pagedList({ page: 1, from: 1, to: 10 })} />)

    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeEnabled()
  })

  it('disables Siguiente on the last page', () => {
    render(<Pagination paged={pagedList({ page: 5, from: 41, to: 48 })} />)

    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeEnabled()
  })

  it('marks the active page size and lets the user pick another', async () => {
    const setPageSize = vi.fn()
    render(<Pagination paged={pagedList({ setPageSize })} />)

    expect(screen.getByRole('button', { name: '10' })).toHaveAttribute('aria-pressed', 'true')

    await userEvent.click(screen.getByRole('button', { name: '50' }))

    expect(setPageSize).toHaveBeenCalledWith(50)
  })
})
