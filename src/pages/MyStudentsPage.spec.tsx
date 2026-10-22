import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AuthProvider } from '@/auth/AuthContext'
import { db } from '@/offline/db'
import { MyStudentsPage } from './MyStudentsPage'

function withProviders({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <AuthProvider>{children}</AuthProvider>
    </MemoryRouter>
  )
}

async function seedStudents(count: number, pendingUntil = 0) {
  localStorage.setItem('access_token', 'test-access-token')
  localStorage.setItem(
    'user',
    JSON.stringify({ id: 7, email: 'tutor0@miyura.com', fullName: 'Tutor', role: 'TUTOR', companyId: null }),
  )
  for (let number = 1; number <= count; number += 1) {
    await db.placements.put({
      id: number,
      studentId: 100 + number,
      tutorId: 7,
      companyId: 1,
      startDate: '2026-01-01',
      endDate: '2026-06-01',
      requiredHours: 200,
      status: 'ACTIVE',
      version: 1,
      updatedAt: '2026-01-01T00:00:00.000Z',
    })
    if (number <= pendingUntil) {
      await db.hourLogs.put({
        id: number,
        placementId: number,
        date: '2026-03-01',
        startTime: '08:00',
        endTime: '10:00',
        hours: 2,
        activity: 'Soporte',
        status: 'SUBMITTED',
        reviewNote: null,
        version: 1,
        updatedAt: '2026-03-01T00:00:00.000Z',
        syncState: 'synced',
      })
    }
  }
}

function firstStudent() {
  return screen.getAllByText(/^Estudiante #\d+$/)[0]
}

beforeEach(async () => {
  await db.delete()
  await db.open()
  localStorage.clear()
})

describe('MyStudentsPage pagination and filters', () => {
  it('shows 10 students per page and moves between pages', async () => {
    await seedStudents(12)
    render(<MyStudentsPage />, { wrapper: withProviders })

    expect(await screen.findByText('Mostrando 1–10 de 12 practicantes')).toBeInTheDocument()
    expect(firstStudent()).toHaveTextContent('Estudiante #101')

    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }))

    expect(await screen.findByText('Mostrando 11–12 de 12 practicantes')).toBeInTheDocument()
    expect(firstStudent()).toHaveTextContent('Estudiante #111')
  })

  it('filters the students waiting for review and the ones up to date', async () => {
    await seedStudents(12, 3)
    render(<MyStudentsPage />, { wrapper: withProviders })
    await screen.findByText('Mostrando 1–10 de 12 practicantes')

    await userEvent.click(screen.getByRole('button', { name: 'Por revisar' }))

    expect(await screen.findByText('Mostrando 1–3 de 3 practicantes')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Al día' }))

    expect(await screen.findByText('Mostrando 1–9 de 9 practicantes')).toBeInTheDocument()
  })

  it('searches students by id', async () => {
    await seedStudents(12)
    render(<MyStudentsPage />, { wrapper: withProviders })
    await screen.findByText('Mostrando 1–10 de 12 practicantes')

    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar practicantes' }), 'Estudiante #105')

    expect(await screen.findByText('Mostrando 1–1 de 1 practicantes')).toBeInTheDocument()
    expect(firstStudent()).toHaveTextContent('Estudiante #105')
  })

  it('tells the tutor when no student matches and hides the pagination', async () => {
    await seedStudents(12)
    render(<MyStudentsPage />, { wrapper: withProviders })
    await screen.findByText('Mostrando 1–10 de 12 practicantes')

    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar practicantes' }), 'zzz')

    expect(await screen.findByText('Ningún practicante coincide con los filtros')).toBeInTheDocument()
    expect(screen.queryByText(/Mostrando/)).not.toBeInTheDocument()
  })

  it('shows only the empty state when the tutor has no students assigned', async () => {
    await seedStudents(0)
    render(<MyStudentsPage />, { wrapper: withProviders })

    expect(await screen.findByText('Todavía no tienes practicantes asignados')).toBeInTheDocument()
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    expect(screen.queryByText(/Mostrando/)).not.toBeInTheDocument()
  })
})
