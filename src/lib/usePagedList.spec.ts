import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { usePagedList } from './usePagedList'

const items = Array.from({ length: 25 }, (_, index) => index + 1)

describe('usePagedList', () => {
  it('starts on the first page with 10 per page', () => {
    const { result } = renderHook(() => usePagedList(items, 'a'))

    expect(result.current.page).toBe(1)
    expect(result.current.pageSize).toBe(10)
    expect(result.current.items).toHaveLength(10)
  })

  it('moves to another page', () => {
    const { result } = renderHook(() => usePagedList(items, 'a'))

    act(() => result.current.setPage(3))

    expect(result.current.page).toBe(3)
    expect(result.current.items).toEqual([21, 22, 23, 24, 25])
  })

  it('goes back to the first page when the page size changes', () => {
    const { result } = renderHook(() => usePagedList(items, 'a'))

    act(() => result.current.setPage(3))
    act(() => result.current.setPageSize(20))

    expect(result.current.page).toBe(1)
    expect(result.current.pageSize).toBe(20)
    expect(result.current.items).toHaveLength(20)
  })

  it('goes back to the first page when the reset key changes', () => {
    const { result, rerender } = renderHook(({ key }) => usePagedList(items, key), {
      initialProps: { key: 'a' },
    })

    act(() => result.current.setPage(2))
    rerender({ key: 'b' })

    expect(result.current.page).toBe(1)
  })

  it('keeps the page while the reset key stays the same', () => {
    const { result, rerender } = renderHook(({ key }) => usePagedList(items, key), {
      initialProps: { key: 'a' },
    })

    act(() => result.current.setPage(2))
    rerender({ key: 'a' })

    expect(result.current.page).toBe(2)
  })

  it('clamps the page when the list shrinks', () => {
    const { result, rerender } = renderHook(({ list }) => usePagedList(list, 'a'), {
      initialProps: { list: items },
    })

    act(() => result.current.setPage(3))
    rerender({ list: items.slice(0, 12) })

    expect(result.current.page).toBe(2)
  })
})
