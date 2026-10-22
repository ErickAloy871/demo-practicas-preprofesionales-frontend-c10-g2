import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '@/auth/AuthContext'
import { db } from '@/offline/db'
import { AppLayout } from './AppLayout'

vi.mock('@/offline/sync/scheduler', () => ({
  startSync: vi.fn(() => vi.fn()),
  syncNow: vi.fn().mockResolvedValue(undefined),
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

describe('AppLayout', () => {
  it('renderiza la cabecera con el logotipo y enlaces de navegación para un estudiante', async () => {
    localStorage.setItem('access_token', 'token')
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 5,
        email: 'estudiante0@miyura.com',
        fullName: 'Carlos Gómez',
        role: 'STUDENT',
      }),
    )

    render(<AppLayout />, { wrapper: withProviders })

    // Header branding
    expect(screen.getByText('prácticas.')).toBeInTheDocument()
    expect(screen.getByText('Gestión académica')).toBeInTheDocument()

    // Usuario y avatar con iniciales
    expect(screen.getByText('Carlos Gómez')).toBeInTheDocument()
    expect(screen.getByText('Estudiante')).toBeInTheDocument()
    expect(screen.getByText('CG')).toBeInTheDocument()

    // Enlaces de navegación del estudiante
    expect(screen.getByRole('link', { name: /Inicio/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Mis horas/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Documentos/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ofertas/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Mis postulaciones/i })).toBeInTheDocument()

    // Botón de salir
    const salirBtn = screen.getByRole('button', { name: 'Salir' })
    expect(salirBtn).toBeInTheDocument()
    fireEvent.click(salirBtn)
  })

  it('renderiza enlaces de navegación correspondientes para un tutor', async () => {
    localStorage.setItem('access_token', 'token')
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 7,
        email: 'tutor0@miyura.com',
        fullName: 'María Paredes',
        role: 'TUTOR',
      }),
    )

    render(<AppLayout />, { wrapper: withProviders })

    expect(screen.getByText('María Paredes')).toBeInTheDocument()
    expect(screen.getByText('Tutor')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Mis practicantes/i })).toBeInTheDocument()
  })
})
