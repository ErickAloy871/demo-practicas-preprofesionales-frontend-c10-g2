import { describe, expect, it } from 'vitest'
import type { LocalHourLog } from '@/offline/db'
import { formatDate } from './date'
import { filterHourLogs } from './hourLogFilters'

function log(overrides: Partial<LocalHourLog>): LocalHourLog {
  return {
    id: 1,
    placementId: 1,
    date: '2026-04-01',
    startTime: '08:00',
    endTime: '12:00',
    hours: 4,
    activity: 'Soporte técnico',
    status: 'DRAFT',
    reviewNote: null,
    version: 1,
    updatedAt: '2026-04-01T00:00:00.000Z',
    syncState: 'synced',
    ...overrides,
  }
}

const logs = [
  log({ id: 1, status: 'DRAFT', activity: 'Soporte técnico', date: '2026-04-01' }),
  log({ id: 2, status: 'SUBMITTED', activity: 'Reunión con el tutor', date: '2026-04-02' }),
  log({ id: 3, status: 'APPROVED', activity: 'Desarrollo de módulo', date: '2026-05-10' }),
  log({ id: 4, status: 'REJECTED', activity: 'Documentación', date: '2026-05-11' }),
]

const ids = (list: LocalHourLog[]) => list.map((entry) => entry.id)

describe('filterHourLogs', () => {
  it('returns every log with the ALL status and no query', () => {
    expect(ids(filterHourLogs(logs, 'ALL', ''))).toEqual([1, 2, 3, 4])
  })

  it.each([
    ['DRAFT', [1]],
    ['SUBMITTED', [2]],
    ['APPROVED', [3]],
    ['REJECTED', [4]],
  ] as const)('keeps only the %s logs', (status, expected) => {
    expect(ids(filterHourLogs(logs, status, ''))).toEqual(expected)
  })

  it('searches the activity ignoring case and accents', () => {
    expect(ids(filterHourLogs(logs, 'ALL', 'TECNICO'))).toEqual([1])
    expect(ids(filterHourLogs(logs, 'ALL', 'documentacion'))).toEqual([4])
  })

  it('searches the ISO date', () => {
    expect(ids(filterHourLogs(logs, 'ALL', '2026-05'))).toEqual([3, 4])
  })

  it('searches the date as it is displayed', () => {
    expect(ids(filterHourLogs(logs, 'ALL', formatDate('2026-04-02')))).toEqual([2])
  })

  it('ignores spaces around the query', () => {
    expect(ids(filterHourLogs(logs, 'ALL', '  tutor  '))).toEqual([2])
  })

  it('combines the status with the query', () => {
    expect(ids(filterHourLogs(logs, 'APPROVED', 'documentacion'))).toEqual([])
    expect(ids(filterHourLogs(logs, 'REJECTED', 'documentacion'))).toEqual([4])
  })

  it('returns an empty list when nothing matches', () => {
    expect(filterHourLogs(logs, 'ALL', 'zzz')).toEqual([])
  })
})
