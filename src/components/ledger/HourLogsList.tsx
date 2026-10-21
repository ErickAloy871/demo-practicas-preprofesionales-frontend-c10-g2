/**
 * HourLogsList.tsx
 *
 * Lista virtualizada del libro de horas. Extrae la lógica de renderizado de
 * filas de HourLogsPage para poder aplicar React.memo y @tanstack/react-virtual
 * sin tocar la página principal más de lo necesario.
 *
 * Decisiones de diseño:
 * - Virtualización con @tanstack/react-virtual para que el DOM solo contenga
 *   las filas visibles (+overscan), eliminando el lag con 500 registros.
 * - LedgerRow se envuelve en memo() con comparador de props para evitar
 *   re-renders al hacer scroll.
 * - El canalón de sincronización (SyncGutter) vive dentro de LedgerRow y
 *   sigue siendo reactivo; no se tocó su lógica.
 */

import { memo, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Ledger, LedgerHeaderRow } from '@/components/ledger/Ledger'
import { LedgerRow } from '@/components/ledger/LedgerRow'
import { EmptyState } from '@/components/Panel'
import { StatusBadge } from '@/components/StatusBadge'
import { parseLocalDate } from '@/lib/date'
import type { LocalHourLog } from '@/offline/db'

// ─── Helper de formato de fecha (igual que en HourLogsPage) ──────────────────

function formatDate(dateValue: string): string {
  const parsed = parseLocalDate(dateValue)
  if (Number.isNaN(parsed.getTime())) return dateValue
  return new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed)
}

// ─── Cabecera de columnas ─────────────────────────────────────────────────────

function LedgerColumnHeader() {
  return (
    <LedgerHeaderRow>
      <span className="w-28">Fecha</span>
      <span className="w-28">Horario</span>
      <span className="w-14">Horas</span>
      <span className="flex-1">Actividad</span>
      <span className="w-32 text-right">Estado</span>
    </LedgerHeaderRow>
  )
}

// ─── Fila individual memoizada ────────────────────────────────────────────────

interface HourLogRowProps {
  log: LocalHourLog
}

/**
 * Fila memoizada: solo se re-renderiza cuando alguna de sus props cambia.
 * El comparador profundo evita renders fantasma al actualizar otros registros.
 */
const HourLogRow = memo(
  function HourLogRow({ log }: HourLogRowProps) {
    return (
      <LedgerRow
        syncState={log.syncState}
        note={log.reviewNote}
        data-testid="hour-log-row"
      >
        <span className="font-data text-14 text-ink sm:w-28">
          {formatDate(log.date)}
        </span>
        <span className="font-data text-13 text-inkSoft sm:w-28">
          {log.startTime}–{log.endTime}
        </span>
        <span className="font-data text-14 text-ink sm:w-14">{log.hours}</span>
        <span className="flex-1 text-14 text-inkBody">{log.activity}</span>
        <span className="sm:w-32 sm:text-right">
          <StatusBadge status={log.status} />
        </span>
      </LedgerRow>
    )
  },
  (prev, next) =>
    prev.log.id === next.log.id &&
    prev.log.date === next.log.date &&
    prev.log.startTime === next.log.startTime &&
    prev.log.endTime === next.log.endTime &&
    prev.log.hours === next.log.hours &&
    prev.log.activity === next.log.activity &&
    prev.log.status === next.log.status &&
    prev.log.syncState === next.log.syncState &&
    prev.log.reviewNote === next.log.reviewNote,
)

// ─── Lista virtualizada ───────────────────────────────────────────────────────

interface HourLogsListProps {
  /** Registros en orden cronológico ascendente (más reciente al final). */
  logs: LocalHourLog[]
}

/**
 * Renderiza la lista de registros de horas con virtualización.
 *
 * La lista llega en orden `sortBy('date')` (ascendente) pero se invierte para
 * mostrar el registro más reciente primero, tal como hacía la versión original.
 *
 * Con virtualización, el DOM mantiene únicamente ~10-15 nodos visibles
 * independientemente del tamaño del dataset.
 */
export function HourLogsList({ logs }: HourLogsListProps) {
  if (logs.length === 0) {
    return (
      <EmptyState
        title="Todavía no has registrado horas"
        description="Puedes hacerlo sin conexión: se sincroniza cuando vuelva la señal."
      />
    )
  }

  // Invertimos el arreglo una sola vez (fuera del render de cada fila)
  const reversed = [...logs].reverse()

  return <VirtualList logs={reversed} />
}

// ─── Componente de virtualización (separado para que el hook sea válido) ──────

function VirtualList({ logs }: { logs: LocalHourLog[] }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: logs.length,
    getScrollElement: () => parentRef.current,
    // Altura estimada de cada fila. Si el contenido es dinámico, react-virtual
    // la ajusta automáticamente con measureElement en el segundo render.
    estimateSize: () => 56,
    overscan: 5,
  })

  return (
    <Ledger header={<LedgerColumnHeader />}>
      {/* Contenedor scrollable */}
      <div
        ref={parentRef}
        className="overflow-auto"
        // Altura máxima: el 100% del viewport menos el encabezado de la página
        style={{ maxHeight: 'calc(100dvh - 220px)' }}
        data-testid="hour-log-virtual-container"
      >
        {/* Riel espaciador: le dice al navegador cuánto espacio ocupa toda la lista */}
        <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
          {rowVirtualizer.getVirtualItems().map((virtualItem) => (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={rowVirtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <HourLogRow log={logs[virtualItem.index]} />
            </div>
          ))}
        </div>
      </div>
    </Ledger>
  )
}
