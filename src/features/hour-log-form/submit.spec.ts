// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { hourLogFormReducer, initialHourLogFormState, type HourLogFormAction } from './state'
import { HOUR_LOG_SAVE_ERROR, submitHourLog } from './submit'

function setup() {
  const now = new Date(2026, 9, 21, 10)
  let state = initialHourLogFormState(now)
  state.fields = { date: '2026-04-02', startTime: '08:00', endTime: '12:00', hours: '4', activity: 'Soporte' }
  const dispatch = (action: HourLogFormAction) => { state = hourLogFormReducer(state, action) }
  return { now, dispatch, getState: () => state }
}

describe('envío del formulario sin renderizar', () => {
  it('rechaza un formulario inválido sin guardar ni avisar de éxito', async () => {
    const { dispatch, getState } = setup()
    const save = vi.fn()
    const onSaved = vi.fn()
    await submitHourLog({ fields: getState().fields, dailyHours: 5, placementId: 7, dispatch, save, onSaved })
    expect(save).not.toHaveBeenCalled()
    expect(onSaved).not.toHaveBeenCalled()
    expect(getState().errors.hours).toBe('No puedes registrar más de 8 horas en un mismo día')
    expect(getState().submitting).toBe(false)
  })

  it('mantiene Guardando hasta terminar la escritura y reinicia antes de avisar de éxito', async () => {
    const { now, dispatch, getState } = setup()
    let finish!: () => void
    const save = vi.fn(() => new Promise<void>((resolve) => { finish = resolve }))
    const onSaved = vi.fn(() => expect(getState()).toEqual(initialHourLogFormState(now)))
    const pending = submitHourLog({
      fields: getState().fields, dailyHours: 0, placementId: 7,
      dispatch, save, onSaved, now: () => now,
    })
    expect(getState().submitting).toBe(true)
    expect(getState().fields.activity).toBe('Soporte')
    expect(onSaved).not.toHaveBeenCalled()
    finish()
    await pending
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ placementId: 7, activity: 'Soporte', hours: 4 }))
    expect(onSaved).toHaveBeenCalledOnce()
    expect(getState()).toEqual(initialHourLogFormState(now))
  })

  it('conserva los valores tras un fallo y permite reintentar', async () => {
    const { now, dispatch, getState } = setup()
    const fields = getState().fields
    const save = vi.fn().mockRejectedValueOnce(new Error('IndexedDB no disponible')).mockResolvedValueOnce(undefined)
    const onSaved = vi.fn()
    const options = { fields, dailyHours: 0, placementId: 7, dispatch, save, onSaved, now: () => now }
    await submitHourLog(options)
    expect(getState()).toMatchObject({ fields, submitting: false, submitError: HOUR_LOG_SAVE_ERROR })
    expect(onSaved).not.toHaveBeenCalled()
    await submitHourLog(options)
    expect(getState()).toEqual(initialHourLogFormState(now))
    expect(onSaved).toHaveBeenCalledOnce()
  })
})
