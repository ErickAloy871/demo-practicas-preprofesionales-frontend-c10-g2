import { describe, expect, it } from 'vitest'
import { analyzeActivity } from './ai-assistant'

describe('analyzeActivity', () => {
  it('retorna diagnóstico bajo para textos vacíos o en blanco', () => {
    const result = analyzeActivity('   ')
    expect(result.score).toBe(0)
    expect(result.level).toBe('Bajo')
    expect(result.approvalProbability).toBe(10)
    expect(result.suggestions).toHaveLength(0)
  })

  it('detecta palabras clave de testing y devuelve sugerencias de calidad', () => {
    const result = analyzeActivity('hice pruebas unitarias y corregi un error')
    expect(result.competencies).toContain('Aseguramiento de Calidad y Testing')
    expect(result.suggestions.length).toBeGreaterThan(0)
    expect(result.score).toBeGreaterThanOrEqual(55)
    expect(result.suggestions[0]).toMatch(/pruebas automatizadas|resolución de anomalías/i)
  })

  it('detecta palabras clave de frontend y UI', () => {
    const result = analyzeActivity('diseno de componentes react y estilos css')
    expect(result.competencies).toContain('Desarrollo Frontend y UX/UI')
    expect(result.suggestions[0]).toMatch(/componentes reactivos|arquitectura modular/i)
  })

  it('detecta palabras clave de backend y endpoints', () => {
    const result = analyzeActivity('implemente un endpoint api para el controlador')
    expect(result.competencies).toContain('Arquitectura Backend y Servicios')
    expect(result.suggestions[0]).toMatch(/endpoints RESTful|arquitectura de servicios/i)
  })

  it('detecta palabras clave de base de datos', () => {
    const result = analyzeActivity('cree la tabla y optimice la base de datos sql con dexie')
    expect(result.competencies).toContain('Gestión y Modelado de Datos')
  })

  it('genera plantilla de adaptación técnica cuando no coincide ningún dominio', () => {
    const result = analyzeActivity('configure la red interna del laboratorio.')
    expect(result.competencies).toContain('Ingeniería de Software y Desarrollo Profesional')
    expect(result.suggestions[0]).toContain('configure la red interna del laboratorio')
    expect(result.suggestions).toHaveLength(2)
  })

  it('asigna nivel Profesional para descripciones completas y estructuradas', () => {
    const text =
      'Desarrollo e integración de suite de pruebas automatizadas con vitest para validar la lógica del libro de horas.'
    const result = analyzeActivity(text)
    expect(result.level).toBe('Profesional')
    expect(result.approvalProbability).toBe(98)
    expect(result.score).toBeGreaterThanOrEqual(80)
  })
})
