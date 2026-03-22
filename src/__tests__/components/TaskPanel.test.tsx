import { fireEvent, render, screen } from '@testing-library/react'

import { TaskPanel } from '../../components/TaskPanel'

describe('TaskPanel', () => {
  it('renders 4 task type buttons', () => {
    render(<TaskPanel isLoading={false} onSubmit={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByText('Explain')).toBeDefined()
    expect(screen.getByText('Generate Tests')).toBeDefined()
    expect(screen.getByText('Refactor')).toBeDefined()
    expect(screen.getByText('Write Commit')).toBeDefined()
  })

  it('submit calls onSubmit with correct args', () => {
    const onSubmit = vi.fn()
    render(<TaskPanel isLoading={false} onSubmit={onSubmit} onCancel={vi.fn()} />)
    const textarea = screen.getByPlaceholderText(/paste your code/i)
    fireEvent.change(textarea, { target: { value: 'function add(a, b) { return a + b; }' } })
    fireEvent.click(screen.getByText('Submit'))
    expect(onSubmit).toHaveBeenCalledWith('function add(a, b) { return a + b; }', 'explain')
  })

  it('submit is disabled when isLoading=true', () => {
    render(<TaskPanel isLoading onSubmit={vi.fn()} onCancel={vi.fn()} initialInput="some code" />)
    const submit = screen.getByText('Processing...') as HTMLButtonElement
    expect(submit.disabled).toBeTruthy()
  })

  it('submit is disabled when textarea is empty', () => {
    render(<TaskPanel isLoading={false} onSubmit={vi.fn()} onCancel={vi.fn()} />)
    const submit = screen.getByText('Submit') as HTMLButtonElement
    expect(submit.disabled).toBeTruthy()
  })

  it('cancel button is visible when isLoading=true', () => {
    render(<TaskPanel isLoading onSubmit={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByText('Cancel')).toBeDefined()
  })

  it('cancel button is not visible when isLoading=false', () => {
    render(<TaskPanel isLoading={false} onSubmit={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.queryByText('Cancel')).toBeNull()
  })

  it('cancel calls onCancel', () => {
    const onCancel = vi.fn()
    render(<TaskPanel isLoading onSubmit={vi.fn()} onCancel={onCancel} />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(onCancel).toHaveBeenCalled()
  })

  it('changes task type when clicking a task button', () => {
    const onSubmit = vi.fn()
    render(<TaskPanel isLoading={false} onSubmit={onSubmit} onCancel={vi.fn()} initialInput="code" />)
    fireEvent.click(screen.getByText('Refactor'))
    fireEvent.click(screen.getByText('Submit'))
    expect(onSubmit).toHaveBeenCalledWith('code', 'refactor')
  })
})
