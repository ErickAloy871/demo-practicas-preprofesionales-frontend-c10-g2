import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AiHourAssistant } from './AiHourAssistant'

describe('AiHourAssistant', () => {
  it('renderiza el botón para invocar al copiloto IA', () => {
    render(<AiHourAssistant currentActivity="" onSelectSuggestion={vi.fn()} />)
    expect(screen.getByTestId('ai-assistant-trigger')).toBeInTheDocument()
    expect(screen.getByText(/Mejorar con IA/i)).toBeInTheDocument()
  })

  it('abre el panel y muestra el diagnóstico y sugerencias al hacer clic', () => {
    render(<AiHourAssistant currentActivity="hice pruebas unitarias y corregi bugs" onSelectSuggestion={vi.fn()} />)

    const trigger = screen.getByTestId('ai-assistant-trigger')
    fireEvent.click(trigger)

    expect(screen.getByTestId('ai-assistant-panel')).toBeInTheDocument()
    expect(screen.getByText(/Copiloto IA Técnico/i)).toBeInTheDocument()
    expect(screen.getByText(/Aseguramiento de Calidad y Testing/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Usar esta redacción/i).length).toBeGreaterThan(0)
  })

  it('aplica la sugerencia seleccionada al invocar onSelectSuggestion', () => {
    const handleSelect = vi.fn()
    render(
      <AiHourAssistant
        currentActivity="disene componentes frontend con react"
        onSelectSuggestion={handleSelect}
      />,
    )

    fireEvent.click(screen.getByTestId('ai-assistant-trigger'))

    const applyButton = screen.getByTestId('ai-apply-btn-0')
    fireEvent.click(applyButton)

    expect(handleSelect).toHaveBeenCalledTimes(1)
    expect(handleSelect).toHaveBeenCalledWith(expect.stringMatching(/componentes reactivos|arquitectura modular/i))
  })

  it('permite cerrar el panel de sugerencias con el botón de cierre', () => {
    render(<AiHourAssistant currentActivity="testing" onSelectSuggestion={vi.fn()} />)

    fireEvent.click(screen.getByTestId('ai-assistant-trigger'))
    expect(screen.getByTestId('ai-assistant-panel')).toBeInTheDocument()

    const closeBtn = screen.getByLabelText('Cerrar asistente IA')
    fireEvent.click(closeBtn)

    expect(screen.queryByTestId('ai-assistant-panel')).not.toBeInTheDocument()
  })
})
