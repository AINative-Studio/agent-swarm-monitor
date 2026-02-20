import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddChannelModal } from '../AddChannelModal'
import type { Channel } from '../ChannelsTab'

describe('AddChannelModal', () => {
  const mockOnSave = jest.fn()
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should not render when closed', () => {
    render(
      <AddChannelModal
        isOpen={false}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should render when open', () => {
    render(
      <AddChannelModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/add channel/i)).toBeInTheDocument()
  })

  it('should show channel type selection', () => {
    render(
      <AddChannelModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    )

    expect(screen.getByLabelText(/channel type/i)).toBeInTheDocument()
  })

  it('should display configuration form for Slack', async () => {
    const user = userEvent.setup()
    render(
      <AddChannelModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    )

    const typeSelect = screen.getByLabelText(/channel type/i)
    await user.selectOptions(typeSelect, 'slack')

    expect(screen.getByLabelText(/channel name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/workspace url/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/bot token/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/channel id/i)).toBeInTheDocument()
  })

  it('should call onSave with channel data when form is submitted', async () => {
    const user = userEvent.setup()
    render(
      <AddChannelModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    )

    const typeSelect = screen.getByLabelText(/channel type/i)
    await user.selectOptions(typeSelect, 'slack')

    await user.type(screen.getByLabelText(/channel name/i), 'Engineering')
    await user.type(screen.getByLabelText(/workspace url/i), 'engineering.slack.com')
    await user.type(screen.getByLabelText(/bot token/i), 'xoxb-123456')
    await user.type(screen.getByLabelText(/channel id/i), 'C12345')

    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'slack',
        name: 'Engineering',
        config: expect.objectContaining({
          workspaceUrl: 'engineering.slack.com',
          botToken: 'xoxb-123456',
          channelId: 'C12345'
        })
      })
    )
  })

  it('should call onClose when cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <AddChannelModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    )

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should disable save button when form is invalid', () => {
    render(
      <AddChannelModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    )

    const saveButton = screen.getByRole('button', { name: /save/i })
    expect(saveButton).toBeDisabled()
  })

  it('should enable save button when form is valid', async () => {
    const user = userEvent.setup()
    render(
      <AddChannelModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    )

    const typeSelect = screen.getByLabelText(/channel type/i)
    await user.selectOptions(typeSelect, 'discord')

    await user.type(screen.getByLabelText(/channel name/i), 'Gaming')
    await user.type(screen.getByLabelText(/server id/i), 'S12345')
    await user.type(screen.getByLabelText(/bot token/i), 'token123')
    await user.type(screen.getByLabelText(/channel id/i), 'C67890')

    const saveButton = screen.getByRole('button', { name: /save/i })
    expect(saveButton).not.toBeDisabled()
  })

  it('should pre-fill form when editing existing channel', () => {
    const editingChannel: Channel = {
      id: 'ch-123',
      type: 'slack',
      name: 'Engineering',
      isActive: true,
      config: {
        workspaceUrl: 'engineering.slack.com',
        botToken: 'xoxb-123456',
        channelId: 'C12345'
      }
    }

    render(
      <AddChannelModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        editingChannel={editingChannel}
      />
    )

    expect(screen.getByDisplayValue('Engineering')).toBeInTheDocument()
    expect(screen.getByDisplayValue('engineering.slack.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('xoxb-123456')).toBeInTheDocument()
    expect(screen.getByDisplayValue('C12345')).toBeInTheDocument()
  })

  it('should show different title when editing', () => {
    const editingChannel: Channel = {
      id: 'ch-123',
      type: 'slack',
      name: 'Engineering',
      isActive: true,
      config: {}
    }

    render(
      <AddChannelModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        editingChannel={editingChannel}
      />
    )

    expect(screen.getByText(/configure channel/i)).toBeInTheDocument()
  })
})
