import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import monitoringService from '@/lib/monitoring-service';

vi.mock('@/lib/monitoring-service', () => ({
    default: {
        getSwarmHealth: vi.fn(),
        getTimeline: vi.fn(),
        getAlertThresholds: vi.fn(),
        updateAlertThresholds: vi.fn(),
        getMonitoringStatus: vi.fn(),
    },
}));

import {
    useSwarmHealth,
    useTimeline,
    useAlertThresholds,
    useUpdateAlertThresholds,
    useMonitoringStatus,
} from '@/hooks/useMonitoring';

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

describe('Monitoring Hooks', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('useSwarmHealth', () => {
        it('should fetch swarm health data', async () => {
            const mockHealth = {
                status: 'healthy',
                timestamp: '2026-02-20T12:00:00Z',
                subsystemsAvailable: 8,
                subsystemsTotal: 8,
            };
            vi.mocked(monitoringService.getSwarmHealth).mockResolvedValue(mockHealth as ReturnType<typeof monitoringService.getSwarmHealth> extends Promise<infer T> ? T : never);

            const { result } = renderHook(() => useSwarmHealth(), {
                wrapper: createWrapper(),
            });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(result.current.data?.status).toBe('healthy');
            expect(monitoringService.getSwarmHealth).toHaveBeenCalledOnce();
        });
    });

    describe('useTimeline', () => {
        it('should fetch timeline with filters', async () => {
            const mockTimeline = {
                events: [],
                totalCount: 0,
                limit: 50,
                offset: 0,
            };
            vi.mocked(monitoringService.getTimeline).mockResolvedValue(mockTimeline as ReturnType<typeof monitoringService.getTimeline> extends Promise<infer T> ? T : never);

            const filters = { eventType: 'TASK_CREATED', limit: 50 };
            const { result } = renderHook(() => useTimeline(filters), {
                wrapper: createWrapper(),
            });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(monitoringService.getTimeline).toHaveBeenCalledWith(filters);
        });
    });

    describe('useAlertThresholds', () => {
        it('should fetch alert thresholds', async () => {
            const mockThresholds = {
                bufferUtilization: 80,
                crashCount: 3,
                revocationRate: 50,
                ipPoolUtilization: 90,
                updatedAt: '2026-02-20T12:00:00Z',
            };
            vi.mocked(monitoringService.getAlertThresholds).mockResolvedValue(mockThresholds as ReturnType<typeof monitoringService.getAlertThresholds> extends Promise<infer T> ? T : never);

            const { result } = renderHook(() => useAlertThresholds(), {
                wrapper: createWrapper(),
            });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(result.current.data?.bufferUtilization).toBe(80);
        });
    });

    describe('useUpdateAlertThresholds', () => {
        it('should call update and return result', async () => {
            const mockResult = {
                bufferUtilization: 90,
                crashCount: 3,
                revocationRate: 50,
                ipPoolUtilization: 90,
                updatedAt: '2026-02-20T12:01:00Z',
            };
            vi.mocked(monitoringService.updateAlertThresholds).mockResolvedValue(mockResult as ReturnType<typeof monitoringService.updateAlertThresholds> extends Promise<infer T> ? T : never);

            const { result } = renderHook(() => useUpdateAlertThresholds(), {
                wrapper: createWrapper(),
            });

            result.current.mutate({ bufferUtilization: 90 });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(monitoringService.updateAlertThresholds).toHaveBeenCalledWith({
                bufferUtilization: 90,
            });
        });
    });

    describe('useMonitoringStatus', () => {
        it('should fetch monitoring status', async () => {
            const mockStatus = {
                status: 'operational',
                timestamp: '2026-02-20T12:00:00Z',
                subsystems: {},
                registeredHealthSubsystems: 8,
                timelineEventCount: 42,
                bootstrapped: true,
            };
            vi.mocked(monitoringService.getMonitoringStatus).mockResolvedValue(mockStatus as ReturnType<typeof monitoringService.getMonitoringStatus> extends Promise<infer T> ? T : never);

            const { result } = renderHook(() => useMonitoringStatus(), {
                wrapper: createWrapper(),
            });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(result.current.data?.status).toBe('operational');
        });
    });
});
