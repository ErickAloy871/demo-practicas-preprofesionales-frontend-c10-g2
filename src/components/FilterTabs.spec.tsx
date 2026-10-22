import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FilterTabs } from './FilterTabs'

describe('FilterTabs', () => {
  const options = [
    { value: 'all', label: 'Todos' },
    { value: 'approved', label: 'Aprobados' },
    { value: 'pending', label: 'Pendientes' },
  ]

  it('renderiza las opciones con la activa resaltada', () => {
    const handleChange = vi.fn()
    render(
      <FilterTabs
        options={options}
        value="approved"
        onChange={handleChange}
        label="Filtro de estados"
      />,
    )

    const approvedBtn = screen.getByRole('button', { name: 'Aprobados' })
    expect(approvedBtn).toHaveAttribute('aria-pressed', 'true')
    expect(approvedBtn).toHaveClass('bg-stamp')

    const pendingBtn = screen.getByRole('button', { name: 'Pendientes' })
    expect(pendingBtn).toHaveAttribute('aria-pressed', 'false')
  })

  it('llama a onChange cuando se hace clic en una opción', () => {
    const handleChange = vi.fn()
    render(
      <FilterTabs
        options={options}
        value="all"
        onChange={handleChange}
        label="Filtro de estados"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Pendientes' }))
    expect(handleChange).toHaveBeenCalledWith('pending')
  })
})
