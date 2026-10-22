import { describe, expect, it } from 'vitest'
import { filterStudents } from './studentFilters'

const rows = [
  { placement: { studentId: 5, companyId: 1 }, submittedHours: 4 },
  { placement: { studentId: 12, companyId: 3 }, submittedHours: 0 },
  { placement: { studentId: 7, companyId: 12 }, submittedHours: 2.5 },
]

const students = (list: typeof rows) => list.map((row) => row.placement.studentId)

describe('filterStudents', () => {
  it('returns everyone with the ALL status and no query', () => {
    expect(students(filterStudents(rows, 'ALL', ''))).toEqual([5, 12, 7])
  })

  it('keeps only the students with hours waiting for review', () => {
    expect(students(filterStudents(rows, 'PENDING', ''))).toEqual([5, 7])
  })

  it('keeps only the students that are up to date', () => {
    expect(students(filterStudents(rows, 'UP_TO_DATE', ''))).toEqual([12])
  })

  it('searches by student id or company id', () => {
    expect(students(filterStudents(rows, 'ALL', '12'))).toEqual([12, 7])
    expect(students(filterStudents(rows, 'ALL', 'estudiante 5'))).toEqual([5])
  })

  it('ignores the hash sign, case and spaces around the query', () => {
    expect(students(filterStudents(rows, 'ALL', '  Estudiante #7 '))).toEqual([7])
  })

  it('combines the status with the query', () => {
    expect(students(filterStudents(rows, 'PENDING', '12'))).toEqual([7])
    expect(students(filterStudents(rows, 'UP_TO_DATE', 'empresa 1'))).toEqual([])
  })
})
