import { fireEvent, render, screen } from '@testing-library/react'

import type { HistoryItem } from '../../components/HistoryPanel'

import { HistoryPanel } from '../../components/HistoryPanel'

function makeItems(count: number): HistoryItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `item-${i}`,
    input: `function code_${i}() {}`,
    taskType: 'explain' as const,
  }))
}

describe('HistoryPanel', () => {
  it('is hidden when history is empty', () => {
    const { container } = render(<HistoryPanel history={[]} onReuse={vi.fn()} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders up to 10 items by default', () => {
    render(<HistoryPanel history={makeItems(15)} onReuse={vi.fn()} />)
    const items = screen.getAllByText(/function code_\d+/)
    expect(items.length).toBe(10)
  })

  it('Load more button appears when history > 10 items', () => {
    render(<HistoryPanel history={makeItems(15)} onReuse={vi.fn()} />)
    expect(screen.getByText(/load more/i)).toBeDefined()
  })

  it('Load more button is not shown when history <= 10 items', () => {
    render(<HistoryPanel history={makeItems(5)} onReuse={vi.fn()} />)
    expect(screen.queryByText(/load more/i)).toBeNull()
  })

  it('Load more shows remaining items', () => {
    render(<HistoryPanel history={makeItems(15)} onReuse={vi.fn()} />)
    fireEvent.click(screen.getByText(/load more/i))
    const items = screen.getAllByText(/function code_\d+/)
    expect(items.length).toBe(15)
  })

  it('re-use button calls onReuse with correct input and taskType', () => {
    const onReuse = vi.fn()
    const history: HistoryItem[] = [{ id: '1', input: 'function myCode() {}', taskType: 'refactor' }]
    render(<HistoryPanel history={history} onReuse={onReuse} />)
    fireEvent.click(screen.getByText('Re-use'))
    expect(onReuse).toHaveBeenCalledWith('function myCode() {}', 'refactor')
  })
})
