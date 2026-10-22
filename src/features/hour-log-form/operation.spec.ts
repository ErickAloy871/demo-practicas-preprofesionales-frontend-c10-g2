// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { buildCreateHourLogOperation, buildLocalHourLog } from './operation'

describe('construcción del registro y de la operación sin interfaz', () => {
  it('conserva el contrato del outbox y omite los metadatos locales del payload', () => {
    const now = new Date('2026-04-02T15:00:00.000Z')
    const row = buildLocalHourLog({
      date: '2026-04-02', startTime: '08:00', endTime: '12:00', hours: '3.5', activity: '  Soporte  ',
    }, 7, now)

    expect(row).toEqual({
      id: -now.getTime(), placementId: 7, date: '2026-04-02',
      startTime: '08:00', endTime: '12:00', hours: 3.5, activity: 'Soporte',
      status: 'SUBMITTED', reviewNote: null, version: 1,
      updatedAt: '2026-04-02T15:00:00.000Z', syncState: 'local',
    })
    expect(buildCreateHourLogOperation(row)).toEqual({
      entity: 'hourLog', op: 'create', baseVersion: null,
      payload: {
        id: row.id, placementId: 7, date: '2026-04-02',
        startTime: '08:00', endTime: '12:00', hours: 3.5, activity: 'Soporte',
        status: 'SUBMITTED', reviewNote: null, version: 1, updatedAt: '2026-04-02T15:00:00.000Z',
      },
    })
  })
})
