import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AgentSettingsTab from '@/components/openclaw/AgentSettingsTab';
import type { OpenClawAgent } from '@/types/openclaw';

const toastMock = vi.fn();

vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({ toast: toastMock }),
}));

vi.mock('@/lib/openclaw-service', () => ({
    default: {
        updateSettings: vi.fn().mockResolvedValue({}),
        sendMessage: vi.fn().mockResolvedValue({ status: 'sent' }),
    },
}));

import openClawService from '@/lib/openclaw-service';

const baseAgent: OpenClawAgent = {
    id: 'agent-001',
    name: 'Support Bot',
    persona: 'A helpful support agent.',
    model: 'anthropic/claude-opus-4-5',
    userId: 'user-1',
    status: 'running',
    openclawSessionKey: 'session-key',
    openclawAgentId: 'oc-1',
    heartbeatEnabled: true,
    heartbeatInterval: '15m',
    heartbeatChecklist: ['Check tickets', 'Respond to urgent issues'],
    lastHeartbeatAt: null,
    nextHeartbeatAt: null,
    configuration: null,
    errorMessage: null,
    errorCount: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: null,
    provisionedAt: '2026-01-01T00:00:00Z',
    pausedAt: null,
    stoppedAt: null,
};

function renderTab(overrides: Partial<OpenClawAgent> = {}, handlers: Partial<{
    onSave: (data: unknown) => void;
    onDelete: () => void;
    onRunHeartbeat: () => void;
    onRestart: () => void;
}> = {}) {
    const onSave = handlers.onSave ?? vi.fn();
    const onDelete = handlers.onDelete ?? vi.fn();
    const onRunHeartbeat = handlers.onRunHeartbeat ?? vi.fn();
    const onRestart = handlers.onRestart ?? vi.fn();

    render(
        <AgentSettingsTab
            agent={{ ...baseAgent, ...overrides }}
            onSave={onSave}
            onDelete={onDelete}
            onRunHeartbeat={onRunHeartbeat}
            onRestart={onRestart}
        />
    );

    return { onSave, onDelete, onRunHeartbeat, onRestart };
}

describe('AgentSettingsTab', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the agent name, persona, and heartbeat checklist fields from the agent prop', () => {
        renderTab();

        expect(screen.getByLabelText(/Agent Name/i)).toHaveValue('Support Bot');
        expect(screen.getByLabelText(/Persona/i)).toHaveValue('A helpful support agent.');
        expect(screen.getByLabelText(/Heartbeat Checklist/i)).toHaveValue(
            'Check tickets\nRespond to urgent issues'
        );
    });

    it('updates local persona state as the user types, without calling onSave', async () => {
        // AgentSettingsTab does not render its own Save control — the parent
        // page owns the "Save" button and calls the exposed onSave itself.
        // Here we confirm edits are tracked in local state and onSave is only
        // ever a callback prop, never auto-invoked on every keystroke.
        const user = userEvent.setup();
        const { onSave } = renderTab();

        const personaField = screen.getByLabelText(/Persona/i);
        await user.clear(personaField);
        await user.type(personaField, 'An even more helpful agent.');

        expect(personaField).toHaveValue('An even more helpful agent.');
        expect(onSave).not.toHaveBeenCalled();
    });

    it('invokes onRunHeartbeat when "Run Heartbeat" is clicked', async () => {
        const user = userEvent.setup();
        const { onRunHeartbeat } = renderTab();

        await user.click(screen.getByRole('button', { name: /run heartbeat/i }));

        expect(onRunHeartbeat).toHaveBeenCalledTimes(1);
    });

    it('invokes onRestart when "Restart" is clicked', async () => {
        const user = userEvent.setup();
        const { onRestart } = renderTab();

        await user.click(screen.getByRole('button', { name: /^restart$/i }));

        expect(onRestart).toHaveBeenCalledTimes(1);
    });

    it('invokes onDelete when the danger-zone "Delete" button is clicked', async () => {
        const user = userEvent.setup();
        const { onDelete } = renderTab();

        await user.click(screen.getByRole('button', { name: /^delete$/i }));

        expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it('disables the fix-prompt Send button until text is entered, then sends it', async () => {
        const user = userEvent.setup();
        renderTab();

        const sendButton = screen.getByRole('button', { name: /^send$/i });
        expect(sendButton).toBeDisabled();

        const fixPromptField = screen.getByPlaceholderText(/Provide debugging hints/i);
        await user.type(fixPromptField, 'Restart the webhook listener');

        expect(sendButton).toBeEnabled();
        await user.click(sendButton);

        expect(openClawService.sendMessage).toHaveBeenCalledWith({
            agentId: 'agent-001',
            message: '[FIX PROMPT] Restart the webhook listener',
        });
    });

    it('disables the Open Control UI button when the agent has no session key', () => {
        renderTab({ openclawSessionKey: null });

        expect(screen.getByRole('button', { name: /open control ui/i })).toBeDisabled();
    });

    it('enables the Open Control UI button when the agent is running with a session key', () => {
        renderTab({ openclawSessionKey: 'session-key', status: 'running' });

        expect(screen.getByRole('button', { name: /open control ui/i })).toBeEnabled();
    });
});
