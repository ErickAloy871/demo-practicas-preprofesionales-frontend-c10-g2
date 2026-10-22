import { Chip, type ChipTone } from '@/components/Chip'

const STATUS_TONE: Record<string, ChipTone> = {
  APPROVED: 'stamp',
  ACCEPTED: 'stamp',
  ACTIVE: 'stamp',
  VALIDATED: 'stamp',
  PUBLISHED: 'stamp',
  ACREDITADO: 'stamp',
  SUBMITTED: 'pending',
  PENDING: 'pending',
  PENDING_DOCS: 'pending',
  INTERVIEW: 'pending',
  DRAFT: 'pending',
  PENDIENTE: 'pending',
  ACREDITADO_CON_OBSERVACIONES: 'pending',
  REJECTED: 'void',
  ABANDONED: 'void',
  SUSPENDED: 'void',
  CLOSED: 'void',
  WITHDRAWN: 'void',
  NO_ACREDITADO: 'void',
}

export const STATUS_LABELS: Record<string, string> = {
  APPROVED: 'Aprobado',
  ACCEPTED: 'Aceptada',
  ACTIVE: 'Activa',
  VALIDATED: 'Validado',
  PUBLISHED: 'Publicada',
  ACREDITADO: 'Acreditado',
  SUBMITTED: 'Por revisar',
  PENDING: 'Pendiente',
  PENDING_DOCS: 'Docs pendientes',
  INTERVIEW: 'En entrevista',
  DRAFT: 'Borrador',
  PENDIENTE: 'Pendiente',
  ACREDITADO_CON_OBSERVACIONES: 'Con observaciones',
  REJECTED: 'Rechazado',
  ABANDONED: 'Abandonada',
  SUSPENDED: 'Suspendida',
  CLOSED: 'Cerrada',
  WITHDRAWN: 'Retirada',
  NO_ACREDITADO: 'No acreditado',
}

export function StatusBadge({ status }: { status: string }) {
  const label = STATUS_LABELS[status] ?? status
  return (
    <Chip tone={STATUS_TONE[status] ?? 'neutral'} data-status={status}>
      {label}
    </Chip>
  )
}
