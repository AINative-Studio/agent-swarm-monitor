import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TokenConnectionModal from '@/components/openclaw/TokenConnectionModal';

// Issue #132: the /channels Connect flow (Telegram/Discord/Slack) previously
// accepted any non-empty string as a valid bot token with zero format
// validation, immediately reporting success for an obviously fake value like
// "not-a-valid-token". These tests assert each channel's format check now
// rejects an invalid token before onConnect (and therefore the backend PATCH)
// is ever called, and still accepts a properly-shaped token.

const VALID_TELEGRAM_TOKEN = '123456789:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const VALID_DISCORD_TOKEN = 'MTk4NjIyNDgzNDcxOTI1MjQ4.Gh65s3.iOXo83qwGkdQrY0Dn7sABCDEFG';
const VALID_SLACK_TOKEN = 'xoxb-1234567890-abcdefg';

describe('TokenConnectionModal', () => {
  it('rejects an obviously invalid Telegram token instead of calling onConnect', async () => {
    const user = userEvent.setup();
    const onConnect = vi.fn().mockResolvedValue(undefined);

    render(
      <TokenConnectionModal
        open={true}
        onOpenChange={vi.fn()}
        onConnect={onConnect}
        channelType="telegram"
        channelName="Telegram"
      />
    );

    await user.type(screen.getByLabelText('Bot Token'), 'not-a-valid-token');
    await user.click(screen.getByRole('button', { name: 'Connect' }));

    expect(await screen.findByText(/doesn't look like a valid Telegram bot token/i)).toBeInTheDocument();
    expect(onConnect).not.toHaveBeenCalled();
  });

  it('accepts a correctly-shaped Telegram token and calls onConnect', async () => {
    const user = userEvent.setup();
    const onConnect = vi.fn().mockResolvedValue(undefined);

    render(
      <TokenConnectionModal
        open={true}
        onOpenChange={vi.fn()}
        onConnect={onConnect}
        channelType="telegram"
        channelName="Telegram"
      />
    );

    await user.type(screen.getByLabelText('Bot Token'), VALID_TELEGRAM_TOKEN);
    await user.click(screen.getByRole('button', { name: 'Connect' }));

    await waitFor(() => {
      expect(onConnect).toHaveBeenCalledWith({
        botToken: VALID_TELEGRAM_TOKEN,
        botUsername: undefined,
      });
    });
  });

  it('rejects an obviously invalid Discord token instead of calling onConnect', async () => {
    const user = userEvent.setup();
    const onConnect = vi.fn().mockResolvedValue(undefined);

    render(
      <TokenConnectionModal
        open={true}
        onOpenChange={vi.fn()}
        onConnect={onConnect}
        channelType="discord"
        channelName="Discord"
      />
    );

    await user.type(screen.getByLabelText('Bot Token'), 'garbage');
    await user.click(screen.getByRole('button', { name: 'Connect' }));

    expect(await screen.findByText(/doesn't look like a valid Discord bot token/i)).toBeInTheDocument();
    expect(onConnect).not.toHaveBeenCalled();
  });

  it('accepts a correctly-shaped Discord token and calls onConnect', async () => {
    const user = userEvent.setup();
    const onConnect = vi.fn().mockResolvedValue(undefined);

    render(
      <TokenConnectionModal
        open={true}
        onOpenChange={vi.fn()}
        onConnect={onConnect}
        channelType="discord"
        channelName="Discord"
      />
    );

    await user.type(screen.getByLabelText('Bot Token'), VALID_DISCORD_TOKEN);
    await user.click(screen.getByRole('button', { name: 'Connect' }));

    await waitFor(() => {
      expect(onConnect).toHaveBeenCalledWith({
        botToken: VALID_DISCORD_TOKEN,
        botUsername: undefined,
      });
    });
  });

  it('rejects a Slack token that does not start with xoxb-', async () => {
    const user = userEvent.setup();
    const onConnect = vi.fn().mockResolvedValue(undefined);

    render(
      <TokenConnectionModal
        open={true}
        onOpenChange={vi.fn()}
        onConnect={onConnect}
        channelType="slack"
        channelName="Slack"
      />
    );

    await user.type(screen.getByLabelText(/Bot User OAuth Token/i), 'not-a-slack-token');
    await user.click(screen.getByRole('button', { name: 'Connect' }));

    expect(await screen.findByText(/doesn't look like a valid Slack bot token/i)).toBeInTheDocument();
    expect(onConnect).not.toHaveBeenCalled();
  });

  it('accepts a correctly-shaped Slack token and calls onConnect', async () => {
    const user = userEvent.setup();
    const onConnect = vi.fn().mockResolvedValue(undefined);

    render(
      <TokenConnectionModal
        open={true}
        onOpenChange={vi.fn()}
        onConnect={onConnect}
        channelType="slack"
        channelName="Slack"
      />
    );

    await user.type(screen.getByLabelText(/Bot User OAuth Token/i), VALID_SLACK_TOKEN);
    await user.click(screen.getByRole('button', { name: 'Connect' }));

    await waitFor(() => {
      expect(onConnect).toHaveBeenCalledWith({
        botToken: VALID_SLACK_TOKEN,
        botUsername: undefined,
      });
    });
  });

  it('accepts the exact example token shown in its own Telegram hint text (issue #150)', async () => {
    const user = userEvent.setup();
    const onConnect = vi.fn().mockResolvedValue(undefined);

    render(
      <TokenConnectionModal
        open={true}
        onOpenChange={vi.fn()}
        onConnect={onConnect}
        channelType="telegram"
        channelName="Telegram"
      />
    );

    // Trigger the hint by submitting something invalid first, then read the
    // example token straight out of the rendered hint text so this test
    // fails again if the example and the regex ever drift apart.
    await user.type(screen.getByLabelText('Bot Token'), 'garbage');
    await user.click(screen.getByRole('button', { name: 'Connect' }));
    const hint = await screen.findByText(/Telegram bot tokens look like/i);
    const match = hint.textContent?.match(/(\d+:[\w-]+)\s+--/);
    expect(match).not.toBeNull();
    const exampleToken = match![1];

    await user.clear(screen.getByLabelText('Bot Token'));
    await user.type(screen.getByLabelText('Bot Token'), exampleToken);
    await user.click(screen.getByRole('button', { name: 'Connect' }));

    await waitFor(() => {
      expect(onConnect).toHaveBeenCalledWith({
        botToken: exampleToken,
        botUsername: undefined,
      });
    });
  });

  it('still requires a non-empty token before checking format', async () => {
    const user = userEvent.setup();
    const onConnect = vi.fn().mockResolvedValue(undefined);

    render(
      <TokenConnectionModal
        open={true}
        onOpenChange={vi.fn()}
        onConnect={onConnect}
        channelType="telegram"
        channelName="Telegram"
      />
    );

    await user.click(screen.getByRole('button', { name: 'Connect' }));

    expect(await screen.findByText('Please enter a bot token')).toBeInTheDocument();
    expect(onConnect).not.toHaveBeenCalled();
  });
});
