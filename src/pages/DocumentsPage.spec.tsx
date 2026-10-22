import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '@/auth/AuthContext'
import { db } from '@/offline/db'
import { DocumentsPage } from './DocumentsPage'

vi.mock('@/api/client', () => ({
  api: vi.fn().mockResolvedValue({
    id: 1,
    placementId: 1,
    kind: 'AGREEMENT',
    filename: 'convenio.pdf',
    mimeType: 'application/pdf',
    size: 2048,
    status: 'SUBMITTED',
    storageKey: 'mock-key',
    version: 1,
    updatedAt: '2026-04-01T00:00:00.000Z',
  }),
  ApiError: class ApiError extends Error {},
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

describe('DocumentsPage', () => {
  it('muestra estado vacío si el estudiante no tiene placement activo', async () => {
    localStorage.setItem('access_token', 'token')
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 5, email: 'estudiante0@miyura.com', fullName: 'Estudiante', role: 'STUDENT' }),
    )

    render(<DocumentsPage />, { wrapper: withProviders })

    expect(await screen.findByText('No tienes una práctica activa todavía')).toBeInTheDocument()
  })

  it('renderiza la zona drag-and-drop y maneja selección y eliminación de archivo', async () => {
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

    const { container } = render(<DocumentsPage />, { wrapper: withProviders })

    // Zona drag-and-drop inicial
    expect(await screen.findByText('Arrastra y suelta tu archivo aquí')).toBeInTheDocument()
    expect(screen.getByText('Obligatorios para activar la práctica')).toBeInTheDocument()

    // Simular drag over en la dropzone
    const dropZone = screen.getByRole('button', { name: /arrastra y suelta/i })
    fireEvent.dragOver(dropZone)
    expect(screen.getByText('¡Suelta tu archivo aquí para cargarlo!')).toBeInTheDocument()

    fireEvent.dragLeave(dropZone)
    expect(screen.getByText('Arrastra y suelta tu archivo aquí')).toBeInTheDocument()

    // Simular selección de archivo
    const fileInput = container.querySelector('#document-file') as HTMLInputElement
    const file = new File(['dummy test content'], 'convenio_marco.pdf', { type: 'application/pdf' })
    fireEvent.change(fileInput, { target: { files: [file] } })

    // Verificar tarjeta de archivo listo
    expect(await screen.findByText('convenio_marco.pdf')).toBeInTheDocument()
    expect(screen.getByText('Archivo listo')).toBeInTheDocument()

    // Quitar archivo
    const removeBtn = screen.getByRole('button', { name: 'Quitar archivo seleccionado' })
    fireEvent.click(removeBtn)

    // Vuelve al estado inicial de dropzone
    expect(screen.getByText('Arrastra y suelta tu archivo aquí')).toBeInTheDocument()
  })

  it('muestra mensaje de error si se intenta subir sin archivo', async () => {
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

    render(<DocumentsPage />, { wrapper: withProviders })

    const submitBtn = await screen.findByRole('button', { name: 'Subir documento' })
    fireEvent.click(submitBtn)

    expect(await screen.findByText('Por favor selecciona o arrastra un archivo para continuar')).toBeInTheDocument()
  })
})
