import type { FilterOption } from '@/components/FilterTabs'

export type StudentStatusFilter = 'ALL' | 'PENDING' | 'UP_TO_DATE'

export const STUDENT_STATUS_OPTIONS: FilterOption[] = [
  { value: 'ALL', label: 'Todos' },
  { value: 'PENDING', label: 'Por revisar' },
  { value: 'UP_TO_DATE', label: 'Al día' },
]

interface FilterableStudent {
  placement: { studentId: number; companyId: number }
  submittedHours: number
}

function normalize(text: string): string {
  return text.replace(/#/g, '').trim().toLowerCase()
}

export function filterStudents<T extends FilterableStudent>(
  rows: readonly T[],
  status: StudentStatusFilter,
  query: string,
): T[] {
  const needle = normalize(query)

  return rows.filter((row) => {
    if (status === 'PENDING' && row.submittedHours <= 0) return false
    if (status === 'UP_TO_DATE' && row.submittedHours > 0) return false
    if (needle === '') return true
    return `estudiante ${row.placement.studentId} empresa ${row.placement.companyId}`.includes(needle)
  })
}
