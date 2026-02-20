import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChannelCard } from '../ChannelCard'
import type { Channel } from '../ChannelsTab'

describe('ChannelCard', () => {
  const mockChannel: Channel = {
    id: 'channel-123',
    type: 'slack',
    name: 'Engineering Team',
    isActive: true,
    config: {
      workspaceUrl: 'engineering.slack.com',
      channelId: 'C12345'
    }
  }

  const mockOnToggle = jest.fn()
  const mockOnConfigure = jest.fn()
  const mockOnDisconnect = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render channel information', () => {
    render(
      <ChannelCard
        channel={mockChannel}
        onToggle={mockOnToggle}
        onConfigure={mockOnConfigure}
        onDisconnect={mockOnDisconnect}
      />
    )

    expect(screen.getByText('Engineering Team')).toBeInTheDocument()
    expect(screen.getByText(/slack/i)).toBeInTheDocument()
  })

  it('should display active status badge when channel is active', () => {
    render(
      <ChannelCard
        channel={mockChannel}
        onToggle={mockOnToggle}
        onConfigure={mockOnConfigure}
        onDisconnect={mockOnDisconnect}
      />
    )

    expect(screen.getByText(/active/i)).toBeInTheDocument()
  })

  it('should display inactive status when channel is not active', () => {
    const inactiveChannel = { ...mockChannel, isActive: false }
    render(
      <ChannelCard
        channel={inactiveChannel}
        onToggle={mockOnToggle}
        onConfigure={mockOnConfigure}
        onDisconnect={mockOnDisconnect}
      />
    )

    expect(screen.getByText(/inactive/i)).toBeInTheDocument()
  })

  it('should call onToggle when toggle is clicked', async () => {
    const user = userEvent.setup()
    render(
      <ChannelCard
        channel={mockChannel}
        onToggle={mockOnToggle}
        onConfigure={mockOnConfigure}
        onDisconnect={mockOnDisconnect}
      />
    )

    const toggle = screen.getByRole('switch')
    await user.click(toggle)

    expect(mockOnToggle).toHaveBeenCalledWith(mockChannel.id, false)
  })

  it('should call onConfigure when configure button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <ChannelCard
        channel={mockChannel}
        onToggle={mockOnToggle}
        onConfigure={mockOnConfigure}
        onDisconnect={mockOnDisconnect}
      />
    )

    const configureButton = screen.getByRole('button', { name: /configure/i })
    await user.click(configureButton)

    expect(mockOnConfigure).toHaveBeenCalledWith(mockChannel)
  })

  it('should call onDisconnect when disconnect button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <ChannelCard
        channel={mockChannel}
        onToggle={mockOnToggle}
        onConfigure={mockOnConfigure}
        onDisconnect={mockOnDisconnect}
      />
    )

    const disconnectButton = screen.getByRole('button', { name: /disconnect/i })
    await user.click(disconnectButton)

    expect(mockOnDisconnect).toHaveBeenCalledWith(mockChannel.id)
  })

  it('should display channel icon for each type', () => {
    const types: Array<Channel['type']> = ['slack', 'discord', 'whatsapp', 'teams', 'telegram']

    types.forEach(type => {
      const channel = { ...mockChannel, type }
      const { container } = render(
        <ChannelCard
          channel={channel}
          onToggle={mockOnToggle}
          onConfigure={mockOnConfigure}
          onDisconnect={mockOnDisconnect}
        />
      )

      expect(container.querySelector('[data-icon]')).toBeInTheDocument()
    })
  })

  it('should be accessible', () => {
    render(
      <ChannelCard
        channel={mockChannel}
        onToggle={mockOnToggle}
        onConfigure={mockOnConfigure}
        onDisconnect={mockOnDisconnect}
      />
    )

    const toggle = screen.getByRole('switch')
    expect(toggle).toHaveAccessibleName()

    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button).toHaveAccessibleName()
    })
  })

  it('should show last message timestamp if provided', () => {
    const channelWithTimestamp = {
      ...mockChannel,
      lastMessageAt: new Date('2025-01-15T10:00:00Z')
    }

    render(
      <ChannelCard
        channel={channelWithTimestamp}
        onToggle={mockOnToggle}
        onConfigure={mockOnConfigure}
        onDisconnect={mockOnDisconnect}
      />
    )

    expect(screen.getByText(/last message:/i)).toBeInTheDocument()
  })
})
