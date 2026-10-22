// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { HOUR_LOG_DAILY_LIMIT_MESSAGE } from '@/lib/hour-log-validation'
import { hourLogFormReducer, initialHourLogFormState, validateHourLogForm, type HourLogFields } from './state'

const fields: HourLogFields = {
  date: '2026-04-02', startTime: '08:00', endTime: '12:00', hours: '4', activity: 'Soporte',
}

describe('validación del formulario sin renderizar', () => {
  it('mantiene los mensajes de los campos obligatorios', () => {
    expect(validateHourLogForm({ date: '', startTime: '', endTime: '', hours: '', activity: '  ' }, 0)).toEqual({
      date: 'La fecha es obligatoria',
      startTime: 'La hora de inicio es obligatoria',
      endTime: 'La hora de fin es obligatoria',
      hours: 'Las horas deben ser de al menos 0.5',
      activity: 'Describe la actividad realizada',
    })
  })

  it.each([
    ['0.25', 0, 'Las horas deben ser de al menos 0.5'],
    ['0.5', 7.5, undefined],
    ['1', 7.5, HOUR_LOG_DAILY_LIMIT_MESSAGE],
    ['8', 0, undefined],
    ['8.5', 0, HOUR_LOG_DAILY_LIMIT_MESSAGE],
    ['texto', 0, 'Ingresa un número de horas válido'],
  ])('reutiliza la regla unificada para %s horas y %s previas', (hours, dailyHours, message) => {
    expect(validateHourLogForm({ ...fields, hours }, dailyHours).hours).toBe(message)
  })

  it('rechaza una hora de fin igual o anterior al inicio', () => {
    for (const endTime of ['08:00', '07:30']) {
      expect(validateHourLogForm({ ...fields, endTime }, 0).hours).toBe(
        'La hora de fin debe ser posterior a la de inicio',
      )
    }
  })
})

describe('transiciones del formulario sin React', () => {
  it('edita un campo sin mutar el estado anterior ni borrar los demás campos', () => {
    const original = { ...initialHourLogFormState(), fields }
    const changed = hourLogFormReducer(original, { type: 'change', field: 'activity', value: 'Otra actividad' })
    expect(original.fields.activity).toBe('Soporte')
    expect(changed.fields).toEqual({ ...fields, activity: 'Otra actividad' })
  })

  it('retiene los datos al fallar y limpia el error al reintentar', () => {
    const saving = hourLogFormReducer({ ...initialHourLogFormState(), fields }, { type: 'saving' })
    expect(saving.submitting).toBe(true)
    const failed = hourLogFormReducer(saving, { type: 'failed', message: 'Falló el guardado' })
    expect(failed).toMatchObject({ fields, submitting: false, submitError: 'Falló el guardado' })
    expect(hourLogFormReducer(failed, { type: 'saving' })).toMatchObject({
      fields, submitting: true, errors: {}, submitError: null,
    })
  })

  it('limpia el error general y mantiene los campos al detectar errores de validación', () => {
    const failed = { ...initialHourLogFormState(), fields, submitError: 'Error anterior' }
    expect(hourLogFormReducer(failed, { type: 'invalid', errors: { activity: 'Obligatoria' } })).toMatchObject({
      fields, errors: { activity: 'Obligatoria' }, submitError: null, submitting: false,
    })
  })

  it('reinicia los campos, los errores y la fecha al guardar correctamente', () => {
    const now = new Date(2026, 9, 21, 10)
    const saving = { fields, errors: { hours: 'Error anterior' }, submitting: true, submitError: 'Error' }
    expect(hourLogFormReducer(saving, { type: 'saved', now })).toEqual({
      fields: { date: '2026-10-21', startTime: '', endTime: '', hours: '', activity: '' },
      errors: {}, submitting: false, submitError: null,
    })
  })
})
