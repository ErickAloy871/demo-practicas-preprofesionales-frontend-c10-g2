/**
 * seedDevData.ts
 *
 * Utilidad de desarrollo para poblar Dexie con datos de prueba y medir la
 * línea base de rendimiento del Libro de Horas con 500 registros.
 *
 * USO (en modo dev, desde la consola del navegador):
 *   await window.__seedHourLogs(500)
 *
 * Después abrí Chrome DevTools → Performance → CPU 4× → Mobile viewport
 * y tomá la métrica de referencia ANTES de aplicar la optimización.
 *
 * IMPORTANTE: Este archivo NO se incluye en el bundle de producción porque
 * Vite hace tree-shaking del bloque `if (import.meta.env.DEV)`.
 */

import { db, type LocalHourLog } from '@/offline/db'
import type { SyncState } from '@/components/ledger/SyncGutter'

// ─── Generador de datos sintéticos ───────────────────────────────────────────

const SYNC_STATES: SyncState[] = ['local', 'queued', 'synced', 'failed']
const STATUSES: LocalHourLog['status'][] = [
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
]
const ACTIVITIES = [
  'Desarrollo de módulo de autenticación',
  'Revisión de requerimientos con el tutor',
  'Implementación de pruebas unitarias',
  'Documentación del sistema',
  'Corrección de bugs reportados',
  'Reunión de seguimiento con el equipo',
  'Despliegue en ambiente de staging',
  'Análisis de base de datos',
]

/**
 * Construye un arreglo de `count` registros `LocalHourLog` con datos
 * aleatorios que simulan un semestre completo (fechas hacia atrás desde hoy).
 */
export function buildMockHourLogs(
  placementId: number,
  count: number,
): Omit<LocalHourLog, 'id'>[] {
  const logs: Omit<LocalHourLog, 'id'>[] = []
  const now = new Date()

  for (let i = 0; i < count; i++) {
    const date = new Date(now)
    date.setDate(now.getDate() - i)
    const dateStr = date.toISOString().slice(0, 10)

    const startHour = 8 + (i % 4) // 08:00 – 11:00
    const hours = (i % 4) + 1 // 1–4 h determinista (evita sonarjs/pseudo-random)
    const endHour = startHour + hours

    const status = STATUSES[i % STATUSES.length]
    const syncState = SYNC_STATES[i % SYNC_STATES.length]

    logs.push({
      placementId,
      date: dateStr,
      startTime: `${String(startHour).padStart(2, '0')}:00`,
      endTime: `${String(endHour).padStart(2, '0')}:00`,
      hours,
      activity: ACTIVITIES[i % ACTIVITIES.length],
      status,
      reviewNote:
        status === 'REJECTED' ? 'La actividad no corresponde al período.' : null,
      version: 1,
      updatedAt: date.toISOString(),
      syncState,
    })
  }
  return logs
}

/**
 * Borra los registros de horas del placement y los reemplaza con `count`
 * entradas sintéticas. Devuelve los IDs insertados.
 */
export async function seedDexieWithMockData(
  placementId: number = 1,
  count: number = 500,
): Promise<void> {
  await db.hourLogs.where('placementId').equals(placementId).delete()
  const logs = buildMockHourLogs(placementId, count)
  await db.hourLogs.bulkAdd(logs as LocalHourLog[])
  console.info(
    `[seedDevData] ✅ ${count} HourLog entries added for placementId=${placementId}`,
  )
}

// ─── Exposición en window (solo en modo DEV) ──────────────────────────────────

if (import.meta.env.DEV) {
  ;(
    window as Window &
      typeof globalThis & {
        __seedHourLogs: (count?: number, placementId?: number) => Promise<void>
      }
  ).__seedHourLogs = (count = 500, placementId = 1) =>
    seedDexieWithMockData(placementId, count)
}
