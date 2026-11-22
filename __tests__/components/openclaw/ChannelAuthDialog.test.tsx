import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChannelAuthDialog } from '@/components/openclaw/ChannelAuthDialog';
import openClawService from '@/lib/openclaw-service';
import { ApiTimeoutError } from '@/lib/api-client';

const toastMock = vi.fn();

vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({ toast: toastMock }),
}));

vi.mock('@/lib/openclaw-service', () => ({
    default: {
        addChannelBotToken: vi.fn(),
        addChannelSlack: vi.fn(),
        loginChannel: vi.fn(),
    },
}));

describe('ChannelAuthDialog', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('bot_token auth (e.g. Telegram/Discord)', () => {
        const defaultProps = {
            open: true,
            onOpenChange: vi.fn(),
            channelId: 'telegram',
            channelName: 'Telegram',
            authType: 'bot_token',
            instructions: ['Create a bot via @BotFather', 'Copy the bot token'],
            onSuccess: vi.fn(),
        };

        it('renders setup instructions and a bot token field', () => {
            render(<ChannelAuthDialog {...defaultProps} />);

            expect(screen.getByText('Connect Telegram')).toBeInTheDocument();
            expect(screen.getByText('Create a bot via @BotFather')).toBeInTheDocument();
            expect(screen.getByLabelText('Bot Token')).toBeInTheDocument();
        });

        it('shows a validation toast and does not call the service when the token is empty', async () => {
            const user = userEvent.setup();
            render(<ChannelAuthDialog {...defaultProps} />);

            await user.click(screen.getByRole('button', { name: 'Connect' }));

            expect(toastMock).toHaveBeenCalledWith(
                expect.objectContaining({ title: 'Token required', variant: 'destructive' })
            );
            expect(openClawService.addChannelBotToken).not.toHaveBeenCalled();
        });

        it('submits the token, shows a success toast, and calls onSuccess + closes', async () => {
            const user = userEvent.setup();
            const onSuccess = vi.fn();
            const onOpenChange = vi.fn();
            vi.mocked(openClawService.addChannelBotToken).mockResolvedValue({ ok: true });

            render(
                <ChannelAuthDialog
                    {...defaultProps}
                    onSuccess={onSuccess}
                    onOpenChange={onOpenChange}
                />
            );

            await user.type(screen.getByLabelText('Bot Token'), '123:ABC-token');
            await user.click(screen.getByRole('button', { name: 'Connect' }));

            await waitFor(() => expect(onSuccess).toHaveBeenCalled());
            expect(openClawService.addChannelBotToken).toHaveBeenCalledWith({
                channel: 'telegram',
                token: '123:ABC-token',
            });
            expect(toastMock).toHaveBeenCalledWith(
                expect.objectContaining({ title: 'Channel connected!' })
            );
            expect(onOpenChange).toHaveBeenCalledWith(false);
        });

        it('shows a timeout-specific toast when the request times out', async () => {
            const user = userEvent.setup();
            vi.mocked(openClawService.addChannelBotToken).mockRejectedValue(
                new ApiTimeoutError('/openclaw/channels/add/bot-token', 30000)
            );

            render(<ChannelAuthDialog {...defaultProps} />);

            await user.type(screen.getByLabelText('Bot Token'), 'slow-token');
            await user.click(screen.getByRole('button', { name: 'Connect' }));

            await waitFor(() =>
                expect(toastMock).toHaveBeenCalledWith(
                    expect.objectContaining({ title: 'Connection Timeout' })
                )
            );
        });

        it('shows a generic failure toast on a non-timeout error', async () => {
            const user = userEvent.setup();
            vi.mocked(openClawService.addChannelBotToken).mockRejectedValue(
                new Error('invalid token')
            );

            render(<ChannelAuthDialog {...defaultProps} />);

            await user.type(screen.getByLabelText('Bot Token'), 'bad-token');
            await user.click(screen.getByRole('button', { name: 'Connect' }));

            await waitFor(() =>
                expect(toastMock).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: 'Connection failed',
                        description: 'invalid token',
                    })
                )
            );
        });
    });

    describe('oauth auth (Slack)', () => {
        const slackProps = {
            open: true,
            onOpenChange: vi.fn(),
            channelId: 'slack',
            channelName: 'Slack',
            authType: 'oauth',
            instructions: ['Create a Slack app', 'Install it to your workspace'],
            onSuccess: vi.fn(),
        };

        it('requires both bot and app tokens before submitting', async () => {
            const user = userEvent.setup();
            render(<ChannelAuthDialog {...slackProps} />);

            await user.type(screen.getByLabelText(/Bot Token/), 'xoxb-only');
            await user.click(screen.getByRole('button', { name: 'Connect Slack' }));

            expect(toastMock).toHaveBeenCalledWith(
                expect.objectContaining({ title: 'Tokens required' })
            );
            expect(openClawService.addChannelSlack).not.toHaveBeenCalled();
        });

        it('submits both tokens to addChannelSlack', async () => {
            const user = userEvent.setup();
            vi.mocked(openClawService.addChannelSlack).mockResolvedValue({ ok: true });

            render(<ChannelAuthDialog {...slackProps} />);

            await user.type(screen.getByLabelText(/Bot Token/), 'xoxb-123');
            await user.type(screen.getByLabelText(/App Token/), 'xapp-456');
            await user.click(screen.getByRole('button', { name: 'Connect Slack' }));

            await waitFor(() =>
                expect(openClawService.addChannelSlack).toHaveBeenCalledWith({
                    bot_token: 'xoxb-123',
                    app_token: 'xapp-456',
                })
            );
        });
    });

    describe('qr_code auth (WhatsApp)', () => {
        const qrProps = {
            open: true,
            onOpenChange: vi.fn(),
            channelId: 'whatsapp',
            channelName: 'WhatsApp',
            authType: 'qr_code',
            instructions: ['Open WhatsApp on your phone', 'Scan the QR code shown below'],
            onSuccess: vi.fn(),
        };

        it('shows a placeholder before generating and renders the QR output after', async () => {
            const user = userEvent.setup();
            vi.mocked(openClawService.loginChannel).mockResolvedValue({
                success: true,
                output: 'FAKE-QR-DATA',
            });

            render(<ChannelAuthDialog {...qrProps} />);

            expect(screen.getByText(/Click "Generate QR Code"/)).toBeInTheDocument();

            await user.click(screen.getByRole('button', { name: 'Generate QR Code' }));

            await waitFor(() => expect(screen.getByText('FAKE-QR-DATA')).toBeInTheDocument());
            expect(openClawService.loginChannel).toHaveBeenCalledWith({
                channel: 'whatsapp',
                verbose: true,
            });
        });
    });
});
