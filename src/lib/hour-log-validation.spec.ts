import { describe, expect, it } from 'vitest'
import {
  HOUR_LOG_DAILY_HOURS_LIMIT,
  HOUR_LOG_DAILY_LIMIT_MESSAGE,
  sumHoursForDate,
  validateHourLogValues,
} from './hour-log-validation'

describe('hour-log validation', () => {
  it('keeps the configured daily limit at eight hours', () => {
    expect(HOUR_LOG_DAILY_HOURS_LIMIT).toBe(8)
  })

  it.each([
    [7.5, 0.5, null],
    [8, 0.5, HOUR_LOG_DAILY_LIMIT_MESSAGE],
    [0, 8, null],
    [0, 8.5, HOUR_LOG_DAILY_LIMIT_MESSAGE],
  ])('validates the daily boundary with %s prior hours and %s new hours', (alreadyRegisteredHours, hours, expected) => {
    expect(validateHourLogValues({ hours, startTime: '08:00', endTime: '16:00', alreadyRegisteredHours })).toBe(expected)
  })

  it('adds every activity for the same calendar date, including server ISO dates', () => {
    expect(
      sumHoursForDate(
        [
          { date: '2026-04-02', hours: 4 },
          { date: '2026-04-02T00:00:00.000Z', hours: 3.5 },
          { date: '2026-04-03', hours: 8 },
        ],
        '2026-04-02',
      ),
    ).toBe(7.5)
  })

  it('uses the same daily-limit message shown by the backend', () => {
    expect(HOUR_LOG_DAILY_LIMIT_MESSAGE).toBe('No puedes registrar más de 8 horas en un mismo día')
  })
})
