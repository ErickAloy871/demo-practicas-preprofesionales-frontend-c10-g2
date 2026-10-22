import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatCard, StatGrid } from './StatCard'

describe('StatCard', () => {
  it('renderiza label y valor correctamente', () => {
    render(<StatCard label="Horas aprobadas" value="120" />)
    expect(screen.getByText('Horas aprobadas')).toBeInTheDocument()
    expect(screen.getByText('120')).toBeInTheDocument()
  })

  it('renderiza notas con diferentes tonos de color', () => {
    const { rerender } = render(
      <StatCard label="Pendientes" value="5" note="por revisar" noteTone="pending" />,
    )
    expect(screen.getByText('por revisar')).toBeInTheDocument()

    rerender(<StatCard label="Rechazadas" value="2" note="requieren ajuste" noteTone="void" />)
    expect(screen.getByText('requieren ajuste')).toBeInTheDocument()

    rerender(<StatCard label="Completas" value="240" note="al día" noteTone="stamp" />)
    expect(screen.getByText('al día')).toBeInTheDocument()
  })

  it('renderiza StatGrid con sus hijos', () => {
    render(
      <StatGrid>
        <StatCard label="A" value="1" />
        <StatCard label="B" value="2" />
      </StatGrid>,
    )
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
  })
})
