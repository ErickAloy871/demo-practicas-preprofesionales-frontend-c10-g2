import type { LocalHourLog, OutboxEntry } from '@/offline/db'
import type { HourLogFields } from './state'

export type CreateHourLogOperation = Omit<OutboxEntry, 'id' | 'clientOpId' | 'createdAt' | 'attempts' | 'lastError'>

export function buildLocalHourLog(fields: HourLogFields, placementId: number, now = new Date()): LocalHourLog {
  return {
    id: -now.getTime(),
    placementId,
    date: fields.date,
    startTime: fields.startTime,
    endTime: fields.endTime,
    hours: Number(fields.hours),
    activity: fields.activity.trim(),
    status: 'SUBMITTED',
    reviewNote: null,
    version: 1,
    updatedAt: now.toISOString(),
    syncState: 'local',
  }
}

export function buildCreateHourLogOperation(row: LocalHourLog): CreateHourLogOperation {
  return {
    entity: 'hourLog',
    op: 'create',
    payload: {
      id: row.id,
      placementId: row.placementId,
      date: row.date,
      startTime: row.startTime,
      endTime: row.endTime,
      hours: row.hours,
      activity: row.activity,
      status: row.status,
      reviewNote: row.reviewNote,
      version: row.version,
      updatedAt: row.updatedAt,
    },
    baseVersion: null,
  }
}
