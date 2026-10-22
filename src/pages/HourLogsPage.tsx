import { useMemo, useState } from 'react'
import { FilterTabs } from '@/components/FilterTabs'
import { HourLogForm } from '@/components/HourLogForm'
import { HoursProgressPanel } from '@/components/HoursProgressPanel'
import { PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/Pagination'
import { LoadingState, Panel } from '@/components/Panel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { HourLogsList } from '@/components/ledger/HourLogsList'
import {
  HOUR_LOG_STATUS_OPTIONS,
  type HourLogStatusFilter,
  filterHourLogs,
} from '@/lib/hourLogFilters'
import { type HoursSummary, summarizeHours } from '@/lib/hours'
import { usePagedList } from '@/lib/usePagedList'
import { plural } from '@/lib/utils'
import { EmptyState } from '@/components/Panel'
import { useHourLogs } from '@/offline/hooks/useHourLogs'
import { usePlacement } from '@/offline/hooks/usePlacement'

function submittedNote(hours: HoursSummary) {
  if (hours.submittedHours <= 0) return null
  return <span className="text-pending"> · {hours.submittedHours.toFixed(1)} sin aprobar</span>
}



function NewHourLogDialog({ placementId }: { placementId: number }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button">Registrar horas</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar horas</DialogTitle>
          <DialogDescription>
            Se guardan en este dispositivo y se sincronizan cuando haya conexión
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <HourLogForm placementId={placementId} onSaved={() => setOpen(false)} />
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}

export function HourLogsPage() {
  const placement = usePlacement()
  const logs = useHourLogs(placement?.id ?? -1)

  // G2-27: memoizamos los totales antes de cualquier early return para no
  // violar las Reglas de Hooks (los hooks deben llamarse siempre en el mismo
  // orden, sin condiciones). El cálculo es barato cuando logs es undefined
  // porque summarizeHours itera sobre un arreglo vacío.
  const hours = useMemo(
    () => summarizeHours(logs ?? [], placement?.requiredHours ?? 0),
    [logs, placement?.requiredHours],
  )

  const [status, setStatus] = useState<HourLogStatusFilter>('ALL')
  const [query, setQuery] = useState('')
  const visibleLogs = useMemo(
    () => filterHourLogs([...(logs ?? [])].reverse(), status, query),
    [logs, status, query],
  )
  const paged = usePagedList(visibleLogs, `${status}|${query}`)

  if (placement === undefined) {
    return <LoadingState>Cargando tu práctica…</LoadingState>
  }

  if (placement === null) {
    return (
      <EmptyState
        title="No tienes una práctica activa todavía"
        description="Cuando la coordinación active tu plaza, vas a poder registrar horas."
      />
    )
  }

  if (logs === undefined) {
    return <LoadingState>Cargando registros de horas…</LoadingState>
  }

  return (
    <>
      <PageHeader
        title="Libro de horas"
        subtitle="Todo lo que registraste este período. Se guarda en este dispositivo aunque no haya señal."
        actions={<NewHourLogDialog placementId={placement.id} />}
      />

      <HoursProgressPanel hours={hours} note={submittedNote(hours)} />

      <Panel
        toolbar={
          <div className="flex w-full items-center justify-between">
            <span className="font-display text-14 font-semibold text-ink">
              Entradas del libro
            </span>
            <span className="inline-flex items-center rounded-full border border-line bg-soft px-2.5 py-0.5 font-data text-12 text-inkBody shadow-xs">
              {plural(logs.length, 'registro', 'registros')}
            </span>
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-2 border-b border-paperRule px-[18px] py-3">
          <FilterTabs
            label="Filtrar por estado"
            options={HOUR_LOG_STATUS_OPTIONS}
            value={status}
            onChange={(value) => setStatus(value as HourLogStatusFilter)}
          />
          <Input
            type="search"
            aria-label="Buscar registros"
            placeholder="Buscar por actividad o fecha"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="sm:ml-auto sm:max-w-xs"
          />
        </div>

        {logs.length > 0 && visibleLogs.length === 0 ? (
          <EmptyState
            title="Ningún registro coincide con los filtros"
            description="Prueba con otro estado o con otro texto de búsqueda."
          />
        ) : (
          <HourLogsList logs={paged.items} />
        )}

        {paged.total > 0 ? (
          <Pagination
            page={paged.page}
            totalPages={paged.totalPages}
            total={paged.total}
            from={paged.from}
            to={paged.to}
            pageSize={paged.pageSize}
            onPageChange={paged.setPage}
            onPageSizeChange={paged.setPageSize}
          />
        ) : null}
      </Panel>
    </>
  )
}
