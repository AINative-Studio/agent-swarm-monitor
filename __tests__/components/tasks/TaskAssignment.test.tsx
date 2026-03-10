/**
 * Tests for TaskAssignment Component
 * Refs #141 - Task Management Frontend UI
 *
 * Tests cover:
 * - Task selection interface
 * - Peer/node selection with capability matching
 * - Assignment validation
 * - Confirmation dialog
 * - Error handling
 * - Accessibility compliance (WCAG AA)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TaskAssignment from '@/components/tasks/TaskAssignment';

// Mock the task service
vi.mock('@/lib/task-service', () => ({
    default: {
        assignTask: vi.fn(),
        getAvailablePeers: vi.fn(),
    },
}));

const mockTask = {
    id: 'task-123',
    taskId: 'task-123',
    taskType: 'code_generation',
    status: 'QUEUED',
    priority: 'NORMAL',
    payload: { model: 'claude-3-opus' },
    requiredCapabilities: {
        gpu: 'nvidia-a100',
        memory: '16GB',
    },
    assignedPeerId: null,
    result: null,
    errorMessage: null,
    retryCount: 0,
    maxRetries: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
};

const mockPeers = [
    {
        id: 'peer-1',
        peerId: '12D3KooWTest1',
        name: 'Node Alpha',
        capabilities: {
            gpu: 'nvidia-a100',
            memory: '32GB',
            cpu: '16-core',
        },
        isOnline: true,
        currentLoad: 0.3,
    },
    {
        id: 'peer-2',
        peerId: '12D3KooWTest2',
        name: 'Node Beta',
        capabilities: {
            gpu: 'nvidia-v100',
            memory: '16GB',
            cpu: '8-core',
        },
        isOnline: true,
        currentLoad: 0.7,
    },
    {
        id: 'peer-3',
        peerId: '12D3KooWTest3',
        name: 'Node Gamma',
        capabilities: {
            memory: '8GB',
            cpu: '4-core',
        },
        isOnline: false,
        currentLoad: 0,
    },
];

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

describe('TaskAssignment', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Component Rendering', () => {
        it('should render task details', async () => {
            const taskService = await import('@/lib/task-service');
            vi.mocked(taskService.default.getAvailablePeers).mockResolvedValue(mockPeers);

            render(
                <TaskAssignment task={mockTask} onAssignmentComplete={vi.fn()} />,
                { wrapper: createWrapper() }
            );

            expect(screen.getByText(/assign task/i)).toBeInTheDocument();
            expect(screen.getByText(/task-123/i)).toBeInTheDocument();
            expect(screen.getByText(/code_generation/i)).toBeInTheDocument();
        });

        it('should load and display available peers', async () => {
            const taskService = await import('@/lib/task-service');
            vi.mocked(taskService.default.getAvailablePeers).mockResolvedValue(mockPeers);

            render(
                <TaskAssignment task={mockTask} onAssignmentComplete={vi.fn()} />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(screen.getByText(/node alpha/i)).toBeInTheDocument();
                expect(screen.getByText(/node beta/i)).toBeInTheDocument();
                expect(screen.getByText(/node gamma/i)).toBeInTheDocument();
            });
        });

        it('should have proper ARIA labels', async () => {
            const taskService = await import('@/lib/task-service');
            vi.mocked(taskService.default.getAvailablePeers).mockResolvedValue(mockPeers);

            render(
                <TaskAssignment task={mockTask} onAssignmentComplete={vi.fn()} />,
                { wrapper: createWrapper() }
            );

            expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', /assign task/i);
            expect(screen.getByLabelText(/select node/i)).toBeInTheDocument();
        });
    });

    describe('Capability Matching', () => {
        it('should highlight peers matching required capabilities', async () => {
            const taskService = await import('@/lib/task-service');
            vi.mocked(taskService.default.getAvailablePeers).mockResolvedValue(mockPeers);

            render(
                <TaskAssignment task={mockTask} onAssignmentComplete={vi.fn()} />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                const alphaNode = screen.getByTestId('peer-peer-1');
                expect(alphaNode).toHaveClass('capability-match');
                expect(within(alphaNode).getByTestId('match-indicator')).toBeInTheDocument();
            });
        });

        it('should show capability mismatch warnings', async () => {
            const taskService = await import('@/lib/task-service');
            vi.mocked(taskService.default.getAvailablePeers).mockResolvedValue(mockPeers);

            render(
                <TaskAssignment task={mockTask} onAssignmentComplete={vi.fn()} />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                const betaNode = screen.getByTestId('peer-peer-2');
                expect(within(betaNode).getByText(/capability mismatch/i)).toBeInTheDocument();
                expect(within(betaNode).getByText(/gpu: nvidia-v100/i)).toBeInTheDocument();
            });
        });

        it('should filter out offline peers by default', async () => {
            const taskService = await import('@/lib/task-service');
            vi.mocked(taskService.default.getAvailablePeers).mockResolvedValue(mockPeers);

            render(
                <TaskAssignment task={mockTask} onAssignmentComplete={vi.fn()} />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(screen.getByText(/node alpha/i)).toBeInTheDocument();
                expect(screen.getByText(/node beta/i)).toBeInTheDocument();
            });

            // Offline node should be hidden or marked
            const gammaNode = screen.queryByTestId('peer-peer-3');
            if (gammaNode) {
                expect(gammaNode).toHaveAttribute('aria-disabled', 'true');
            }
        });

        it('should show toggle to include offline peers', async () => {
            const user = userEvent.setup();
            const taskService = await import('@/lib/task-service');
            vi.mocked(taskService.default.getAvailablePeers).mockResolvedValue(mockPeers);

            render(
                <TaskAssignment task={mockTask} onAssignmentComplete={vi.fn()} />,
                { wrapper: createWrapper() }
            );

            const showOfflineToggle = screen.getByLabelText(/show offline peers/i);
            await user.click(showOfflineToggle);

            await waitFor(() => {
                expect(screen.getByText(/node gamma/i)).toBeInTheDocument();
                expect(screen.getByTestId('peer-peer-3')).toHaveClass('offline');
            });
        });
    });

    describe('Peer Selection', () => {
        it('should allow selecting a peer', async () => {
            const user = userEvent.setup();
            const taskService = await import('@/lib/task-service');
            vi.mocked(taskService.default.getAvailablePeers).mockResolvedValue(mockPeers);

            render(
                <TaskAssignment task={mockTask} onAssignmentComplete={vi.fn()} />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(screen.getByText(/node alpha/i)).toBeInTheDocument();
            });

            const alphaNode = screen.getByTestId('peer-peer-1');
            await user.click(alphaNode);

            expect(alphaNode).toHaveAttribute('aria-selected', 'true');
            expect(screen.getByRole('button', { name: /assign to node alpha/i })).toBeEnabled();
        });

        it('should show peer details on hover', async () => {
            const user = userEvent.setup();
            const taskService = await import('@/lib/task-service');
            vi.mocked(taskService.default.getAvailablePeers).mockResolvedValue(mockPeers);

            render(
                <TaskAssignment task={mockTask} onAssignmentComplete={vi.fn()} />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(screen.getByText(/node alpha/i)).toBeInTheDocument();
            });

            const alphaNode = screen.getByTestId('peer-peer-1');
            await user.hover(alphaNode);

            await waitFor(() => {
                expect(screen.getByTestId('peer-details-tooltip')).toBeInTheDocument();
                expect(screen.getByText(/current load: 30%/i)).toBeInTheDocument();
            });
        });

        it('should support keyboard navigation for peer selection', async () => {
            const user = userEvent.setup();
            const taskService = await import('@/lib/task-service');
            vi.mocked(taskService.default.getAvailablePeers).mockResolvedValue(mockPeers);

            render(
                <TaskAssignment task={mockTask} onAssignmentComplete={vi.fn()} />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(screen.getByText(/node alpha/i)).toBeInTheDocument();
            });

            // Tab to first peer
            await user.tab();
            const alphaNode = screen.getByTestId('peer-peer-1');
            expect(alphaNode).toHaveFocus();

            // Use Enter to select
            await user.keyboard('{Enter}');
            expect(alphaNode).toHaveAttribute('aria-selected', 'true');
        });
    });

    describe('Load Balancing Indicators', () => {
        it('should show visual load indicators', async () => {
            const taskService = await import('@/lib/task-service');
            vi.mocked(taskService.default.getAvailablePeers).mockResolvedValue(mockPeers);

            render(
                <TaskAssignment task={mockTask} onAssignmentComplete={vi.fn()} />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                const alphaNode = screen.getByTestId('peer-peer-1');
                const loadBar = within(alphaNode).getByRole('progressbar');
                expect(loadBar).toHaveAttribute('aria-valuenow', '30');
                expect(loadBar).toHaveAttribute('aria-valuemax', '100');
            });
        });

        it('should warn when assigning to high-load peers', async () => {
            const user = userEvent.setup();
            const taskService = await import('@/lib/task-service');
            vi.mocked(taskService.default.getAvailablePeers).mockResolvedValue(mockPeers);

            render(
                <TaskAssignment task={mockTask} onAssignmentComplete={vi.fn()} />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(screen.getByText(/node beta/i)).toBeInTheDocument();
            });

            const betaNode = screen.getByTestId('peer-peer-2');
            await user.click(betaNode);

            await waitFor(() => {
                expect(screen.getByRole('alert')).toHaveTextContent(/high load: 70%/i);
            });
        });

        it('should suggest optimal peer based on load and capabilities', async () => {
            const taskService = await import('@/lib/task-service');
            vi.mocked(taskService.default.getAvailablePeers).mockResolvedValue(mockPeers);

            render(
                <TaskAssignment task={mockTask} onAssignmentComplete={vi.fn()} />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                const alphaNode = screen.getByTestId('peer-peer-1');
                expect(within(alphaNode).getByTestId('recommended-badge')).toBeInTheDocument();
            });
        });
    });

    describe('Assignment Confirmation', () => {
        it('should show confirmation dialog before assignment', async () => {
            const user = userEvent.setup();
            const taskService = await import('@/lib/task-service');
            vi.mocked(taskService.default.getAvailablePeers).mockResolvedValue(mockPeers);

            render(
                <TaskAssignment task={mockTask} onAssignmentComplete={vi.fn()} />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(screen.getByText(/node alpha/i)).toBeInTheDocument();
            });

            const alphaNode = screen.getByTestId('peer-peer-1');
            await user.click(alphaNode);

            const assignButton = screen.getByRole('button', { name: /assign to node alpha/i });
            await user.click(assignButton);

            await waitFor(() => {
                expect(screen.getByRole('alertdialog')).toBeInTheDocument();
                expect(screen.getByText(/confirm assignment/i)).toBeInTheDocument();
                expect(screen.getByText(/node alpha/i)).toBeInTheDocument();
                expect(screen.getByText(/task-123/i)).toBeInTheDocument();
            });
        });

        it('should complete assignment on confirmation', async () => {
            const user = userEvent.setup();
            const onAssignmentComplete = vi.fn();
            const taskService = await import('@/lib/task-service');
            vi.mocked(taskService.default.getAvailablePeers).mockResolvedValue(mockPeers);
            vi.mocked(taskService.default.assignTask).mockResolvedValue({
                ...mockTask,
                status: 'LEASED',
                assignedPeerId: 'peer-1',
            });

            render(
                <TaskAssignment task={mockTask} onAssignmentComplete={onAssignmentComplete} />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(screen.getByText(/node alpha/i)).toBeInTheDocument();
            });

            // Select peer
            await user.click(screen.getByTestId('peer-peer-1'));

            // Click assign
            await user.click(screen.getByRole('button', { name: /assign to node alpha/i }));

            // Confirm
            await waitFor(() => {
                expect(screen.getByRole('alertdialog')).toBeInTheDocument();
            });

            await user.click(screen.getByRole('button', { name: /confirm/i }));

            await waitFor(() => {
                expect(taskService.default.assignTask).toHaveBeenCalledWith('task-123', 'peer-1');
                expect(onAssignmentComplete).toHaveBeenCalled();
            });
        });

        it('should cancel assignment on cancel button', async () => {
            const user = userEvent.setup();
            const onAssignmentComplete = vi.fn();
            const taskService = await import('@/lib/task-service');
            vi.mocked(taskService.default.getAvailablePeers).mockResolvedValue(mockPeers);

            render(
                <TaskAssignment task={mockTask} onAssignmentComplete={onAssignmentComplete} />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(screen.getByText(/node alpha/i)).toBeInTheDocument();
            });

            await user.click(screen.getByTestId('peer-peer-1'));
            await user.click(screen.getByRole('button', { name: /assign to node alpha/i }));

            await waitFor(() => {
                expect(screen.getByRole('alertdialog')).toBeInTheDocument();
            });

            await user.click(screen.getByRole('button', { name: /cancel/i }));

            await waitFor(() => {
                expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
                expect(taskService.default.assignTask).not.toHaveBeenCalled();
                expect(onAssignmentComplete).not.toHaveBeenCalled();
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle assignment errors gracefully', async () => {
            const user = userEvent.setup();
            const taskService = await import('@/lib/task-service');
            vi.mocked(taskService.default.getAvailablePeers).mockResolvedValue(mockPeers);
            vi.mocked(taskService.default.assignTask).mockRejectedValue(
                new Error('Peer is offline')
            );

            render(
                <TaskAssignment task={mockTask} onAssignmentComplete={vi.fn()} />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(screen.getByText(/node alpha/i)).toBeInTheDocument();
            });

            await user.click(screen.getByTestId('peer-peer-1'));
            await user.click(screen.getByRole('button', { name: /assign to node alpha/i }));
            await user.click(screen.getByRole('button', { name: /confirm/i }));

            await waitFor(() => {
                expect(screen.getByRole('alert')).toHaveTextContent(/peer is offline/i);
            });
        });

        it('should handle peer fetch errors', async () => {
            const taskService = await import('@/lib/task-service');
            vi.mocked(taskService.default.getAvailablePeers).mockRejectedValue(
                new Error('Failed to fetch peers')
            );

            render(
                <TaskAssignment task={mockTask} onAssignmentComplete={vi.fn()} />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(screen.getByText(/failed to load peers/i)).toBeInTheDocument();
                expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
            });
        });

        it('should allow retrying after error', async () => {
            const user = userEvent.setup();
            const taskService = await import('@/lib/task-service');
            vi.mocked(taskService.default.getAvailablePeers)
                .mockRejectedValueOnce(new Error('Failed'))
                .mockResolvedValueOnce(mockPeers);

            render(
                <TaskAssignment task={mockTask} onAssignmentComplete={vi.fn()} />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
            });

            await user.click(screen.getByRole('button', { name: /retry/i }));

            await waitFor(() => {
                expect(screen.getByText(/node alpha/i)).toBeInTheDocument();
            });
        });
    });

    describe('Accessibility Compliance', () => {
        it('should have no accessibility violations', async () => {
            const taskService = await import('@/lib/task-service');
            vi.mocked(taskService.default.getAvailablePeers).mockResolvedValue(mockPeers);

            const { container } = render(
                <TaskAssignment task={mockTask} onAssignmentComplete={vi.fn()} />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(screen.getByText(/node alpha/i)).toBeInTheDocument();
            });

            // Check dialog has proper role and labels
            const dialog = screen.getByRole('dialog');
            expect(dialog).toHaveAttribute('aria-label');

            // All interactive elements should be keyboard accessible
            const peers = container.querySelectorAll('[data-testid^="peer-"]');
            peers.forEach((peer) => {
                expect(peer).toHaveAttribute('tabindex', '0');
                expect(peer).toHaveAttribute('role', 'button');
            });
        });

        it('should announce selection changes to screen readers', async () => {
            const user = userEvent.setup();
            const taskService = await import('@/lib/task-service');
            vi.mocked(taskService.default.getAvailablePeers).mockResolvedValue(mockPeers);

            render(
                <TaskAssignment task={mockTask} onAssignmentComplete={vi.fn()} />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(screen.getByText(/node alpha/i)).toBeInTheDocument();
            });

            await user.click(screen.getByTestId('peer-peer-1'));

            const announcement = screen.getByRole('status', { name: /selection announcement/i });
            expect(announcement).toHaveTextContent(/node alpha selected/i);
        });
    });
});
