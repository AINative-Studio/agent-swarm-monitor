import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AgentMonitoringDashboard from '@/components/monitoring/AgentMonitoringDashboard';
import * as useMonitoringModule from '@/hooks/useMonitoring';
import type { AgentMonitoringResponse } from '@/types/monitoring';

vi.mock('@/hooks/useMonitoring', () => ({
    useAgentMonitoring: vi.fn(),
}));

const mockAgentMonitoringData: AgentMonitoringResponse = {
    timestamp: '2024-01-15T10:30:00Z',
    totalAgents: 3,
    healthyAgents: 2,
    degradedAgents: 1,
    unhealthyAgents: 0,
    offlineAgents: 0,
    agents: [
        {
            agentId: 'agent-1',
            agentName: 'Customer Support Agent',
            status: 'healthy',
            uptime: 86400000,
            uptimePercent: 99.8,
            lastSeenAt: '2024-01-15T10:29:00Z',
            tasks: {
                total: 1500,
                successful: 1480,
                failed: 15,
                pending: 5,
                avgDurationMs: 2500,
            },
            performance: {
                successRate: 98.67,
                errorRate: 1.0,
                tasksPerHour: 62.5,
                avgResponseTimeMs: 2500,
            },
            resources: {
                cpuPercent: 35.5,
                memoryMb: 512,
                memoryPercent: 25.6,
            },
            recentTasks: [
                {
                    taskId: 'task-1',
                    timestamp: '2024-01-15T10:28:00Z',
                    status: 'success',
                    durationMs: 2300,
                    description: 'Handle customer inquiry',
                },
                {
                    taskId: 'task-2',
                    timestamp: '2024-01-15T10:27:00Z',
                    status: 'success',
                    durationMs: 2100,
                    description: 'Process support ticket',
                },
            ],
            alerts: [
                {
                    id: 'alert-1',
                    severity: 'warning',
                    message: 'High CPU usage detected',
                    timestamp: '2024-01-15T10:25:00Z',
                    resolved: false,
                },
            ],
            errorLog: [
                {
                    timestamp: '2024-01-15T09:00:00Z',
                    message: 'Task timeout',
                    taskId: 'task-100',
                },
            ],
        },
        {
            agentId: 'agent-2',
            agentName: 'Sales Outreach Agent',
            status: 'degraded',
            uptime: 82800000,
            uptimePercent: 95.5,
            lastSeenAt: '2024-01-15T10:28:00Z',
            tasks: {
                total: 500,
                successful: 450,
                failed: 40,
                pending: 10,
                avgDurationMs: 3500,
            },
            performance: {
                successRate: 90.0,
                errorRate: 8.0,
                tasksPerHour: 20.8,
                avgResponseTimeMs: 3500,
            },
            resources: {
                cpuPercent: 65.2,
                memoryMb: 768,
                memoryPercent: 38.4,
            },
            recentTasks: [
                {
                    taskId: 'task-3',
                    timestamp: '2024-01-15T10:26:00Z',
                    status: 'error',
                    durationMs: 5000,
                    description: 'Send outreach email',
                },
            ],
            alerts: [
                {
                    id: 'alert-2',
                    severity: 'error',
                    message: 'Error rate above threshold',
                    timestamp: '2024-01-15T10:20:00Z',
                    resolved: false,
                },
            ],
            errorLog: [
                {
                    timestamp: '2024-01-15T10:26:00Z',
                    message: 'API rate limit exceeded',
                    taskId: 'task-3',
                },
            ],
        },
        {
            agentId: 'agent-3',
            agentName: 'DevOps Agent',
            status: 'healthy',
            uptime: 90000000,
            uptimePercent: 100.0,
            lastSeenAt: '2024-01-15T10:29:30Z',
            tasks: {
                total: 800,
                successful: 795,
                failed: 5,
                pending: 0,
                avgDurationMs: 1500,
            },
            performance: {
                successRate: 99.38,
                errorRate: 0.63,
                tasksPerHour: 33.3,
                avgResponseTimeMs: 1500,
            },
            resources: {
                cpuPercent: 12.5,
                memoryMb: 256,
                memoryPercent: 12.8,
            },
            recentTasks: [
                {
                    taskId: 'task-4',
                    timestamp: '2024-01-15T10:29:00Z',
                    status: 'success',
                    durationMs: 1400,
                    description: 'Deploy to staging',
                },
            ],
            alerts: [],
            errorLog: [],
        },
    ],
};

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
        },
    });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
}

describe('AgentMonitoringDashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Loading State', () => {
        it('should display loading skeleton while fetching data', () => {
            vi.mocked(useMonitoringModule.useAgentMonitoring).mockReturnValue({
                data: undefined,
                isLoading: true,
                error: null,
            } as any);

            render(<AgentMonitoringDashboard />, { wrapper: createWrapper() });

            expect(screen.getByText(/agent monitoring/i)).toBeInTheDocument();
            const skeletons = screen.getAllByRole('generic');
            expect(skeletons.length).toBeGreaterThan(0);
        });
    });

    describe('Summary Cards', () => {
        beforeEach(() => {
            vi.mocked(useMonitoringModule.useAgentMonitoring).mockReturnValue({
                data: mockAgentMonitoringData,
                isLoading: false,
                error: null,
            } as any);
        });

        it('should render summary cards with correct agent counts', async () => {
            render(<AgentMonitoringDashboard />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByText('3')).toBeInTheDocument();
                expect(screen.getByText('2')).toBeInTheDocument();
                expect(screen.getByText('1')).toBeInTheDocument();
            });
        });

        it('should display total agents count', async () => {
            render(<AgentMonitoringDashboard />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByText(/total agents/i)).toBeInTheDocument();
            });
        });

        it('should display healthy agents count', async () => {
            render(<AgentMonitoringDashboard />, { wrapper: createWrapper() });

            await waitFor(() => {
                const healthyElements = screen.getAllByText(/healthy/i);
                expect(healthyElements.length).toBeGreaterThan(0);
            });
        });

        it('should display degraded agents count', async () => {
            render(<AgentMonitoringDashboard />, { wrapper: createWrapper() });

            await waitFor(() => {
                const degradedElements = screen.getAllByText(/degraded/i);
                expect(degradedElements.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Agent List', () => {
        beforeEach(() => {
            vi.mocked(useMonitoringModule.useAgentMonitoring).mockReturnValue({
                data: mockAgentMonitoringData,
                isLoading: false,
                error: null,
            } as any);
        });

        it('should render list of all agents', async () => {
            render(<AgentMonitoringDashboard />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByText('Customer Support Agent')).toBeInTheDocument();
                expect(screen.getByText('Sales Outreach Agent')).toBeInTheDocument();
                expect(screen.getByText('DevOps Agent')).toBeInTheDocument();
            });
        });

        it('should display agent status badges', async () => {
            render(<AgentMonitoringDashboard />, { wrapper: createWrapper() });

            await waitFor(() => {
                const healthyBadges = screen.getAllByText(/healthy/i);
                expect(healthyBadges.length).toBeGreaterThan(0);

                const degradedBadges = screen.getAllByText(/degraded/i);
                expect(degradedBadges.length).toBeGreaterThan(0);
            });
        });

        it('should display uptime percentage for each agent', async () => {
            render(<AgentMonitoringDashboard />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByText(/99\.8%/)).toBeInTheDocument();
                expect(screen.getByText(/95\.5%/)).toBeInTheDocument();
                expect(screen.getByText(/100\.0%/)).toBeInTheDocument();
            });
        });

        it('should display task counts for each agent', async () => {
            render(<AgentMonitoringDashboard />, { wrapper: createWrapper() });

            await waitFor(() => {
                const tasksText = screen.getAllByText(/Tasks:/i);
                expect(tasksText.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Performance Charts', () => {
        beforeEach(() => {
            vi.mocked(useMonitoringModule.useAgentMonitoring).mockReturnValue({
                data: mockAgentMonitoringData,
                isLoading: false,
                error: null,
            } as any);
        });

        it('should render success rate chart', async () => {
            render(<AgentMonitoringDashboard />, { wrapper: createWrapper() });

            await waitFor(() => {
                const successRateElements = screen.getAllByText(/success rate/i);
                expect(successRateElements.length).toBeGreaterThan(0);
            });
        });

        it('should render error rate chart', async () => {
            render(<AgentMonitoringDashboard />, { wrapper: createWrapper() });

            await waitFor(() => {
                const errorRateElements = screen.getAllByText(/error rate/i);
                expect(errorRateElements.length).toBeGreaterThan(0);
            });
        });

        it('should render tasks per hour chart', async () => {
            render(<AgentMonitoringDashboard />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByText(/tasks per hour/i)).toBeInTheDocument();
            });
        });

        it('should render response time chart', async () => {
            render(<AgentMonitoringDashboard />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByText(/response time/i)).toBeInTheDocument();
            });
        });
    });

    describe('Recent Tasks Timeline', () => {
        beforeEach(() => {
            vi.mocked(useMonitoringModule.useAgentMonitoring).mockReturnValue({
                data: mockAgentMonitoringData,
                isLoading: false,
                error: null,
            } as any);
        });

        it('should display recent tasks section', async () => {
            render(<AgentMonitoringDashboard />, { wrapper: createWrapper() });

            await waitFor(() => {
                const recentTasksElements = screen.getAllByText(/recent tasks/i);
                expect(recentTasksElements.length).toBeGreaterThan(0);
            });
        });

        it('should show task descriptions', async () => {
            render(<AgentMonitoringDashboard />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByText(/handle customer inquiry/i)).toBeInTheDocument();
                expect(screen.getByText(/process support ticket/i)).toBeInTheDocument();
            });
        });

        it('should display task status indicators', async () => {
            render(<AgentMonitoringDashboard />, { wrapper: createWrapper() });

            await waitFor(() => {
                const successBadges = screen.getAllByText(/success/i);
                expect(successBadges.length).toBeGreaterThan(0);
            });
        });

        it('should show task duration', async () => {
            render(<AgentMonitoringDashboard />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByText(/2\.3s/i)).toBeInTheDocument();
                expect(screen.getByText(/2\.1s/i)).toBeInTheDocument();
            });
        });
    });

    describe('Alerts and Errors', () => {
        beforeEach(() => {
            vi.mocked(useMonitoringModule.useAgentMonitoring).mockReturnValue({
                data: mockAgentMonitoringData,
                isLoading: false,
                error: null,
            } as any);
        });

        it('should display alerts section', async () => {
            render(<AgentMonitoringDashboard />, { wrapper: createWrapper() });

            await waitFor(() => {
                const alertsElements = screen.getAllByText(/alerts/i);
                expect(alertsElements.length).toBeGreaterThan(0);
            });
        });

        it('should show alert messages', async () => {
            render(<AgentMonitoringDashboard />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByText(/high cpu usage detected/i)).toBeInTheDocument();
                expect(screen.getByText(/error rate above threshold/i)).toBeInTheDocument();
            });
        });

        it('should display alert severity badges', async () => {
            render(<AgentMonitoringDashboard />, { wrapper: createWrapper() });

            await waitFor(() => {
                const warningBadges = screen.getAllByText(/warning/i);
                expect(warningBadges.length).toBeGreaterThan(0);
                const errorBadges = screen.getAllByText(/error/i);
                expect(errorBadges.length).toBeGreaterThan(0);
            });
        });

        it('should show error log entries', async () => {
            render(<AgentMonitoringDashboard />, { wrapper: createWrapper() });

            await waitFor(() => {
                const taskTimeoutElements = screen.getAllByText(/task timeout/i);
                expect(taskTimeoutElements.length).toBeGreaterThan(0);
                const rateLimitElements = screen.getAllByText(/api rate limit exceeded/i);
                expect(rateLimitElements.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Resource Utilization', () => {
        beforeEach(() => {
            vi.mocked(useMonitoringModule.useAgentMonitoring).mockReturnValue({
                data: mockAgentMonitoringData,
                isLoading: false,
                error: null,
            } as any);
        });

        it('should display CPU usage for agents', async () => {
            render(<AgentMonitoringDashboard />, { wrapper: createWrapper() });

            await waitFor(() => {
                const cpuPercentages = screen.getAllByText(/35\.5%|65\.2%|12\.5%/);
                expect(cpuPercentages.length).toBeGreaterThanOrEqual(3);
            });
        });

        it('should display memory usage for agents', async () => {
            render(<AgentMonitoringDashboard />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByText(/512 MB/i)).toBeInTheDocument();
                expect(screen.getByText(/768 MB/i)).toBeInTheDocument();
                expect(screen.getByText(/256 MB/i)).toBeInTheDocument();
            });
        });
    });

    describe('Filtering and Sorting', () => {
        beforeEach(() => {
            vi.mocked(useMonitoringModule.useAgentMonitoring).mockReturnValue({
                data: mockAgentMonitoringData,
                isLoading: false,
                error: null,
            } as any);
        });

        it('should have filter dropdown for agent status', async () => {
            render(<AgentMonitoringDashboard />, { wrapper: createWrapper() });

            await waitFor(() => {
                const filterSelect = screen.getByLabelText(/filter/i);
                expect(filterSelect).toBeInTheDocument();
            });
        });

        it('should filter agents by status when filter is applied', async () => {
            const user = userEvent.setup();
            render(<AgentMonitoringDashboard />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByText('Customer Support Agent')).toBeInTheDocument();
            });

            const filterSelect = screen.getByLabelText(/filter/i);
            await user.selectOptions(filterSelect, 'healthy');

            await waitFor(() => {
                expect(screen.getByText('Customer Support Agent')).toBeInTheDocument();
                expect(screen.getByText('DevOps Agent')).toBeInTheDocument();
                expect(screen.queryByText('Sales Outreach Agent')).not.toBeInTheDocument();
            });
        });

        it('should have sort dropdown', async () => {
            render(<AgentMonitoringDashboard />, { wrapper: createWrapper() });

            await waitFor(() => {
                const sortSelect = screen.getByLabelText(/sort/i);
                expect(sortSelect).toBeInTheDocument();
            });
        });

        it('should sort agents by success rate', async () => {
            const user = userEvent.setup();
            render(<AgentMonitoringDashboard />, { wrapper: createWrapper() });

            const sortSelect = screen.getByLabelText(/sort/i);
            await user.selectOptions(sortSelect, 'successRate');

            await waitFor(() => {
                const agentHeaders = screen.getAllByRole('heading', { level: 3 });
                expect(agentHeaders[0]).toHaveTextContent('DevOps Agent');
            });
        });
    });

    describe('Accessibility', () => {
        beforeEach(() => {
            vi.mocked(useMonitoringModule.useAgentMonitoring).mockReturnValue({
                data: mockAgentMonitoringData,
                isLoading: false,
                error: null,
            } as any);
        });

        it('should have proper ARIA labels for dashboard sections', async () => {
            render(<AgentMonitoringDashboard />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByRole('region', { name: /summary/i })).toBeInTheDocument();
                expect(screen.getByRole('region', { name: /agents/i })).toBeInTheDocument();
            });
        });

        it('should support keyboard navigation for filters', async () => {
            render(<AgentMonitoringDashboard />, { wrapper: createWrapper() });

            const filterSelect = screen.getByLabelText(/filter/i);
            expect(filterSelect).toHaveAttribute('aria-label');
        });
    });

    describe('Error Handling', () => {
        it('should display error message when data fetch fails', async () => {
            vi.mocked(useMonitoringModule.useAgentMonitoring).mockReturnValue({
                data: undefined,
                isLoading: false,
                error: new Error('Failed to fetch agent monitoring data'),
            } as any);

            render(<AgentMonitoringDashboard />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
            });
        });

        it('should show empty state when no agents are available', async () => {
            vi.mocked(useMonitoringModule.useAgentMonitoring).mockReturnValue({
                data: { ...mockAgentMonitoringData, agents: [], totalAgents: 0 },
                isLoading: false,
                error: null,
            } as any);

            render(<AgentMonitoringDashboard />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByText(/no agents found/i)).toBeInTheDocument();
            });
        });
    });

    describe('Real-time Updates', () => {
        beforeEach(() => {
            vi.mocked(useMonitoringModule.useAgentMonitoring).mockReturnValue({
                data: mockAgentMonitoringData,
                isLoading: false,
                error: null,
            } as any);
        });

        it('should display last updated timestamp', async () => {
            render(<AgentMonitoringDashboard />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByText(/last updated/i)).toBeInTheDocument();
            });
        });
    });
});
