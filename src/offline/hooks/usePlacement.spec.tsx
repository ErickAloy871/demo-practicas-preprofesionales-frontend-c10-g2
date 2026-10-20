import type { ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AuthProvider, type AuthUser } from '@/auth/AuthContext'
import { db, type LocalPlacement } from '@/offline/db'
import { usePlacement } from './usePlacement'

const studentUser: AuthUser = {
  id: 5,
  email: 'estudiante@miyura.com',
  fullName: 'Estudiante Prueba',
  role: 'STUDENT',
  companyId: null,
}

const tutorUser: AuthUser = {
  id: 12,
  email: 'tutor@miyura.com',
  fullName: 'Tutor Prueba',
  role: 'TUTOR',
  companyId: null,
}

const samplePlacement: LocalPlacement = {
  id: 1,
  studentId: 5,
  tutorId: 12,
  companyId: 2,
  startDate: '2026-01-01',
  endDate: '2026-06-01',
  requiredHours: 200,
  status: 'ACTIVE',
  version: 1,
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const otherStudentPlacement: LocalPlacement = {
  id: 2,
  studentId: 99,
  tutorId: 12,
  companyId: 2,
  startDate: '2026-02-01',
  endDate: '2026-07-01',
  requiredHours: 160,
  status: 'ACTIVE',
  version: 1,
  updatedAt: '2026-02-01T00:00:00.000Z',
}

function createAuthWrapper(authUser: AuthUser | null) {
  localStorage.clear()
  if (authUser) {
    const futureExp = Math.floor(Date.now() / 1000) + 3600
    const token = `header.${btoa(JSON.stringify({ exp: futureExp }))}.sig`
    localStorage.setItem('access_token', token)
    localStorage.setItem('user', JSON.stringify(authUser))
  }

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter>
        <AuthProvider>{children}</AuthProvider>
      </MemoryRouter>
    )
  }
}

describe('usePlacement', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
    localStorage.clear()
  })

  it('inicia en estado de carga (undefined)', () => {
    const { result } = renderHook(() => usePlacement(), {
      wrapper: createAuthWrapper(studentUser),
    })

    expect(result.current).toBeUndefined()
  })

  it('retorna null cuando la colección está vacía o el estudiante no tiene placement', async () => {
    // Insertamos solo el placement de otro estudiante
    await db.placements.put(otherStudentPlacement)

    const { result } = renderHook(() => usePlacement(), {
      wrapper: createAuthWrapper(studentUser),
    })

    await waitFor(() => {
      expect(result.current).toBeNull()
    })
  })

  it('retorna el placement cuando existen datos presentes para el estudiante autenticado', async () => {
    await db.placements.bulkPut([samplePlacement, otherStudentPlacement])

    const { result } = renderHook(() => usePlacement(), {
      wrapper: createAuthWrapper(studentUser),
    })

    await waitFor(() => {
      expect(result.current).toEqual(samplePlacement)
    })
  })

  it('retorna null si no hay ningún usuario autenticado', async () => {
    await db.placements.put(samplePlacement)

    const { result } = renderHook(() => usePlacement(), {
      wrapper: createAuthWrapper(null),
    })

    await waitFor(() => {
      expect(result.current).toBeNull()
    })
  })

  it('retorna null si el usuario autenticado no tiene rol STUDENT', async () => {
    await db.placements.put(samplePlacement)

    const { result } = renderHook(() => usePlacement(), {
      wrapper: createAuthWrapper(tutorUser),
    })

    await waitFor(() => {
      expect(result.current).toBeNull()
    })
  })

  it('actualiza el placement reactivamente ante cambios en la base local', async () => {
    await db.placements.put(samplePlacement)

    const { result } = renderHook(() => usePlacement(), {
      wrapper: createAuthWrapper(studentUser),
    })

    await waitFor(() => {
      expect(result.current).toEqual(samplePlacement)
    })

    // Modificar la plaza localmente en tiempo real
    await act(async () => {
      await db.placements.update(samplePlacement.id, {
        status: 'COMPLETED',
        requiredHours: 240,
      })
    })

    await waitFor(() => {
      expect(result.current?.status).toBe('COMPLETED')
      expect(result.current?.requiredHours).toBe(240)
    })

    // Eliminar la plaza localmente
    await act(async () => {
      await db.placements.delete(samplePlacement.id)
    })

    await waitFor(() => {
      expect(result.current).toBeNull()
    })
  })
})
