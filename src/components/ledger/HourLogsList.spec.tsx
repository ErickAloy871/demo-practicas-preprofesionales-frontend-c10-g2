/**
 * HourLogsList.spec.tsx
 *
 * Tests del componente virtualizado HourLogsList.
 *
 * Estrategia de mocking:
 * - `@tanstack/react-virtual`: los elementos en JSDOM tienen altura 0,
 *   por lo que useVirtualizer no genera ítems virtuales. Lo mockeamos para
 *   que devuelva los primeros N ítems como si fueran visibles.
 * - `dexie-react-hooks`: NO se mockea. El test usa `fake-indexeddb/auto`
 *   (que ya carga el test-setup.ts global) para tener una IndexedDB real en
 *   memoria, exactamente como los tests existentes de HourLogsPage.spec.tsx.
 */

import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/offline/db'
import { HourLogsList } from './HourLogsList'
import type { VirtualItem } from '@tanstack/react-virtual'

// ─── Mock de @tanstack/react-virtual ────────────────────────────────────────

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: vi.fn((options: { count: number; estimateSize: () => number }) => {
    const size = options.estimateSize()
    // Devolvemos los primeros 5 ítems (o los que haya) como "visibles"
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

// ─── Fixtures ────────────────────────────────────────────────────────────────

const BASE_LOG = {
  placementId: 1,
  startTime: '08:00',
  endTime: '12:00',
  hours: 4,
  activity: 'Desarrollo de módulo',
  version: 1,
  updatedAt: '2026-04-01T00:00:00.000Z',
  reviewNote: null,
} as const

beforeEach(async () => {
  await db.delete()
  await db.open()
})

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('HourLogsList', () => {
  it('muestra el estado vacío cuando no hay registros', () => {
    render(<HourLogsList logs={[]} />)

    expect(
      screen.getByText('Todavía no has registrado horas'),
    ).toBeInTheDocument()
  })

  it('renderiza las filas visibles (virtualización con mock)', () => {
    const logs = Array.from({ length: 10 }, (_, i) => ({
      ...BASE_LOG,
      id: i + 1,
      date: `2026-04-${String(i + 1).padStart(2, '0')}`,
      status: 'APPROVED' as const,
      syncState: 'synced' as const,
    }))

    render(<HourLogsList logs={logs} />)

    // El mock devuelve 5 ítems; deben estar en el DOM
    const rows = screen.getAllByRole('img') // SyncGutter usa role="img" + aria-label
    expect(rows.length).toBeGreaterThanOrEqual(1)
  })

  it('muestra el canalón de sincronización para registros locales', () => {
    const logs = [
      {
        ...BASE_LOG,
        id: 1,
        date: '2026-04-01',
        status: 'DRAFT' as const,
        syncState: 'local' as const,
      },
    ]

    render(<HourLogsList logs={logs} />)

    // SyncGutter renderiza aria-label según el estado de sincronización
    expect(screen.getByRole('img', { name: 'Sin sincronizar' })).toBeInTheDocument()
  })

  it('muestra el canalón de fallo para registros con syncState failed', () => {
    const logs = [
      {
        ...BASE_LOG,
        id: 2,
        date: '2026-04-02',
        status: 'REJECTED' as const,
        syncState: 'failed' as const,
        reviewNote: 'Actividad no corresponde al período',
      },
    ]

    render(<HourLogsList logs={logs} />)

    expect(screen.getByRole('img', { name: 'Rechazado' })).toBeInTheDocument()
  })

  it('muestra la nota de revisión cuando el syncState es failed', () => {
    const logs = [
      {
        ...BASE_LOG,
        id: 3,
        date: '2026-04-03',
        status: 'REJECTED' as const,
        syncState: 'failed' as const,
        reviewNote: 'El horario no coincide con el registro del tutor',
      },
    ]

    render(<HourLogsList logs={logs} />)

    expect(
      screen.getByText('El horario no coincide con el registro del tutor'),
    ).toBeInTheDocument()
  })

  it('respeta el orden recibido sin invertirlo', () => {
    const logs = [
      { ...BASE_LOG, id: 1, date: '2026-04-09', activity: 'Más reciente', status: 'APPROVED' as const, syncState: 'synced' as const },
      { ...BASE_LOG, id: 2, date: '2026-04-01', activity: 'Más antigua', status: 'APPROVED' as const, syncState: 'synced' as const },
    ]

    render(<HourLogsList logs={logs} />)

    const activities = screen.getAllByText(/^Más (reciente|antigua)$/)
    expect(activities[0]).toHaveTextContent('Más reciente')
    expect(activities[1]).toHaveTextContent('Más antigua')
  })

  it('no muestra nota cuando syncState no es failed', () => {
    const logs = [
      {
        ...BASE_LOG,
        id: 4,
        date: '2026-04-04',
        status: 'APPROVED' as const,
        syncState: 'synced' as const,
        reviewNote: 'algún motivo',
      },
    ]

    render(<HourLogsList logs={logs} />)

    expect(screen.queryByText('algún motivo')).not.toBeInTheDocument()
  })
})
