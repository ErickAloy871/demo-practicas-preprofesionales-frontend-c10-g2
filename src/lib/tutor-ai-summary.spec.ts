import { describe, expect, it } from 'vitest'
import { generateTutorAiSummary } from './tutor-ai-summary'

describe('generateTutorAiSummary', () => {
  it('maneja listas vacías devolviendo valores seguros por defecto', () => {
    const summary = generateTutorAiSummary([])
    expect(summary.totalHours).toBe(0)
    expect(summary.logsAnalyzed).toBe(0)
    expect(summary.competencies).toHaveLength(0)
    expect(summary.executiveSummary).toContain('No se registran bitácoras')
  })

  it('clasifica horas en las categorías técnicas correctas y calcula porcentajes', () => {
    const logs = [
      { hours: 6, activity: 'Pruebas unitarias con vitest y reporte de bugs', date: '2026-10-01' },
      { hours: 4, activity: 'Endpoints backend y controlador de autenticación', date: '2026-10-02' },
    ]

    const summary = generateTutorAiSummary(logs)
    expect(summary.totalHours).toBe(10)
    expect(summary.logsAnalyzed).toBe(2)

    const testingComp = summary.competencies.find((c) => c.name === 'Testing y Calidad')
    const backendComp = summary.competencies.find((c) => c.name === 'Backend y Servicios')

    expect(testingComp?.hours).toBe(6)
    expect(testingComp?.percentage).toBe(60)
    expect(backendComp?.hours).toBe(4)
    expect(backendComp?.percentage).toBe(40)
  })

  it('calcula la consistencia y genera fortalezas y recomendación pedagógica', () => {
    const logs = [
      { hours: 4, activity: 'Diseño de interfaz de usuario con react y estilos css responsivos', date: '2026-10-01' },
      { hours: 4, activity: 'Modelado de base de datos sql con tablas y migraciones', date: '2026-10-02' },
    ]

    const summary = generateTutorAiSummary(logs)
    expect(summary.consistencyScore).toBeGreaterThanOrEqual(90)
    expect(summary.consistencyLevel).toBe('Alta')
    expect(summary.executiveSummary).toMatch(/practicante ha acumulado 8 horas/i)
    expect(summary.pedagogicalFeedback).toMatch(/Recomendación:/i)
    expect(summary.keyStrengths.length).toBeGreaterThan(0)
  })
})
