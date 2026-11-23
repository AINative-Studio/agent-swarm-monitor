import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ComingSoonModal from '@/components/openclaw/ComingSoonModal';

describe('ComingSoonModal', () => {
    it('renders nothing visible when closed', () => {
        render(
            <ComingSoonModal open={false} onOpenChange={vi.fn()} channelName="Gmail" />
        );

        expect(screen.queryByText('Gmail - Coming Soon')).not.toBeInTheDocument();
    });

    it('shows an honest "coming soon" message with the given name when open', () => {
        render(
            <ComingSoonModal open={true} onOpenChange={vi.fn()} channelName="Gmail" />
        );

        expect(screen.getByText('Gmail - Coming Soon')).toBeInTheDocument();
        expect(
            screen.getByText('Gmail integration is currently under development')
        ).toBeInTheDocument();
        expect(screen.getByText('Under Development')).toBeInTheDocument();
    });

    it('calls onOpenChange(false) when "Got it" is clicked', async () => {
        const user = userEvent.setup();
        const onOpenChange = vi.fn();

        render(
            <ComingSoonModal open={true} onOpenChange={onOpenChange} channelName="LinkedIn" />
        );

        await user.click(screen.getByRole('button', { name: 'Got it' }));

        expect(onOpenChange).toHaveBeenCalledWith(false);
    });
});
