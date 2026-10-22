import { describe, expect, it } from 'vitest'
import { paginate } from './pagination'

const items = Array.from({ length: 25 }, (_, index) => index + 1)

describe('paginate', () => {
  it('returns the first page with its range', () => {
    const result = paginate(items, 1, 10)

    expect(result.items).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(result).toMatchObject({ page: 1, totalPages: 3, total: 25, from: 1, to: 10 })
  })

  it('returns a middle page', () => {
    const result = paginate(items, 2, 10)

    expect(result.items[0]).toBe(11)
    expect(result).toMatchObject({ page: 2, from: 11, to: 20 })
  })

  it('returns the last page with fewer items', () => {
    const result = paginate(items, 3, 10)

    expect(result.items).toEqual([21, 22, 23, 24, 25])
    expect(result).toMatchObject({ page: 3, from: 21, to: 25 })
  })

  it('clamps a page past the end to the last page', () => {
    expect(paginate(items, 9, 10).page).toBe(3)
  })

  it('clamps a page before the start to the first page', () => {
    expect(paginate(items, 0, 10).page).toBe(1)
    expect(paginate(items, -4, 10).page).toBe(1)
  })

  it('keeps one page and a 0 range when the list is empty', () => {
    const result = paginate([], 1, 10)

    expect(result.items).toEqual([])
    expect(result).toMatchObject({ page: 1, totalPages: 1, total: 0, from: 0, to: 0 })
  })

  it('uses the page size to split the list', () => {
    expect(paginate(items, 1, 50).totalPages).toBe(1)
    expect(paginate(items, 1, 20).totalPages).toBe(2)
  })
})
