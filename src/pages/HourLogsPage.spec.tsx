import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AuthProvider } from '@/auth/AuthContext'
import { db } from '@/offline/db'
import { HourLogsPage } from './HourLogsPage'

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
