import { render, screen } from '@testing-library/react'

import type { CostEstimate } from '../../lib/router/types'

import { CostBadge } from '../../components/CostBadge'

const mockCost: CostEstimate = {
  inputTokens: 100,
  largeModelCostUsd: 0.002_25,
  outputTokens: 50,
  savingsPct: 93,
  specialistCostUsd: 0.000_15,
}

describe('CostBadge', () => {
  it('is hidden when no cost', () => {
    const { container } = render(<CostBadge cost={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders specialist cost', () => {
    render(<CostBadge cost={mockCost} />)
    expect(screen.getByText(/Specialist:/)).toBeDefined()
  })

  it('renders large model cost', () => {
    render(<CostBadge cost={mockCost} />)
    expect(screen.getByText(/Large model:/)).toBeDefined()
  })

  it('renders savings percentage', () => {
    render(<CostBadge cost={mockCost} />)
    expect(screen.getByText('93% cheaper')).toBeDefined()
  })

  it("always shows 'estimated' label", () => {
    render(<CostBadge cost={mockCost} />)
    expect(screen.getByText(/estimated/i)).toBeDefined()
  })
})
