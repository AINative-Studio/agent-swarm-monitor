import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import openClawService from '@/lib/openclaw-service';
import type { OpenClawAgent } from '@/types/openclaw';

vi.mock('@/lib/openclaw-service', () => ({
    default: {
        listAgents: vi.fn(),
        getAgent: vi.fn(),
        createAgent: vi.fn(),
        pauseAgent: vi.fn(),
        resumeAgent: vi.fn(),
        updateSettings: vi.fn(),
        deleteAgent: vi.fn(),
        executeHeartbeat: vi.fn(),
    },
}));

import {
    useAgentList,
    useAgent,
    useCreateAgent,
    usePauseAgent,
    useResumeAgent,
    useUpdateAgentSettings,
    useDeleteAgent,
    useExecuteHeartbeat,
} from '@/hooks/useOpenClawAgents';

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
        },
    });
    return function Wrapper({ children }: { children: React.ReactNode }) {
        return createElement(QueryClientProvider, { client: queryClient }, children);
    };
}

const mockAgent: OpenClawAgent = {
    id: 'agent-001',
    name: 'Test Agent',
    persona: null,
    model: 'anthropic/claude-opus-4-5',
    userId: 'user-1',
    status: 'running',
    openclawSessionKey: null,
    openclawAgentId: null,
    heartbeatEnabled: false,
    heartbeatInterval: null,
    heartbeatChecklist: null,
    lastHeartbeatAt: null,
    nextHeartbeatAt: null,
    configuration: null,
    errorMessage: null,
    errorCount: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: null,
    provisionedAt: null,
    pausedAt: null,
    stoppedAt: null,
};

describe('useOpenClawAgents hooks', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('useAgentList', () => {
        it('should fetch the agent list with no status filter', async () => {
            vi.mocked(openClawService.listAgents).mockResolvedValue({
                agents: [mockAgent],
                total: 1,
                limit: 50,
                offset: 0,
            });

            const { result } = renderHook(() => useAgentList(), {
                wrapper: createWrapper(),
            });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(result.current.data?.agents).toHaveLength(1);
            expect(openClawService.listAgents).toHaveBeenCalledWith(undefined);
        });

        it('should pass the status filter through to the service', async () => {
            vi.mocked(openClawService.listAgents).mockResolvedValue({
                agents: [],
                total: 0,
                limit: 50,
                offset: 0,
            });

            renderHook(() => useAgentList('paused'), {
                wrapper: createWrapper(),
            });

            await waitFor(() =>
                expect(openClawService.listAgents).toHaveBeenCalledWith('paused')
            );
        });
    });

    describe('useAgent', () => {
        it('should fetch a single agent when an id is provided', async () => {
            vi.mocked(openClawService.getAgent).mockResolvedValue(mockAgent);

            const { result } = renderHook(() => useAgent('agent-001'), {
                wrapper: createWrapper(),
            });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(result.current.data?.id).toBe('agent-001');
            expect(openClawService.getAgent).toHaveBeenCalledWith('agent-001');
        });

        it('should not fetch when agentId is undefined (enabled: false)', async () => {
            const { result } = renderHook(() => useAgent(undefined), {
                wrapper: createWrapper(),
            });

            // Give any microtasks a chance to run, then assert nothing fired.
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(openClawService.getAgent).not.toHaveBeenCalled();
            expect(result.current.fetchStatus).toBe('idle');
        });
    });

    describe('useCreateAgent', () => {
        it('should call createAgent and invalidate the agents list on success', async () => {
            vi.mocked(openClawService.createAgent).mockResolvedValue(mockAgent);
            const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false } },
            });
            const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
            const wrapper = ({ children }: { children: React.ReactNode }) =>
                createElement(QueryClientProvider, { client: queryClient }, children);

            const { result } = renderHook(() => useCreateAgent(), { wrapper });

            result.current.mutate({ name: 'New Agent', model: 'anthropic/claude-opus-4-5' });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(openClawService.createAgent).toHaveBeenCalledWith({
                name: 'New Agent',
                model: 'anthropic/claude-opus-4-5',
            });
            expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['openclaw-agents'] });
        });

        it('should surface an error when createAgent rejects', async () => {
            vi.mocked(openClawService.createAgent).mockRejectedValue(new Error('name taken'));

            const { result } = renderHook(() => useCreateAgent(), {
                wrapper: createWrapper(),
            });

            result.current.mutate({ name: 'Dup', model: 'anthropic/claude-opus-4-5' });

            await waitFor(() => expect(result.current.isError).toBe(true));
            expect((result.current.error as Error).message).toBe('name taken');
        });
    });

    describe('usePauseAgent / useResumeAgent', () => {
        it('should invalidate both the list and the specific agent on pause success', async () => {
            vi.mocked(openClawService.pauseAgent).mockResolvedValue({
                ...mockAgent,
                status: 'paused',
            });
            const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false } },
            });
            const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
            const wrapper = ({ children }: { children: React.ReactNode }) =>
                createElement(QueryClientProvider, { client: queryClient }, children);

            const { result } = renderHook(() => usePauseAgent(), { wrapper });

            result.current.mutate('agent-001');

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(openClawService.pauseAgent).toHaveBeenCalledWith('agent-001');
            expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['openclaw-agents'] });
            expect(invalidateSpy).toHaveBeenCalledWith({
                queryKey: ['openclaw-agent', 'agent-001'],
            });
        });

        it('should call resumeAgent with the given id', async () => {
            vi.mocked(openClawService.resumeAgent).mockResolvedValue({
                ...mockAgent,
                status: 'running',
            });

            const { result } = renderHook(() => useResumeAgent(), {
                wrapper: createWrapper(),
            });

            result.current.mutate('agent-001');

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(openClawService.resumeAgent).toHaveBeenCalledWith('agent-001');
        });
    });

    describe('useUpdateAgentSettings', () => {
        it('should call updateSettings with the bound agentId and invalidate caches', async () => {
            vi.mocked(openClawService.updateSettings).mockResolvedValue({
                ...mockAgent,
                persona: 'Updated persona',
            });
            const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false } },
            });
            const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
            const wrapper = ({ children }: { children: React.ReactNode }) =>
                createElement(QueryClientProvider, { client: queryClient }, children);

            const { result } = renderHook(() => useUpdateAgentSettings('agent-001'), {
                wrapper,
            });

            result.current.mutate({ persona: 'Updated persona' });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(openClawService.updateSettings).toHaveBeenCalledWith('agent-001', {
                persona: 'Updated persona',
            });
            expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['openclaw-agents'] });
            expect(invalidateSpy).toHaveBeenCalledWith({
                queryKey: ['openclaw-agent', 'agent-001'],
            });
        });
    });

    describe('useDeleteAgent', () => {
        it('should call deleteAgent and invalidate the agents list', async () => {
            vi.mocked(openClawService.deleteAgent).mockResolvedValue(undefined);
            const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false } },
            });
            const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
            const wrapper = ({ children }: { children: React.ReactNode }) =>
                createElement(QueryClientProvider, { client: queryClient }, children);

            const { result } = renderHook(() => useDeleteAgent(), { wrapper });

            result.current.mutate('agent-001');

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(openClawService.deleteAgent).toHaveBeenCalledWith('agent-001');
            expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['openclaw-agents'] });
        });
    });

    describe('useExecuteHeartbeat', () => {
        it('should call executeHeartbeat and invalidate the specific agent cache', async () => {
            vi.mocked(openClawService.executeHeartbeat).mockResolvedValue({
                status: 'completed',
                message: 'OK',
            });
            const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false } },
            });
            const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
            const wrapper = ({ children }: { children: React.ReactNode }) =>
                createElement(QueryClientProvider, { client: queryClient }, children);

            const { result } = renderHook(() => useExecuteHeartbeat(), { wrapper });

            result.current.mutate('agent-001');

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(openClawService.executeHeartbeat).toHaveBeenCalledWith('agent-001');
            expect(invalidateSpy).toHaveBeenCalledWith({
                queryKey: ['openclaw-agent', 'agent-001'],
            });
        });
    });
});
