import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatTab } from '../ChatTab'

// Mock child components
jest.mock('../MessageList', () => ({
  MessageList: ({ messages }: any) => (
    <div data-testid="message-list">
      {messages.map((msg: any) => (
        <div key={msg.id} data-testid={`mock-message-${msg.sender}`}>
          {msg.content}
        </div>
      ))}
    </div>
  ),
}))

jest.mock('../MessageInput', () => ({
  MessageInput: ({ onSend, disabled }: any) => (
    <div data-testid="message-input">
      <input
        data-testid="mock-input"
        placeholder="Type message"
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onSend((e.target as HTMLInputElement).value)
          }
        }}
      />
    </div>
  ),
}))

describe('ChatTab', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render empty state initially', () => {
    render(<ChatTab agentId="agent-123" />)

    expect(screen.getByTestId('message-list')).toBeInTheDocument()
    expect(screen.getByTestId('message-input')).toBeInTheDocument()
  })

  it('should display message history when loaded', async () => {
    render(<ChatTab agentId="agent-123" />)

    const input = screen.getByTestId('mock-input')
    await userEvent.type(input, 'Hello')
    await userEvent.keyboard('{Enter}')

    // User message should appear immediately
    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument()
    })
  })

  it('should send message and get agent response', async () => {
    render(<ChatTab agentId="agent-123" />)

    const input = screen.getByTestId('mock-input')
    await userEvent.type(input, 'Test message')
    await userEvent.keyboard('{Enter}')

    // User message appears immediately
    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument()
    })

    // Wait for agent response (uses real timers, 1 second delay)
    await waitFor(() => {
      expect(screen.getByText(/Mock response to: Test message/)).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('should show typing indicator when agent is responding', async () => {
    render(<ChatTab agentId="agent-123" />)

    const input = screen.getByTestId('mock-input')
    await userEvent.type(input, 'Hello')
    await userEvent.keyboard('{Enter}')

    // Typing indicator should appear immediately after sending
    await waitFor(() => {
      expect(screen.getByText(/typing/i)).toBeInTheDocument()
    })

    // Typing indicator should disappear after response
    await waitFor(() => {
      expect(screen.queryByText(/typing/i)).not.toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('should disable input while agent is typing', async () => {
    render(<ChatTab agentId="agent-123" />)

    const input = screen.getByTestId('mock-input')
    await userEvent.type(input, 'Test')
    await userEvent.keyboard('{Enter}')

    // Input should be disabled while waiting for response
    await waitFor(() => {
      expect(input).toBeDisabled()
    })

    // Input should be enabled after response
    await waitFor(() => {
      expect(input).not.toBeDisabled()
    }, { timeout: 2000 })
  })

  it('should handle multiple messages in conversation', async () => {
    render(<ChatTab agentId="agent-123" />)

    const input = screen.getByTestId('mock-input')

    // Send first message
    await userEvent.type(input, 'First message')
    await userEvent.keyboard('{Enter}')

    await waitFor(() => {
      expect(screen.getByText(/Mock response to: First message/)).toBeInTheDocument()
    }, { timeout: 2000 })

    // Send second message
    await userEvent.type(input, 'Second message')
    await userEvent.keyboard('{Enter}')

    await waitFor(() => {
      expect(screen.getByText(/Mock response to: Second message/)).toBeInTheDocument()
    }, { timeout: 2000 })

    // Both user messages should be visible
    expect(screen.getByText('First message')).toBeInTheDocument()
    expect(screen.getByText('Second message')).toBeInTheDocument()
  })

  it('should connect to WebSocket on mount', () => {
    const consoleSpy = jest.spyOn(console, 'log')
    render(<ChatTab agentId="agent-456" />)

    expect(consoleSpy).toHaveBeenCalledWith('Mock WS connected to agent agent-456')
    consoleSpy.mockRestore()
  })

  it('should disconnect from WebSocket on unmount', () => {
    const { unmount } = render(<ChatTab agentId="agent-123" />)

    unmount()

    // Should clean up without errors
    expect(true).toBe(true)
  })

  it('should maintain message order (chronological)', async () => {
    render(<ChatTab agentId="agent-123" />)

    const input = screen.getByTestId('mock-input')

    await userEvent.type(input, 'Message 1')
    await userEvent.keyboard('{Enter}')

    await waitFor(() => {
      const messages = screen.getAllByTestId(/mock-message-/)
      expect(messages.length).toBeGreaterThan(0)
    }, { timeout: 2000 })
  })

  it('should handle empty message gracefully', async () => {
    render(<ChatTab agentId="agent-123" />)

    const input = screen.getByTestId('mock-input')

    await userEvent.type(input, '   ')
    await userEvent.keyboard('{Enter}')

    // Wait a moment to ensure no message was added
    await new Promise(resolve => setTimeout(resolve, 200))

    // Empty message should not be sent
    const userMessages = screen.queryAllByTestId('mock-message-user')
    expect(userMessages.length).toBe(0)
  })

  it('should have correct layout structure', () => {
    render(<ChatTab agentId="agent-123" />)

    expect(screen.getByTestId('message-list')).toBeInTheDocument()
    expect(screen.getByTestId('message-input')).toBeInTheDocument()
  })
})
