/**
 * Integration Tests for Complete Task Management Workflow
 * Refs #141 - Task Management Frontend UI
 *
 * Tests cover end-to-end user flows:
 * - Create task → View in list → Assign to peer → Monitor status → View completion
 * - Multiple tasks with different priorities
 * - Error recovery flows
 * - Real-time update integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TasksClient from '@/app/tasks/TasksClient';

// Mock services
vi.mock('@/lib/task-service', () => ({
    default: {
        createTask: vi.fn(),
        assignTask: vi.fn(),
        getTaskQueue: vi.fn(),
        getTaskStats: vi.fn(),
        getAvailablePeers: vi.fn(),
    },
}));

vi.mock('@/hooks/useTaskUpdates', () => ({
    useTaskUpdates: vi.fn(() => ({
        isConnected: true,
        updates: [],
        error: null,
        useFallbackPolling: false,
    })),
}));

const mockTasks = [
    {
        id: 'task-1',
        taskId: 'task-1',
        taskType: 'code_generation',
        status: 'QUEUED',
        priority: 'NORMAL',
        payload: { model: 'claude-3-opus' },
        requiredCapabilities: { gpu: 'nvidia-a100' },
        assignedPeerId: null,
        result: null,
        errorMessage: null,
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null,
    },
];

const mockPeers = [
    {
        id: 'peer-1',
        peerId: '12D3KooWTest1',
        name: 'Node Alpha',
        capabilities: { gpu: 'nvidia-a100', memory: '32GB' },
        isOnline: true,
        currentLoad: 0.3,
    },
];

const mockStats = {
    totalTasks: 1,
    tasksByStatus: {
        QUEUED: 1,
        LEASED: 0,
        RUNNING: 0,
        COMPLETED: 0,
        FAILED: 0,
        EXPIRED: 0,
        PERMANENTLY_FAILED: 0,
    },
    tasksByPriority: [],
    tasksByType: [],
    queueDepthTimeSeries: [],
    averageExecutionTimeSeconds: null,
    averageRetryCount: null,
    successRate: null,
};

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
};

describe('Task Management Workflow Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Complete Task Lifecycle', () => {
        it('should handle full task lifecycle: create → assign → complete', async () => {
            const user = userEvent.setup();
            const taskService = await import('@/lib/task-service');

            // Setup mocks
            vi.mocked(taskService.default.getTaskQueue).mockResolvedValue({
                tasks: mockTasks,
                totalCount: 1,
                limit: 50,
                offset: 0,
            });
            vi.mocked(taskService.default.getTaskStats).mockResolvedValue(mockStats);
            vi.mocked(taskService.default.createTask).mockResolvedValue({
                ...mockTasks[0],
                id: 'task-new',
                taskId: 'task-new',
            });
            vi.mocked(taskService.default.getAvailablePeers).mockResolvedValue(mockPeers);
            vi.mocked(taskService.default.assignTask).mockResolvedValue({
                ...mockTasks[0],
                status: 'LEASED',
                assignedPeerId: 'peer-1',
            });

            render(<TasksClient />, { wrapper: createWrapper() });

            // Wait for initial load
            await waitFor(() => {
                expect(screen.getByText(/task-1/i)).toBeInTheDocument();
            });

            // Step 1: Create new task
            const createButton = screen.getByRole('button', { name: /create task/i });
            await user.click(createButton);

            await waitFor(() => {
                expect(screen.getByRole('dialog', { name: /create new task/i })).toBeInTheDocument();
            });

            await user.type(screen.getByLabelText(/task type/i), 'api_request');
            await user.type(screen.getByLabelText(/payload/i), '{"url": "https://api.example.com"}');
            await user.click(screen.getByRole('button', { name: /create task/i }));

            await waitFor(() => {
                expect(taskService.default.createTask).toHaveBeenCalled();
            });

            // Step 2: View task in list (assuming refresh)
            vi.mocked(taskService.default.getTaskQueue).mockResolvedValue({
                tasks: [...mockTasks, {
                    ...mockTasks[0],
                    id: 'task-new',
                    taskId: 'task-new',
                    taskType: 'api_request',
                }],
                totalCount: 2,
                limit: 50,
                offset: 0,
            });

            // Step 3: Assign task
            const taskRow = screen.getByTestId('task-row-task-new');
            const assignButton = within(taskRow).getByRole('button', { name: /assign/i });
            await user.click(assignButton);

            await waitFor(() => {
                expect(screen.getByText(/node alpha/i)).toBeInTheDocument();
            });

            await user.click(screen.getByTestId('peer-peer-1'));
            await user.click(screen.getByRole('button', { name: /assign to node alpha/i }));
            await user.click(screen.getByRole('button', { name: /confirm/i }));

            await waitFor(() => {
                expect(taskService.default.assignTask).toHaveBeenCalledWith('task-new', 'peer-1');
            });

            // Step 4: Monitor real-time status update
            const { useTaskUpdates } = await import('@/hooks/useTaskUpdates');
            vi.mocked(useTaskUpdates).mockReturnValue({
                isConnected: true,
                updates: [
                    {
                        taskId: 'task-new',
                        status: 'RUNNING',
                        timestamp: new Date().toISOString(),
                    },
                ],
                error: null,
                useFallbackPolling: false,
            });

            // Task status should update
            await waitFor(() => {
                const updatedRow = screen.getByTestId('task-row-task-new');
                expect(within(updatedRow).getByText(/running/i)).toBeInTheDocument();
            });
        });

        it('should handle multiple concurrent tasks', async () => {
            const user = userEvent.setup();
            const taskService = await import('@/lib/task-service');

            const multipleTasks = Array.from({ length: 5 }, (_, i) => ({
                ...mockTasks[0],
                id: `task-${i}`,
                taskId: `task-${i}`,
                priority: i % 2 === 0 ? 'HIGH' : 'NORMAL',
            }));

            vi.mocked(taskService.default.getTaskQueue).mockResolvedValue({
                tasks: multipleTasks,
                totalCount: 5,
                limit: 50,
                offset: 0,
            });
            vi.mocked(taskService.default.getTaskStats).mockResolvedValue({
                ...mockStats,
                totalTasks: 5,
            });

            render(<TasksClient />, { wrapper: createWrapper() });

            await waitFor(() => {
                multipleTasks.forEach((task) => {
                    expect(screen.getByText(task.taskId)).toBeInTheDocument();
                });
            });

            // Verify priority filtering
            const priorityFilter = screen.getByLabelText(/priority/i);
            await user.click(priorityFilter);
            await user.click(screen.getByRole('option', { name: /high/i }));

            await waitFor(() => {
                expect(screen.getAllByTestId(/^task-row-/).length).toBe(3); // 3 HIGH priority tasks
            });
        });
    });

    describe('Error Recovery', () => {
        it('should retry failed task creation', async () => {
            const user = userEvent.setup();
            const taskService = await import('@/lib/task-service');

            vi.mocked(taskService.default.getTaskQueue).mockResolvedValue({
                tasks: [],
                totalCount: 0,
                limit: 50,
                offset: 0,
            });
            vi.mocked(taskService.default.getTaskStats).mockResolvedValue(mockStats);

            // First attempt fails
            vi.mocked(taskService.default.createTask)
                .mockRejectedValueOnce(new Error('Server error'))
                .mockResolvedValueOnce(mockTasks[0]);

            render(<TasksClient />, { wrapper: createWrapper() });

            const createButton = screen.getByRole('button', { name: /create task/i });
            await user.click(createButton);

            await user.type(screen.getByLabelText(/task type/i), 'test');
            await user.type(screen.getByLabelText(/payload/i), '{}');
            await user.click(screen.getByRole('button', { name: /create task/i }));

            // Should show error
            await waitFor(() => {
                expect(screen.getByRole('alert')).toHaveTextContent(/server error/i);
            });

            // Retry
            await user.click(screen.getByRole('button', { name: /retry/i }));

            await waitFor(() => {
                expect(taskService.default.createTask).toHaveBeenCalledTimes(2);
                expect(screen.queryByRole('alert')).not.toBeInTheDocument();
            });
        });

        it('should handle assignment failures gracefully', async () => {
            const user = userEvent.setup();
            const taskService = await import('@/lib/task-service');

            vi.mocked(taskService.default.getTaskQueue).mockResolvedValue({
                tasks: mockTasks,
                totalCount: 1,
                limit: 50,
                offset: 0,
            });
            vi.mocked(taskService.default.getTaskStats).mockResolvedValue(mockStats);
            vi.mocked(taskService.default.getAvailablePeers).mockResolvedValue(mockPeers);
            vi.mocked(taskService.default.assignTask).mockRejectedValue(
                new Error('Peer unavailable')
            );

            render(<TasksClient />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByText(/task-1/i)).toBeInTheDocument();
            });

            const assignButton = screen.getByRole('button', { name: /assign/i });
            await user.click(assignButton);

            await waitFor(() => {
                expect(screen.getByText(/node alpha/i)).toBeInTheDocument();
            });

            await user.click(screen.getByTestId('peer-peer-1'));
            await user.click(screen.getByRole('button', { name: /assign to node alpha/i }));
            await user.click(screen.getByRole('button', { name: /confirm/i }));

            await waitFor(() => {
                expect(screen.getByRole('alert')).toHaveTextContent(/peer unavailable/i);
            });

            // Task should remain unassigned
            expect(screen.getByText(/queued/i)).toBeInTheDocument();
        });

        it('should handle WebSocket disconnection with fallback', async () => {
            const taskService = await import('@/lib/task-service');
            const { useTaskUpdates } = await import('@/hooks/useTaskUpdates');

            vi.mocked(taskService.default.getTaskQueue).mockResolvedValue({
                tasks: mockTasks,
                totalCount: 1,
                limit: 50,
                offset: 0,
            });
            vi.mocked(taskService.default.getTaskStats).mockResolvedValue(mockStats);

            // Simulate WebSocket failure
            vi.mocked(useTaskUpdates).mockReturnValue({
                isConnected: false,
                updates: [],
                error: new Error('WebSocket unavailable'),
                useFallbackPolling: true,
            });

            render(<TasksClient />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByTestId('fallback-polling-indicator')).toBeInTheDocument();
                expect(screen.getByText(/polling mode/i)).toBeInTheDocument();
            });
        });
    });

    describe('Performance and UX', () => {
        it('should show loading states appropriately', async () => {
            const taskService = await import('@/lib/task-service');

            // Slow response
            vi.mocked(taskService.default.getTaskQueue).mockImplementation(
                () => new Promise((resolve) => setTimeout(() => resolve({
                    tasks: mockTasks,
                    totalCount: 1,
                    limit: 50,
                    offset: 0,
                }), 1000))
            );
            vi.mocked(taskService.default.getTaskStats).mockResolvedValue(mockStats);

            render(<TasksClient />, { wrapper: createWrapper() });

            // Should show loading skeleton
            expect(screen.getAllByTestId('loading-skeleton').length).toBeGreaterThan(0);

            await waitFor(() => {
                expect(screen.getByText(/task-1/i)).toBeInTheDocument();
                expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
            }, { timeout: 2000 });
        });

        it('should debounce search and filter inputs', async () => {
            const user = userEvent.setup();
            const taskService = await import('@/lib/task-service');

            vi.mocked(taskService.default.getTaskQueue).mockResolvedValue({
                tasks: mockTasks,
                totalCount: 1,
                limit: 50,
                offset: 0,
            });
            vi.mocked(taskService.default.getTaskStats).mockResolvedValue(mockStats);

            render(<TasksClient />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByText(/task-1/i)).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText(/search tasks/i);

            // Type rapidly
            await user.type(searchInput, 'test');

            // Should only call API once after debounce
            await waitFor(() => {
                expect(taskService.default.getTaskQueue).toHaveBeenCalledTimes(2); // Initial + debounced
            }, { timeout: 1000 });
        });

        it('should optimize re-renders with virtualization for large lists', async () => {
            const taskService = await import('@/lib/task-service');

            const largTaskList = Array.from({ length: 100 }, (_, i) => ({
                ...mockTasks[0],
                id: `task-${i}`,
                taskId: `task-${i}`,
            }));

            vi.mocked(taskService.default.getTaskQueue).mockResolvedValue({
                tasks: largeTaskList,
                totalCount: 100,
                limit: 50,
                offset: 0,
            });
            vi.mocked(taskService.default.getTaskStats).mockResolvedValue(mockStats);

            const { container } = render(<TasksClient />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByText(/task-0/i)).toBeInTheDocument();
            });

            // Should render only visible items (virtualization)
            const renderedRows = container.querySelectorAll('[data-testid^="task-row-"]');
            expect(renderedRows.length).toBeLessThan(100);
        });
    });

    describe('User Experience', () => {
        it('should provide clear feedback for all user actions', async () => {
            const user = userEvent.setup();
            const taskService = await import('@/lib/task-service');

            vi.mocked(taskService.default.getTaskQueue).mockResolvedValue({
                tasks: mockTasks,
                totalCount: 1,
                limit: 50,
                offset: 0,
            });
            vi.mocked(taskService.default.getTaskStats).mockResolvedValue(mockStats);
            vi.mocked(taskService.default.createTask).mockResolvedValue(mockTasks[0]);

            render(<TasksClient />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByText(/task-1/i)).toBeInTheDocument();
            });

            // Create task
            await user.click(screen.getByRole('button', { name: /create task/i }));
            await user.type(screen.getByLabelText(/task type/i), 'test');
            await user.type(screen.getByLabelText(/payload/i), '{}');
            await user.click(screen.getByRole('button', { name: /create task/i }));

            // Should show success toast
            await waitFor(() => {
                expect(screen.getByRole('status')).toHaveTextContent(/task created successfully/i);
            });
        });

        it('should maintain filter state during navigation', async () => {
            const user = userEvent.setup();
            const taskService = await import('@/lib/task-service');

            vi.mocked(taskService.default.getTaskQueue).mockResolvedValue({
                tasks: mockTasks,
                totalCount: 1,
                limit: 50,
                offset: 0,
            });
            vi.mocked(taskService.default.getTaskStats).mockResolvedValue(mockStats);

            const { unmount, rerender } = render(<TasksClient />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByText(/task-1/i)).toBeInTheDocument();
            });

            // Set filters
            const statusFilter = screen.getByLabelText(/status/i);
            await user.click(statusFilter);
            await user.click(screen.getByRole('option', { name: /queued/i }));

            // Verify filter is applied
            expect(taskService.default.getTaskQueue).toHaveBeenCalledWith(
                expect.objectContaining({ status: 'QUEUED' })
            );

            // Simulate navigation away and back
            unmount();
            rerender(<TasksClient />);

            await waitFor(() => {
                const statusFilterAgain = screen.getByLabelText(/status/i);
                expect(statusFilterAgain).toHaveTextContent(/queued/i);
            });
        });
    });
});
