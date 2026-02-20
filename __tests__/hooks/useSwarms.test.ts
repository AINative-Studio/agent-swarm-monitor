import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import swarmService from '@/lib/swarm-service';

vi.mock('@/lib/swarm-service', () => ({
    default: {
        listSwarms: vi.fn(),
        getSwarm: vi.fn(),
        createSwarm: vi.fn(),
        updateSwarm: vi.fn(),
        addAgents: vi.fn(),
        removeAgents: vi.fn(),
        startSwarm: vi.fn(),
        pauseSwarm: vi.fn(),
        resumeSwarm: vi.fn(),
        stopSwarm: vi.fn(),
    },
}));

import {
    useSwarmList,
    useSwarm,
    useCreateSwarm,
    useUpdateSwarm,
    useStartSwarm,
    usePauseSwarm,
    useResumeSwarm,
    useStopSwarm,
    useAddAgentsToSwarm,
    useRemoveAgentsFromSwarm,
} from '@/hooks/useSwarms';

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

const MOCK_SWARM = {
    id: 'swarm-1',
    name: 'Test Swarm',
    description: 'A test swarm',
    strategy: 'parallel' as const,
    goal: 'Build something',
    status: 'idle' as const,
    agentIds: ['agent-1'],
    agentCount: 1,
    userId: 'user-1',
    configuration: null,
    errorMessage: null,
    createdAt: '2026-02-20T12:00:00Z',
    updatedAt: null,
    startedAt: null,
    pausedAt: null,
    stoppedAt: null,
};

describe('Swarm Hooks', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('useSwarmList', () => {
        it('should fetch swarm list', async () => {
            const mockResponse = {
                swarms: [MOCK_SWARM],
                total: 1,
                limit: 50,
                offset: 0,
            };
            vi.mocked(swarmService.listSwarms).mockResolvedValue(mockResponse);

            const { result } = renderHook(() => useSwarmList(), {
                wrapper: createWrapper(),
            });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(result.current.data?.swarms).toHaveLength(1);
            expect(result.current.data?.swarms[0].name).toBe('Test Swarm');
            expect(swarmService.listSwarms).toHaveBeenCalledWith(undefined);
        });

        it('should pass status filter', async () => {
            vi.mocked(swarmService.listSwarms).mockResolvedValue({
                swarms: [],
                total: 0,
                limit: 50,
                offset: 0,
            });

            const { result } = renderHook(() => useSwarmList('running'), {
                wrapper: createWrapper(),
            });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(swarmService.listSwarms).toHaveBeenCalledWith('running');
        });
    });

    describe('useSwarm', () => {
        it('should fetch single swarm', async () => {
            vi.mocked(swarmService.getSwarm).mockResolvedValue(MOCK_SWARM);

            const { result } = renderHook(() => useSwarm('swarm-1'), {
                wrapper: createWrapper(),
            });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(result.current.data?.name).toBe('Test Swarm');
            expect(swarmService.getSwarm).toHaveBeenCalledWith('swarm-1');
        });

        it('should not fetch when swarmId is undefined', () => {
            const { result } = renderHook(() => useSwarm(undefined), {
                wrapper: createWrapper(),
            });

            expect(result.current.fetchStatus).toBe('idle');
            expect(swarmService.getSwarm).not.toHaveBeenCalled();
        });
    });

    describe('useCreateSwarm', () => {
        it('should call createSwarm service method', async () => {
            vi.mocked(swarmService.createSwarm).mockResolvedValue(MOCK_SWARM);

            const { result } = renderHook(() => useCreateSwarm(), {
                wrapper: createWrapper(),
            });

            result.current.mutate({
                name: 'Test Swarm',
                strategy: 'parallel',
            });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(swarmService.createSwarm).toHaveBeenCalledWith({
                name: 'Test Swarm',
                strategy: 'parallel',
            });
        });
    });

    describe('useUpdateSwarm', () => {
        it('should call updateSwarm service method', async () => {
            vi.mocked(swarmService.updateSwarm).mockResolvedValue({
                ...MOCK_SWARM,
                name: 'Updated',
            });

            const { result } = renderHook(() => useUpdateSwarm('swarm-1'), {
                wrapper: createWrapper(),
            });

            result.current.mutate({ name: 'Updated' });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(swarmService.updateSwarm).toHaveBeenCalledWith('swarm-1', {
                name: 'Updated',
            });
        });
    });

    describe('useStartSwarm', () => {
        it('should call startSwarm service method', async () => {
            vi.mocked(swarmService.startSwarm).mockResolvedValue({
                ...MOCK_SWARM,
                status: 'running',
            });

            const { result } = renderHook(() => useStartSwarm(), {
                wrapper: createWrapper(),
            });

            result.current.mutate('swarm-1');

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(swarmService.startSwarm).toHaveBeenCalledWith('swarm-1');
        });
    });

    describe('usePauseSwarm', () => {
        it('should call pauseSwarm service method', async () => {
            vi.mocked(swarmService.pauseSwarm).mockResolvedValue({
                ...MOCK_SWARM,
                status: 'paused',
            });

            const { result } = renderHook(() => usePauseSwarm(), {
                wrapper: createWrapper(),
            });

            result.current.mutate('swarm-1');

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(swarmService.pauseSwarm).toHaveBeenCalledWith('swarm-1');
        });
    });

    describe('useResumeSwarm', () => {
        it('should call resumeSwarm service method', async () => {
            vi.mocked(swarmService.resumeSwarm).mockResolvedValue({
                ...MOCK_SWARM,
                status: 'running',
            });

            const { result } = renderHook(() => useResumeSwarm(), {
                wrapper: createWrapper(),
            });

            result.current.mutate('swarm-1');

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(swarmService.resumeSwarm).toHaveBeenCalledWith('swarm-1');
        });
    });

    describe('useStopSwarm', () => {
        it('should call stopSwarm service method', async () => {
            vi.mocked(swarmService.stopSwarm).mockResolvedValue(undefined);

            const { result } = renderHook(() => useStopSwarm(), {
                wrapper: createWrapper(),
            });

            result.current.mutate('swarm-1');

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(swarmService.stopSwarm).toHaveBeenCalledWith('swarm-1');
        });
    });

    describe('useAddAgentsToSwarm', () => {
        it('should call addAgents service method', async () => {
            vi.mocked(swarmService.addAgents).mockResolvedValue({
                ...MOCK_SWARM,
                agentIds: ['agent-1', 'agent-2'],
                agentCount: 2,
            });

            const { result } = renderHook(() => useAddAgentsToSwarm('swarm-1'), {
                wrapper: createWrapper(),
            });

            result.current.mutate(['agent-2']);

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(swarmService.addAgents).toHaveBeenCalledWith('swarm-1', ['agent-2']);
        });
    });

    describe('useRemoveAgentsFromSwarm', () => {
        it('should call removeAgents service method', async () => {
            vi.mocked(swarmService.removeAgents).mockResolvedValue({
                ...MOCK_SWARM,
                agentIds: [],
                agentCount: 0,
            });

            const { result } = renderHook(() => useRemoveAgentsFromSwarm('swarm-1'), {
                wrapper: createWrapper(),
            });

            result.current.mutate(['agent-1']);

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(swarmService.removeAgents).toHaveBeenCalledWith('swarm-1', ['agent-1']);
        });
    });
});
