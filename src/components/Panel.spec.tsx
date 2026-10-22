import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EmptyState, ErrorState, LoadingState, Panel, Section, TableHeaderRow } from './Panel'

describe('Panel components', () => {
  it('renderiza Panel con toolbar y contenido', () => {
    render(
      <Panel toolbar={<span>Toolbar Title</span>}>
        <p>Panel Content</p>
      </Panel>,
    )
    expect(screen.getByText('Toolbar Title')).toBeInTheDocument()
    expect(screen.getByText('Panel Content')).toBeInTheDocument()
  })

  it('renderiza Section con título y aside', () => {
    render(
      <Section title="Mis Documentos" aside={<span>Ver más</span>}>
        <p>Section Content</p>
      </Section>,
    )
    expect(screen.getByText('Mis Documentos')).toBeInTheDocument()
    expect(screen.getByText('Ver más')).toBeInTheDocument()
    expect(screen.getByText('Section Content')).toBeInTheDocument()
  })

  it('renderiza EmptyState, LoadingState y ErrorState', () => {
    const { rerender } = render(
      <EmptyState
        title="Sin registros"
        description="Agrega tu primer registro"
        action={<button>Crear</button>}
      />,
    )
    expect(screen.getByText('Sin registros')).toBeInTheDocument()
    expect(screen.getByText('Agrega tu primer registro')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Crear' })).toBeInTheDocument()

    rerender(<LoadingState>Cargando datos…</LoadingState>)
    expect(screen.getByText('Cargando datos…')).toBeInTheDocument()

    rerender(<ErrorState>Ocurrió un error inesperado</ErrorState>)
    expect(screen.getByText('Ocurrió un error inesperado')).toBeInTheDocument()
  })

  it('renderiza TableHeaderRow', () => {
    render(
      <TableHeaderRow>
        <span>Columna 1</span>
        <span>Columna 2</span>
      </TableHeaderRow>,
    )
    expect(screen.getByText('Columna 1')).toBeInTheDocument()
    expect(screen.getByText('Columna 2')).toBeInTheDocument()
  })
})
