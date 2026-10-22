// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { computeDurationLabel, formatDateForConfirmation, todayAsInputValue } from './format'

describe('presentación de fechas y duración', () => {
  it('usa el día local para la fecha inicial y conserva la confirmación en español', () => {
    expect(todayAsInputValue(new Date(2026, 3, 2, 23, 30))).toBe('2026-04-02')
    expect(formatDateForConfirmation('2026-04-02')).toBe('jueves, 02 de abril de 2026')
  })

  it.each(['', 'fecha-inválida', '2026-00-02'])('no muestra confirmación para %s', (date) => {
    expect(formatDateForConfirmation(date)).toBe('')
  })

  it('muestra la duración informativa con un decimal', () => {
    expect(computeDurationLabel('08:00', '11:30')).toBe('Duración calculada: 3.5 h')
  })

  it.each([['', '12:00'], ['08:00', ''], ['09:00', '09:00'], ['10:00', '09:00'], ['no-es-hora', '12:00']])(
    'omite una duración inválida: %s a %s',
    (start, end) => expect(computeDurationLabel(start, end)).toBeNull(),
  )
})
