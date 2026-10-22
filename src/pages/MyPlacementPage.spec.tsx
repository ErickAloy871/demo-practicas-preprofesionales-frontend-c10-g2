import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AuthProvider } from '@/auth/AuthContext'
import { db } from '@/offline/db'
import { MyPlacementPage } from './MyPlacementPage'

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

describe('MyPlacementPage', () => {
  it('muestra aviso de documentos obligatorios pendientes si no se han subido', async () => {
    localStorage.setItem('access_token', 'token')
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 5, email: 'estudiante0@miyura.com', fullName: 'Estudiante', role: 'STUDENT' }),
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

    render(<MyPlacementPage />, { wrapper: withProviders })

    expect(await screen.findByText('Faltan documentos obligatorios por subir')).toBeInTheDocument()
    expect(screen.getByText(/Tienes pendiente subir: Convenio y Seguro/i)).toBeInTheDocument()
  })

  it('muestra estado vacío si no hay práctica asignada', async () => {
    localStorage.setItem('access_token', 'token')
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 99, email: 'sinpractica@miyura.com', fullName: 'Estudiante', role: 'STUDENT' }),
    )

    render(<MyPlacementPage />, { wrapper: withProviders })

    expect(await screen.findByText('No tienes una práctica activa todavía')).toBeInTheDocument()
  })
})
