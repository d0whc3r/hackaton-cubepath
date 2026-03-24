import { render, screen } from '@testing-library/react'
import type { RoutingStep } from '../../lib/router/types'
import { RoutingPanel } from '../../components/RoutingPanel'

describe('RoutingPanel', () => {
  it('renders nothing when no steps and no specialist', () => {
    const { container } = render(<RoutingPanel steps={[]} specialist={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders step labels from the step map', () => {
    const steps: RoutingStep[] = [{ label: 'Detecting language...', status: 'active', step: 'detecting_language' }]
    render(<RoutingPanel steps={steps} specialist={null} />)
    expect(screen.getByText('Detecting language...')).toBeDefined()
  })

  it('active step shows a spinner element', () => {
    const steps: RoutingStep[] = [{ label: 'Detecting language...', status: 'active', step: 'detecting_language' }]
    const { container } = render(<RoutingPanel steps={steps} specialist={null} />)
    expect(container.querySelector('.animate-spin')).toBeDefined()
  })

  it('done step shows checkmark', () => {
    const steps: RoutingStep[] = [{ label: 'TypeScript detected', status: 'done', step: 'detecting_language' }]
    render(<RoutingPanel steps={steps} specialist={null} />)
    expect(screen.getByText('✓')).toBeDefined()
  })

  it('error step shows error indicator', () => {
    const steps: RoutingStep[] = [{ label: 'Detection failed', status: 'error', step: 'detecting_language' }]
    render(<RoutingPanel steps={steps} specialist={null} />)
    expect(screen.getByText('✗')).toBeDefined()
  })

  it('specialist badge appears when specialist is set', () => {
    const steps: RoutingStep[] = [{ label: 'Specialist selected', status: 'done', step: 'selecting_specialist' }]
    const specialist = { displayName: 'Explanation Specialist', language: 'TypeScript' }
    render(<RoutingPanel steps={steps} specialist={specialist} />)
    expect(screen.getByText('Explanation Specialist')).toBeDefined()
    expect(screen.getByText('TypeScript')).toBeDefined()
  })

  it('no specialist badge when specialist is null', () => {
    const steps: RoutingStep[] = [{ label: 'Selecting...', status: 'active', step: 'selecting_specialist' }]
    render(<RoutingPanel steps={steps} specialist={null} />)
    expect(screen.queryByText('Explanation Specialist')).toBeNull()
  })
})
