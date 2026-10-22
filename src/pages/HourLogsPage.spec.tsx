import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '@/auth/AuthContext'
import { db } from '@/offline/db'
import { HourLogsPage } from './HourLogsPage'
import type { VirtualItem } from '@tanstack/react-virtual'

// G2-27: HourLogsList usa virtualización; en JSDOM los elementos tienen altura
// 0 y useVirtualizer no genera ítems. Mockeamos el hook para que devuelva los
// primeros ítems como visibles y el test funcione igual que antes.
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: vi.fn((options: { count: number; estimateSize: () => number }) => {
    const size = options.estimateSize()
    const visibleCount = Math.min(options.count, 5)
    const items: VirtualItem[] = Array.from({ length: visibleCount }, (_, i) => ({
      index: i,
      key: i,
      start: i * size,
      size,
      end: i * size + size,
      lane: 0,
    }))
    return {
      getVirtualItems: () => items,
      getTotalSize: () => options.count * size,
      measureElement: () => undefined,
    }
  }),
}))


function withProviders({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <AuthProvider>{children}</AuthProvider>
    </MemoryRouter>
  )
}

beforeEach(async () => {
  await db.delete()
  await db.open()
  localStorage.clear()
})

describe('HourLogsPage', () => {
  it('shows the rejection reason for an hour log the server rejected', async () => {
    localStorage.setItem('access_token', 'test-access-token')
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 5, email: 'estudiante0@miyura.com', fullName: 'Estudiante', role: 'STUDENT', companyId: null }),
    )
    await db.placements.put({
      id: 1,
      studentId: 5,
      tutorId: 7,
      companyId: 1,
      startDate: '2026-01-01',
      endDate: '2026-06-01',
      requiredHours: 200,
      status: 'ACTIVE',
      version: 1,
      updatedAt: '2026-01-01T00:00:00.000Z',
    })
    await db.hourLogs.put({
      id: 1,
      placementId: 1,
      date: '2026-04-02',
      startTime: '08:00',
      endTime: '12:00',
      hours: 4,
      activity: 'Soporte',
      status: 'APPROVED',
      reviewNote: 'el tutor ya revisó esta hora; tu edición no se aplicó',
      version: 2,
      updatedAt: '2026-04-02T00:00:00.000Z',
      syncState: 'failed',
    })

    render(<HourLogsPage />, { wrapper: withProviders })

    expect(await screen.findByText('el tutor ya revisó esta hora; tu edición no se aplicó')).toBeInTheDocument()
  })
})

async function seedLogs(count: number, submittedUntil = 0) {
  localStorage.setItem('access_token', 'test-access-token')
  localStorage.setItem(
    'user',
    JSON.stringify({ id: 5, email: 'estudiante0@miyura.com', fullName: 'Estudiante', role: 'STUDENT', companyId: null }),
  )
  await db.placements.put({
    id: 1,
    studentId: 5,
    tutorId: 7,
    companyId: 1,
    startDate: '2026-01-01',
    endDate: '2026-06-01',
    requiredHours: 200,
    status: 'ACTIVE',
    version: 1,
    updatedAt: '2026-01-01T00:00:00.000Z',
  })
  await db.hourLogs.bulkPut(
    Array.from({ length: count }, (_, index) => {
      const number = index + 1
      return {
        id: number,
        placementId: 1,
        date: `2026-03-${String(number).padStart(2, '0')}`,
        startTime: '08:00',
        endTime: '10:00',
        hours: 2,
        activity: `Actividad ${number}`,
        status: number <= submittedUntil ? ('SUBMITTED' as const) : ('APPROVED' as const),
        reviewNote: null,
        version: 1,
        updatedAt: '2026-03-01T00:00:00.000Z',
        syncState: 'synced' as const,
      }
    }),
  )
}

function firstActivity() {
  return screen.getAllByText(/^Actividad \d+$/)[0]
}

describe('HourLogsPage pagination and filters', () => {
  it('shows 10 logs per page, newest first, and moves between pages', async () => {
    await seedLogs(12)
    render(<HourLogsPage />, { wrapper: withProviders })

    expect(await screen.findByText('Mostrando 1–10 de 12 registros')).toBeInTheDocument()
    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument()
    expect(firstActivity()).toHaveTextContent('Actividad 12')

    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }))

    expect(await screen.findByText('Mostrando 11–12 de 12 registros')).toBeInTheDocument()
    expect(screen.getByText('Página 2 de 2')).toBeInTheDocument()
    expect(firstActivity()).toHaveTextContent('Actividad 2')
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Anterior' }))

    expect(await screen.findByText('Mostrando 1–10 de 12 registros')).toBeInTheDocument()
  })

  it('changes how many logs are shown per page', async () => {
    await seedLogs(12)
    render(<HourLogsPage />, { wrapper: withProviders })
    await screen.findByText('Mostrando 1–10 de 12 registros')

    await userEvent.click(screen.getByRole('button', { name: '20' }))

    expect(await screen.findByText('Mostrando 1–12 de 12 registros')).toBeInTheDocument()
    expect(screen.getByText('Página 1 de 1')).toBeInTheDocument()
  })

  it('filters by status and goes back to the first page', async () => {
    await seedLogs(12, 3)
    render(<HourLogsPage />, { wrapper: withProviders })
    await screen.findByText('Mostrando 1–10 de 12 registros')
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }))

    await userEvent.click(screen.getByRole('button', { name: 'Por revisar' }))

    expect(await screen.findByText('Mostrando 1–3 de 3 registros')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Aprobados' }))

    expect(await screen.findByText('Mostrando 1–9 de 9 registros')).toBeInTheDocument()
  })

  it('searches logs by activity', async () => {
    await seedLogs(12)
    render(<HourLogsPage />, { wrapper: withProviders })
    await screen.findByText('Mostrando 1–10 de 12 registros')

    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar registros' }), 'Actividad 7')

    expect(await screen.findByText('Mostrando 1–1 de 1 registros')).toBeInTheDocument()
    expect(firstActivity()).toHaveTextContent('Actividad 7')
  })

  it('tells the user when no log matches and hides the pagination', async () => {
    await seedLogs(12)
    render(<HourLogsPage />, { wrapper: withProviders })
    await screen.findByText('Mostrando 1–10 de 12 registros')

    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar registros' }), 'zzz')

    expect(await screen.findByText('Ningún registro coincide con los filtros')).toBeInTheDocument()
    expect(screen.queryByText(/Mostrando/)).not.toBeInTheDocument()
  })

  it('keeps the empty state and no pagination when there are no logs at all', async () => {
    await seedLogs(0)
    render(<HourLogsPage />, { wrapper: withProviders })

    expect(await screen.findByText('Todavía no has registrado horas')).toBeInTheDocument()
    expect(screen.queryByText(/Mostrando/)).not.toBeInTheDocument()
  })
})
