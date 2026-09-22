import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LedgerRow } from './LedgerRow'

describe('LedgerRow', () => {
  it('shows the rejection reason when the sync failed', () => {
    render(
      <LedgerRow syncState="failed" note="el tutor ya revisó esta hora; tu edición no se aplicó">
        <span>fila</span>
      </LedgerRow>,
    )

    expect(screen.getByText('el tutor ya revisó esta hora; tu edición no se aplicó')).toBeInTheDocument()
  })

  it('does not show a note when the row is not failed', () => {
    render(
      <LedgerRow syncState="synced" note="algún motivo">
        <span>fila</span>
      </LedgerRow>,
    )

    expect(screen.queryByText('algún motivo')).not.toBeInTheDocument()
  })
})
