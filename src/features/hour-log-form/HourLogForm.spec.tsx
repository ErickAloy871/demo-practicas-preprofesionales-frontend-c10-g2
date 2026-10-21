import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HourLogForm } from '@/components/HourLogForm'
import { db } from '@/offline/db'
import { buildLocalHourLog } from './operation'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

async function fillForm(hours = '4') {
  const user = userEvent.setup()
  fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '2026-04-02' } })
  fireEvent.change(screen.getByLabelText('Hora de inicio'), { target: { value: '08:00' } })
  fireEvent.change(screen.getByLabelText('Hora de fin'), { target: { value: '12:00' } })
  await user.type(screen.getByLabelText('Horas'), hours)
  await user.type(screen.getByLabelText('Actividad'), '  Soporte  ')
  return user
}

describe('formulario de horas separado', () => {
  it('registra desde la interfaz sin conexión y conserva la operación tras reabrir la base', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    const fetch = vi.fn().mockRejectedValue(new Error('Sin conexión'))
    vi.stubGlobal('fetch', fetch)
    const onSaved = vi.fn()
    render(<HourLogForm placementId={7} onSaved={onSaved} />)
    const user = await fillForm()
    expect(screen.getByText('jueves, 02 de abril de 2026')).toBeInTheDocument()
    expect(screen.getByText('Duración calculada: 4.0 h')).toBeInTheDocument()
    expect(screen.getByText(/Se guarda en este dispositivo aunque no tengas conexión/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Guardar horas' }))
    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce())
    expect(screen.getByLabelText('Horas')).toHaveValue(null)
    expect(screen.getByLabelText('Actividad')).toHaveValue('')
    cleanup()
    db.close()
    await db.open()
    expect(await db.hourLogs.toArray()).toMatchObject([
      { placementId: 7, hours: 4, activity: 'Soporte', status: 'SUBMITTED', syncState: 'queued' },
    ])
    expect(await db.outbox.toArray()).toMatchObject([
      { entity: 'hourLog', op: 'create', payload: { hours: 4, activity: 'Soporte', date: '2026-04-02' } },
    ])
    expect(fetch).not.toHaveBeenCalled()
  })

  it('muestra el mismo aviso y error al superar el total del día, sin encolar otra actividad', async () => {
    await db.hourLogs.add(buildLocalHourLog({
      date: '2026-04-02', startTime: '08:00', endTime: '15:30', hours: '7.5', activity: 'Anterior',
    }, 9, new Date('2026-04-02T15:00:00Z')))
    render(<HourLogForm placementId={7} />)
    const user = await fillForm('1')
    const message = 'No puedes registrar más de 8 horas en un mismo día'
    expect(await screen.findByText(message)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Guardar horas' }))
    expect(screen.getByRole('alert')).toHaveTextContent(message)
    expect(screen.getByLabelText('Horas')).toHaveAttribute('aria-describedby', 'hourlog-hours-error')
    expect(await db.hourLogs.count()).toBe(1)
    expect(await db.outbox.count()).toBe(0)
  })

  it('conserva los campos y muestra el mensaje original cuando falla la escritura local', async () => {
    vi.spyOn(db.outbox, 'add').mockRejectedValueOnce(new Error('Sin espacio'))
    const onSaved = vi.fn()
    render(<HourLogForm placementId={7} onSaved={onSaved} />)
    const user = await fillForm()
    await user.click(screen.getByRole('button', { name: 'Guardar horas' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo guardar el registro en este dispositivo. Intenta de nuevo.',
    )
    expect(screen.getByLabelText('Horas')).toHaveValue(4)
    expect(screen.getByLabelText('Actividad')).toHaveValue('  Soporte  ')
    expect(screen.getByRole('button', { name: 'Guardar horas' })).toBeEnabled()
    expect(onSaved).not.toHaveBeenCalled()
    expect(await db.hourLogs.count()).toBe(0)
  })
})
