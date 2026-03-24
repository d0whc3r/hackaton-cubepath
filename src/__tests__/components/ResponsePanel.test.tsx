import { fireEvent, render, screen } from '@testing-library/react'
import { ResponsePanel } from '../../components/ResponsePanel'

describe('ResponsePanel', () => {
  it('shows placeholder when empty', () => {
    render(<ResponsePanel responseText="" specialistDisplayName={null} error={null} interrupted={false} />)
    expect(screen.getByText(/response will appear here/i)).toBeDefined()
  })

  it('renders streamed text', () => {
    render(
      <ResponsePanel
        responseText="This function adds two numbers."
        specialistDisplayName={null}
        error={null}
        interrupted={false}
      />,
    )
    expect(screen.getByText('This function adds two numbers.')).toBeDefined()
  })

  it('shows specialist displayName in header', () => {
    render(
      <ResponsePanel
        responseText="some response"
        specialistDisplayName="Explanation Specialist"
        error={null}
        interrupted={false}
      />,
    )
    expect(screen.getByText(/Explanation Specialist/)).toBeDefined()
  })

  it('shows error message when error prop set', () => {
    render(
      <ResponsePanel
        responseText=""
        specialistDisplayName={null}
        error="The specialist model is temporarily unavailable."
        interrupted={false}
      />,
    )
    expect(screen.getByText('The specialist model is temporarily unavailable.')).toBeDefined()
  })

  it('shows interrupted notice when interrupted prop set', () => {
    render(<ResponsePanel responseText="partial output" specialistDisplayName={null} error={null} interrupted />)
    expect(screen.getByText(/interrupted; partial output below/i)).toBeDefined()
  })

  it('copy button copies response text only', () => {
    const writeText = vi.fn().mockResolvedValue()
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
      writable: true,
    })

    render(
      <ResponsePanel
        responseText="function add(a, b) { return a + b; }"
        specialistDisplayName="Explanation Specialist"
        error={null}
        interrupted={false}
      />,
    )

    fireEvent.click(screen.getByText('Copy'))
    expect(writeText).toHaveBeenCalledWith('function add(a, b) { return a + b; }')
  })

  it('copy button is not shown when response is empty', () => {
    render(<ResponsePanel responseText="" specialistDisplayName={null} error={null} interrupted={false} />)
    expect(screen.queryByText('Copy')).toBeNull()
  })
})
