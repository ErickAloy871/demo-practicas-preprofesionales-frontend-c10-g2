import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Pagination } from './Pagination'

const baseProps = {
  page: 2,
  totalPages: 5,
  total: 48,
  from: 11,
  to: 20,
  pageSize: 10,
  onPageChange: vi.fn(),
  onPageSizeChange: vi.fn(),
}

describe('Pagination', () => {
  it('shows the range, the total and the current page', () => {
    render(<Pagination {...baseProps} />)

    expect(screen.getByText('Mostrando 11–20 de 48 registros')).toBeInTheDocument()
    expect(screen.getByText('Página 2 de 5')).toBeInTheDocument()
  })

  it('goes to the previous and next page', async () => {
    const onPageChange = vi.fn()
    render(<Pagination {...baseProps} onPageChange={onPageChange} />)

    await userEvent.click(screen.getByRole('button', { name: 'Anterior' }))
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }))

    expect(onPageChange).toHaveBeenNthCalledWith(1, 1)
    expect(onPageChange).toHaveBeenNthCalledWith(2, 3)
  })

  it('disables Anterior on the first page', () => {
    render(<Pagination {...baseProps} page={1} from={1} to={10} />)

    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeEnabled()
  })

  it('disables Siguiente on the last page', () => {
    render(<Pagination {...baseProps} page={5} from={41} to={48} />)

    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeEnabled()
  })

  it('marks the active page size and lets the user pick another', async () => {
    const onPageSizeChange = vi.fn()
    render(<Pagination {...baseProps} onPageSizeChange={onPageSizeChange} />)

    expect(screen.getByRole('button', { name: '10' })).toHaveAttribute('aria-pressed', 'true')

    await userEvent.click(screen.getByRole('button', { name: '50' }))

    expect(onPageSizeChange).toHaveBeenCalledWith(50)
  })
})
