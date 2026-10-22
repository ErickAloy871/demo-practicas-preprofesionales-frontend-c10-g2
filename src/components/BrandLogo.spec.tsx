import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BrandLogo } from './BrandLogo'

describe('BrandLogo', () => {
  it('renderiza el isotipo SVG con atributos accesibles', () => {
    const { container } = render(<BrandLogo />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveAttribute('viewBox', '0 0 64 64')
  })

  it('aplica las clases de tamaño sm por defecto y clases personalizadas', () => {
    const { container } = render(<BrandLogo size="sm" className="custom-test-logo" />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveClass('size-[26px]')
    expect(svg).toHaveClass('custom-test-logo')
  })

  it('aplica los tamaños md y lg correctamente', () => {
    const { container: cMd } = render(<BrandLogo size="md" />)
    expect(cMd.querySelector('svg')).toHaveClass('size-8')

    const { container: cLg } = render(<BrandLogo size="lg" />)
    expect(cLg.querySelector('svg')).toHaveClass('size-10')
  })
})
