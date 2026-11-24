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
    onDirtyChange: (isDirty: boolean) => void;
}> = {}) {
    const onSave = (handlers.onSave ?? vi.fn()) as ReturnType<typeof vi.fn>;
    const onDelete = (handlers.onDelete ?? vi.fn()) as ReturnType<typeof vi.fn>;
    const onRunHeartbeat = (handlers.onRunHeartbeat ?? vi.fn()) as ReturnType<typeof vi.fn>;
    const onRestart = (handlers.onRestart ?? vi.fn()) as ReturnType<typeof vi.fn>;
    const onDirtyChange = (handlers.onDirtyChange ?? vi.fn()) as ReturnType<typeof vi.fn>;

    render(
        <AgentSettingsTab
            agent={{ ...baseAgent, ...overrides }}
            onSave={onSave}
            onDelete={onDelete}
            onRunHeartbeat={onRunHeartbeat}
            onRestart={onRestart}
            onDirtyChange={onDirtyChange}
        />
    );

    return { onSave, onDelete, onRunHeartbeat, onRestart, onDirtyChange };
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

    it('shows the real model text in the Model dropdown for a model slug not in the known catalog (issue #123)', () => {
        // 'anthropic/claude-sonnet-4-5' is a real slug returned by the live
        // backend but is not one of the hardcoded/catalog model options --
        // the dropdown must display it rather than rendering blank.
        renderTab({ model: 'anthropic/claude-sonnet-4-5' });

        expect(screen.getByLabelText(/^Model$/i)).toHaveTextContent('anthropic/claude-sonnet-4-5');
    });

    it('shows a known model slug correctly in the Model dropdown (no regression)', () => {
        renderTab({ model: 'anthropic/claude-opus-4-5' });

        expect(screen.getByLabelText(/^Model$/i)).toHaveTextContent(/Claude Opus 4\.5/i);
    });

    it('limits the Model dropdown to providers with a configured API key (issue #106)', async () => {
        // Only an OpenAI key is configured, so the dropdown should offer
        // OpenAI models but not an unconfigured provider's models (e.g. Groq).
        const user = userEvent.setup();
        renderTab({
            model: 'openai/gpt-4o',
            configuration: {
                apiKeys: {
                    openai: { key: 'sk-test', masked: 'sk-***test', addedAt: '2026-01-01T00:00:00Z' },
                },
            },
        });

        await user.click(screen.getByLabelText(/^Model$/i));

        expect(screen.getByRole('option', { name: /GPT-4o$/i })).toBeInTheDocument();
        expect(screen.queryByRole('option', { name: /Llama 3\.1 70B/i })).not.toBeInTheDocument();
    });

    it('falls back to the default model set when no API keys are configured', async () => {
        const user = userEvent.setup();
        renderTab({ model: 'anthropic/claude-opus-4-5', configuration: {} });

        await user.click(screen.getByLabelText(/^Model$/i));

        // Default set includes Claude Opus 4.5 and GPT-4o, but not every
        // model in the full 70+-model catalog (e.g. Groq's Llama options).
        expect(screen.getByRole('option', { name: /Claude Opus 4\.5/i })).toBeInTheDocument();
        expect(screen.queryByRole('option', { name: /Llama 3\.1 70B/i })).not.toBeInTheDocument();
    });

    // Issue #141: editing a field and navigating away before clicking "Save
    // Changes" previously discarded the edit with zero warning. The tab now
    // tracks dirty state (reported to the parent via onDirtyChange) and
    // installs a beforeunload guard for tab-close/refresh while dirty.
    describe('dirty-state tracking (issue #141)', () => {
        it('reports not dirty on initial render', () => {
            const { onDirtyChange } = renderTab();
            expect(onDirtyChange).toHaveBeenCalledWith(false);
        });

        it('reports dirty after editing the persona field, and clean again if reverted', async () => {
            const user = userEvent.setup();
            const { onDirtyChange } = renderTab();
            onDirtyChange.mockClear();

            const personaField = screen.getByLabelText(/Persona/i);
            await user.type(personaField, ' extra');

            expect(onDirtyChange).toHaveBeenLastCalledWith(true);

            await user.clear(personaField);
            await user.type(personaField, 'A helpful support agent.');

            expect(onDirtyChange).toHaveBeenLastCalledWith(false);
        });

        it('reports dirty after toggling heartbeat enabled', async () => {
            const user = userEvent.setup();
            const { onDirtyChange } = renderTab();
            onDirtyChange.mockClear();

            await user.click(screen.getByLabelText(/Enable heartbeat/i));

            expect(onDirtyChange).toHaveBeenLastCalledWith(true);
        });

        it('installs a beforeunload guard only while dirty, and removes it once clean', async () => {
            const user = userEvent.setup();
            const addSpy = vi.spyOn(window, 'addEventListener');
            const removeSpy = vi.spyOn(window, 'removeEventListener');

            renderTab();
            addSpy.mockClear();

            const personaField = screen.getByLabelText(/Persona/i);
            await user.type(personaField, ' extra');

            expect(addSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));

            await user.clear(personaField);
            await user.type(personaField, 'A helpful support agent.');

            expect(removeSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));

            addSpy.mockRestore();
            removeSpy.mockRestore();
        });
    });
});
