import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TutorAiSummaryCard } from './TutorAiSummaryCard'

describe('TutorAiSummaryCard', () => {
  it('no renderiza nada si la lista de horas está vacía', () => {
    const { container } = render(<TutorAiSummaryCard logs={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renderiza la cabecera del resumen con el total de bitácoras', () => {
    const mockLogs = [
      { hours: 5, activity: 'Desarrollo de endpoints REST y servicios backend', date: '2026-10-01' },
    ]
    render(<TutorAiSummaryCard logs={mockLogs} />)

    expect(screen.getByTestId('tutor-ai-card')).toBeInTheDocument()
    expect(screen.getByText(/Resumen Ejecutivo con IA/i)).toBeInTheDocument()
    expect(screen.getByText(/1 bitácoras/i)).toBeInTheDocument()
  })

  it('despliega los detalles de competencias y sugerencia pedagógica al hacer clic', () => {
    const mockLogs = [
      { hours: 8, activity: 'Pruebas unitarias de calidad con vitest', date: '2026-10-01' },
      { hours: 4, activity: 'Componentes react y diseño frontend', date: '2026-10-02' },
    ]
    render(<TutorAiSummaryCard logs={mockLogs} />)

    const toggle = screen.getByTestId('tutor-ai-toggle')
    fireEvent.click(toggle)

    expect(screen.getByTestId('tutor-ai-content')).toBeInTheDocument()
    expect(screen.getAllByText(/Testing y Calidad/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Frontend y UX\/UI/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Sugerencia de retroalimentación pedagógica/i)).toBeInTheDocument()
  })
})
