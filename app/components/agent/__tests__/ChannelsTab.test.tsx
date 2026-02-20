import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChannelsTab } from '../ChannelsTab'

// Mock child components
jest.mock('../ChannelCard', () => ({
  ChannelCard: ({ channel, onToggle, onConfigure, onDisconnect }: any) => (
    <div data-testid={`channel-card-${channel.id}`}>
      <span>{channel.name}</span>
      <button onClick={() => onToggle(channel.id, !channel.isActive)}>Toggle</button>
      <button onClick={() => onConfigure(channel)}>Configure</button>
      <button onClick={() => onDisconnect(channel.id)}>Disconnect</button>
    </div>
  ),
}))

jest.mock('../AddChannelModal', () => ({
  AddChannelModal: ({ isOpen, onClose, onSave }: any) =>
    isOpen ? (
      <div data-testid="add-channel-modal">
        <button onClick={() => onSave({ type: 'slack', name: 'Test Channel', config: {} })}>
          Save
        </button>
        <button onClick={onClose}>Cancel</button>
      </div>
    ) : null,
}))

describe('ChannelsTab', () => {
  it('should show empty state when no channels connected', () => {
    render(<ChannelsTab agentId="agent-123" />)

    expect(screen.getByText(/no channels connected/i)).toBeInTheDocument()
    expect(screen.getByText(/connect your agent to communication channels/i)).toBeInTheDocument()
  })

  it('should show add channel button in empty state', () => {
    render(<ChannelsTab agentId="agent-123" />)

    expect(screen.getByRole('button', { name: /add channel/i })).toBeInTheDocument()
  })

  it('should open modal when add channel button is clicked', async () => {
    const user = userEvent.setup()
    render(<ChannelsTab agentId="agent-123" />)

    const addButton = screen.getByRole('button', { name: /add channel/i })
    await user.click(addButton)

    expect(screen.getByTestId('add-channel-modal')).toBeInTheDocument()
  })

  it('should add new channel when modal is saved', async () => {
    const user = userEvent.setup()
    render(<ChannelsTab agentId="agent-123" />)

    const addButton = screen.getByRole('button', { name: /add channel/i })
    await user.click(addButton)

    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)

    expect(screen.getByText('Test Channel')).toBeInTheDocument()
    expect(screen.queryByTestId('add-channel-modal')).not.toBeInTheDocument()
  })

  it('should display list of connected channels', async () => {
    const user = userEvent.setup()
    render(<ChannelsTab agentId="agent-123" />)

    // Add first channel
    await user.click(screen.getByRole('button', { name: /add channel/i }))
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(screen.getByTestId(/channel-card-/)).toBeInTheDocument()
    expect(screen.getByText(/connected channels/i)).toBeInTheDocument()
  })

  it('should toggle channel active state', async () => {
    const user = userEvent.setup()
    render(<ChannelsTab agentId="agent-123" />)

    // Add a channel first
    await user.click(screen.getByRole('button', { name: /add channel/i }))
    await user.click(screen.getByRole('button', { name: /save/i }))

    const toggleButton = screen.getByRole('button', { name: /toggle/i })
    await user.click(toggleButton)

    // Channel should still be present
    expect(screen.getByText('Test Channel')).toBeInTheDocument()
  })

  it('should open configure modal when configure is clicked', async () => {
    const user = userEvent.setup()
    render(<ChannelsTab agentId="agent-123" />)

    // Add a channel first
    await user.click(screen.getByRole('button', { name: /add channel/i }))
    await user.click(screen.getByRole('button', { name: /save/i }))

    const configureButton = screen.getAllByRole('button', { name: /configure/i })[0]
    await user.click(configureButton)

    expect(screen.getByTestId('add-channel-modal')).toBeInTheDocument()
  })

  it('should disconnect channel when disconnect is clicked', async () => {
    const user = userEvent.setup()
    render(<ChannelsTab agentId="agent-123" />)

    // Add a channel first
    await user.click(screen.getByRole('button', { name: /add channel/i }))
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(screen.getByText('Test Channel')).toBeInTheDocument()

    const disconnectButton = screen.getByRole('button', { name: /disconnect/i })
    await user.click(disconnectButton)

    expect(screen.queryByText('Test Channel')).not.toBeInTheDocument()
    expect(screen.getByText(/no channels connected/i)).toBeInTheDocument()
  })

  it('should close modal when cancel is clicked', async () => {
    const user = userEvent.setup()
    render(<ChannelsTab agentId="agent-123" />)

    await user.click(screen.getByRole('button', { name: /add channel/i }))
    expect(screen.getByTestId('add-channel-modal')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByTestId('add-channel-modal')).not.toBeInTheDocument()
  })

  it('should display multiple channels', async () => {
    const user = userEvent.setup()
    render(<ChannelsTab agentId="agent-123" />)

    // Add first channel
    await user.click(screen.getByRole('button', { name: /add channel/i }))
    await user.click(screen.getByRole('button', { name: /save/i }))

    // Add second channel
    await user.click(screen.getAllByRole('button', { name: /add channel/i })[0])
    await user.click(screen.getByRole('button', { name: /save/i }))

    const channels = screen.getAllByTestId(/channel-card-/)
    expect(channels.length).toBe(2)
  })
})
