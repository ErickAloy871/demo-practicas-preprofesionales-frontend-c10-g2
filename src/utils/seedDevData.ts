/**
 * seedDevData.ts
 *
 * Utilidad de desarrollo para poblar Dexie con datos de prueba y medir la
 * línea base de rendimiento del Libro de Horas con 500 registros.
 *
 * USO (en la consola del navegador):
 *   await window.__seedHourLogs(500)
 *
 * IMPORTANTE:
 * - El esquema de Dexie define `hourLogs: 'id, placementId, status, date, syncState, updatedAt'`.
 * - La clave primaria `id` es de tipo `number` (NO es autoincremental `++id`).
 * - Por lo tanto, cada objeto DEBE incluir un `id` numérico explícito y único para no
 *   disparar DataError en IndexedDB al evaluar el keyPath 'id'.
 */

import { db, type LocalHourLog } from '@/offline/db'
import type { SyncState } from '@/components/ledger/SyncGutter'

// ─── Generador de datos sintéticos ───────────────────────────────────────────

const SYNC_STATES: SyncState[] = ['synced', 'queued', 'local', 'failed']
const STATUSES: LocalHourLog['status'][] = [
  'APPROVED',
  'SUBMITTED',
  'DRAFT',
  'REJECTED',
]
const ACTIVITIES = [
  'Desarrollo de módulo de autenticación y tokens JWT',
  'Revisión de requerimientos y casos de uso con tutor empresarial',
  'Implementación de pruebas unitarias y mocks en Vitest',
  'Documentación técnica de arquitectura y manual de usuario',
  'Corrección de incidencias reportadas en pruebas de aceptación',
  'Reunión semanal de sincronización de avances del proyecto',
  'Despliegue y configuración de contenedores en ambiente de pruebas',
  'Optimización de consultas y modelado de datos en base de datos',
]

/**
 * Construye un arreglo de `count` registros `LocalHourLog` con datos
 * representativos de un semestre completo.
 *
 * Asigna un `id` numérico explícito secuencial a cada registro a partir de `startId`
 * para satisfacer la clave primaria obligatoria del object store de Dexie.
 */
export function buildMockHourLogs(
  placementId: number,
  count: number,
  startId: number = 1000,
): LocalHourLog[] {
  const logs: LocalHourLog[] = []
  const now = new Date()

  for (let i = 0; i < count; i++) {
    const date = new Date(now)
    // Fechas espaciadas en días hacia atrás para simular un historial cronológico
    date.setDate(now.getDate() - i)
    const dateStr = date.toISOString().slice(0, 10)

    const startHour = 8 + (i % 4) // 08:00 a 11:00
    const duration = (i % 4) + 1 // 1 a 4 horas (determinista, sin sonarjs/pseudo-random)
    const endHour = startHour + duration

    const status = STATUSES[i % STATUSES.length]
    const syncState = SYNC_STATES[i % SYNC_STATES.length]
    const reviewNote =
      status === 'REJECTED'
        ? 'Actividad fuera del horario o no corresponde al período académico.'
        : null

    logs.push({
      id: startId + i,
      placementId,
      date: dateStr,
      startTime: `${String(startHour).padStart(2, '0')}:00`,
      endTime: `${String(endHour).padStart(2, '0')}:00`,
      hours: duration,
      activity: ACTIVITIES[i % ACTIVITIES.length],
      status,
      reviewNote,
      version: 1,
      updatedAt: date.toISOString(),
      syncState,
    })
  }

  return logs
}

/**
 * Siembra `count` registros en la tabla `hourLogs` de Dexie para el `placementId` indicado.
 * Si no se pasa `placementId`, busca la práctica activa en Dexie o usa 1 por defecto.
 */
export async function seedDexieWithMockData(
  placementId?: number,
  count: number = 500,
): Promise<void> {
  try {
    console.info(`[seedDevData] ⏳ Iniciando sembrado de ${count} registros en Dexie...`)

    // 1. Resolver el placementId si no fue provisto
    let targetPlacementId = placementId
    if (!targetPlacementId) {
      const activePlacement = await db.placements.toCollection().first()
      targetPlacementId = activePlacement?.id ?? 1
    }

    // 2. Limpiar registros previos de este placement para evitar acumulación
    const deletedCount = await db.hourLogs
      .where('placementId')
      .equals(targetPlacementId)
      .delete()
    if (deletedCount > 0) {
      console.info(
        `[seedDevData] 🧹 Se eliminaron ${deletedCount} registros antiguos del placement ${targetPlacementId}.`,
      )
    }

    // 3. Determinar el ID numérico inicial para garantizar claves primarias únicas
    const lastRecord = await db.hourLogs.orderBy('id').last()
    const nextStartId = (lastRecord?.id ?? 0) + 1

    // 4. Generar dataset con claves primarias explícitas
    const logs = buildMockHourLogs(targetPlacementId, count, nextStartId)

    // 5. Validación visual en consola del primer objeto generado
    console.info('[seedDevData] 🔍 Muestra del primer registro generado (validación de keyPath y tipos):', logs[0])

    // 6. Inserción masiva en Dexie
    await db.hourLogs.bulkPut(logs)

    // 7. Verificación de conteo final en base de datos local
    const totalInDb = await db.hourLogs
      .where('placementId')
      .equals(targetPlacementId)
      .count()

    console.info(
      `[seedDevData] ✅ ÉXITO: ${count} registros sembrados correctamente (Total en placement ${targetPlacementId}: ${totalInDb}).`,
    )
    console.info(
      '[seedDevData] 🚀 Ahora podés abrir Chrome DevTools → Performance → CPU 4x Throttling y medir el scroll.',
    )
  } catch (error) {
    console.error('[seedDevData] ❌ Error crítico al sembrar datos en Dexie:', error)
    if (error instanceof Error) {
      console.error('[seedDevData] Detalle del mensaje:', error.message)
      console.error('[seedDevData] Stack trace:', error.stack)
    }
    throw error
  }
}

// ─── Exposición en window (solo en modo DEV) ──────────────────────────────────

if (import.meta.env.DEV) {
  ;(
    window as Window &
      typeof globalThis & {
        __seedHourLogs: (count?: number, placementId?: number) => Promise<void>
      }
  ).__seedHourLogs = (count = 500, placementId?: number) =>
    seedDexieWithMockData(placementId, count)
}
