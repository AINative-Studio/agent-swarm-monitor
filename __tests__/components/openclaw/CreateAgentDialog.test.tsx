import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateAgentDialog from '@/components/openclaw/CreateAgentDialog';
import type { OpenClawTemplate } from '@/types/openclaw';

const mockTemplate: OpenClawTemplate = {
    id: 'tpl-1',
    name: 'Support Bot',
    description: 'Handles customer support tickets',
    category: 'productivity',
    icons: ['headset'],
    defaultModel: 'anthropic/claude-sonnet-4',
    defaultPersona: 'A helpful support agent.',
    defaultHeartbeatInterval: '15m',
    defaultChecklist: ['Check open tickets', 'Respond to urgent issues'],
};

describe('CreateAgentDialog', () => {
    it('renders nothing meaningful when closed', () => {
        render(
            <CreateAgentDialog open={false} onOpenChange={vi.fn()} onSubmit={vi.fn()} />
        );
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders the blank create form when open with no template', () => {
        render(<CreateAgentDialog open onOpenChange={vi.fn()} onSubmit={vi.fn()} />);

        expect(screen.getByText('Create Agent')).toBeInTheDocument();
        expect(screen.getByLabelText('Name')).toHaveValue('');
        expect(screen.getByLabelText('Persona')).toHaveValue('');
        // Create button should be disabled until a name is entered.
        expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();
    });

    it('disables submit until a name is entered, then calls onSubmit with trimmed data', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        const onOpenChange = vi.fn();

        render(<CreateAgentDialog open onOpenChange={onOpenChange} onSubmit={onSubmit} />);

        const nameInput = screen.getByLabelText('Name');
        const createButton = screen.getByRole('button', { name: 'Create' });

        expect(createButton).toBeDisabled();

        await user.type(nameInput, '  My New Agent  ');
        expect(createButton).toBeEnabled();

        await user.click(createButton);

        expect(onSubmit).toHaveBeenCalledWith({
            name: 'My New Agent',
            model: 'anthropic/claude-opus-4-5',
            persona: undefined,
        });
        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('pre-fills fields from a template and labels the dialog accordingly', () => {
        render(
            <CreateAgentDialog
                open
                onOpenChange={vi.fn()}
                onSubmit={vi.fn()}
                template={mockTemplate}
            />
        );

        expect(screen.getByText('Create Agent from Template')).toBeInTheDocument();
        expect(screen.getByLabelText('Name')).toHaveValue('Support Bot');
        expect(screen.getByLabelText('Persona')).toHaveValue('A helpful support agent.');
        expect(screen.getByText(/Pre-filled from "Support Bot" template/)).toBeInTheDocument();
    });

    it('includes heartbeat config in the submitted payload only when the toggle is enabled', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();

        render(<CreateAgentDialog open onOpenChange={vi.fn()} onSubmit={onSubmit} />);

        await user.type(screen.getByLabelText('Name'), 'Heartbeat Agent');

        const heartbeatToggle = screen.getByRole('switch', { name: /heartbeat/i });
        await user.click(heartbeatToggle);

        // Checklist field should appear once heartbeat is enabled.
        const checklistField = screen.getByLabelText(/checklist/i);
        await user.type(checklistField, 'Check status{enter}Send report');

        await user.click(screen.getByRole('button', { name: 'Create' }));

        expect(onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'Heartbeat Agent',
                heartbeat: expect.objectContaining({
                    enabled: true,
                    interval: '5m',
                    checklist: ['Check status', 'Send report'],
                }),
            })
        );
    });

    it('calls onOpenChange(false) without submitting when Cancel is clicked', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        const onOpenChange = vi.fn();

        render(<CreateAgentDialog open onOpenChange={onOpenChange} onSubmit={onSubmit} />);

        await user.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(onOpenChange).toHaveBeenCalledWith(false);
        expect(onSubmit).not.toHaveBeenCalled();
    });

    // Issue #108: the dialog must not close or reset the form when the
    // submission fails (e.g. a 401 from the backend) -- it should stay open,
    // keep the user's input, and show a visible error.
    it('stays open with an error banner and the entered name intact when onSubmit rejects', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockRejectedValue(new Error('Not authenticated'));
        const onOpenChange = vi.fn();

        render(<CreateAgentDialog open onOpenChange={onOpenChange} onSubmit={onSubmit} />);

        await user.type(screen.getByLabelText('Name'), 'My Agent');
        await user.click(screen.getByRole('button', { name: 'Create' }));

        expect(await screen.findByText('Not authenticated')).toBeInTheDocument();
        expect(onOpenChange).not.toHaveBeenCalled();
        expect(screen.getByLabelText('Name')).toHaveValue('My Agent');
    });

    it('shows a loading state and disables the submit button while isSubmitting is true', () => {
        render(
            <CreateAgentDialog
                open
                onOpenChange={vi.fn()}
                onSubmit={vi.fn()}
                isSubmitting
            />
        );

        // While submitting the button's accessible name temporarily changes
        // from "Create" to "Creating..." -- look it up by its submit role
        // instead of the old label.
        const buttons = screen.getAllByRole('button');
        const submitButton = buttons.find((b) => b.getAttribute('type') === 'submit');
        expect(submitButton).toBeDisabled();
        expect(screen.getByText('Creating...')).toBeInTheDocument();
    });

    it('offers a Retry action in the error banner that resubmits the same data', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockRejectedValueOnce(new Error('Not authenticated'))
            .mockResolvedValueOnce(undefined);
        const onOpenChange = vi.fn();

        render(<CreateAgentDialog open onOpenChange={onOpenChange} onSubmit={onSubmit} />);

        await user.type(screen.getByLabelText('Name'), 'My Agent');
        await user.click(screen.getByRole('button', { name: 'Create' }));
        expect(await screen.findByText('Not authenticated')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Retry' }));

        expect(onSubmit).toHaveBeenCalledTimes(2);
        expect(onOpenChange).toHaveBeenCalledWith(false);
    });
});
