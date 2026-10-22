import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AuthProvider } from '@/auth/AuthContext'
import { db } from '@/offline/db'
import { ReviewHoursPage } from './ReviewHoursPage'

function withProviders({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter initialEntries={['/practicantes/1/horas']}>
      <AuthProvider>
        <Routes>
          <Route path="/practicantes/:id/horas" element={children} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

async function seedLogs(count: number, submittedUntil = 0) {
  localStorage.setItem('access_token', 'test-access-token')
  localStorage.setItem(
    'user',
    JSON.stringify({ id: 7, email: 'tutor0@miyura.com', fullName: 'Tutor', role: 'TUTOR', companyId: null }),
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

beforeEach(async () => {
  await db.delete()
  await db.open()
  localStorage.clear()
})

describe('ReviewHoursPage pagination and filters', () => {
  it('shows 10 logs per page, newest first, and moves between pages', async () => {
    await seedLogs(12)
    render(<ReviewHoursPage />, { wrapper: withProviders })

    expect(await screen.findByText('Mostrando 1–10 de 12 registros')).toBeInTheDocument()
    expect(firstActivity()).toHaveTextContent('Actividad 12')

    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }))

    expect(await screen.findByText('Mostrando 11–12 de 12 registros')).toBeInTheDocument()
    expect(firstActivity()).toHaveTextContent('Actividad 2')
  })

  it('filters the logs waiting for review', async () => {
    await seedLogs(12, 3)
    render(<ReviewHoursPage />, { wrapper: withProviders })
    await screen.findByText('Mostrando 1–10 de 12 registros')

    await userEvent.click(screen.getByRole('button', { name: 'Por revisar' }))

    expect(await screen.findByText('Mostrando 1–3 de 3 registros')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Aprobar' })).toHaveLength(3)
  })

  it('searches logs by activity', async () => {
    await seedLogs(12)
    render(<ReviewHoursPage />, { wrapper: withProviders })
    await screen.findByText('Mostrando 1–10 de 12 registros')

    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar registros' }), 'Actividad 7')

    expect(await screen.findByText('Mostrando 1–1 de 1 registros')).toBeInTheDocument()
    expect(firstActivity()).toHaveTextContent('Actividad 7')
  })

  it('tells the tutor when no log matches and hides the pagination', async () => {
    await seedLogs(12)
    render(<ReviewHoursPage />, { wrapper: withProviders })
    await screen.findByText('Mostrando 1–10 de 12 registros')

    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar registros' }), 'zzz')

    expect(await screen.findByText('Ningún registro coincide con los filtros')).toBeInTheDocument()
    expect(screen.queryByText(/Mostrando/)).not.toBeInTheDocument()
  })

  it('keeps the empty state and no pagination when there are no logs at all', async () => {
    await seedLogs(0)
    render(<ReviewHoursPage />, { wrapper: withProviders })

    expect(await screen.findByText('No tienes horas pendientes de revisar')).toBeInTheDocument()
    expect(screen.queryByText(/Mostrando/)).not.toBeInTheDocument()
  })
})
