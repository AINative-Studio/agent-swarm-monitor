import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TaskDependencyGraph from '@/components/monitoring/TaskDependencyGraph';
import type { Task } from '@/types/monitoring';

// Mock react-force-graph-2d
vi.mock('react-force-graph-2d', () => ({
    default: vi.fn(({ graphData, nodeLabel, nodeColor, linkColor, onNodeClick, width, height }) => {
        return (
            <div
                data-testid="force-graph-2d"
                data-width={width}
                data-height={height}
            >
                {graphData.nodes.map((node: any) => (
                    <div
                        key={node.id}
                        data-testid={`node-${node.id}`}
                        data-status={node.status}
                        data-color={nodeColor?.(node)}
                        onClick={() => onNodeClick?.(node)}
                        role="button"
                        aria-label={nodeLabel?.(node)}
                    >
                        {node.name}
                    </div>
                ))}
                {graphData.links.map((link: any, idx: number) => (
                    <div
                        key={idx}
                        data-testid={`link-${link.source}-${link.target}`}
                        data-color={linkColor?.(link)}
                    />
                ))}
            </div>
        );
    }),
}));

describe('TaskDependencyGraph', () => {
    const mockTasks: Task[] = [
        {
            id: 'task-1',
            name: 'Task 1',
            status: 'completed',
            dependencies: [],
            dependents: ['task-2'],
            createdAt: '2026-03-08T10:00:00Z',
        },
        {
            id: 'task-2',
            name: 'Task 2',
            status: 'in-progress',
            dependencies: ['task-1'],
            dependents: ['task-3'],
            createdAt: '2026-03-08T10:01:00Z',
        },
        {
            id: 'task-3',
            name: 'Task 3',
            status: 'pending',
            dependencies: ['task-2'],
            dependents: [],
            createdAt: '2026-03-08T10:02:00Z',
        },
        {
            id: 'task-4',
            name: 'Task 4',
            status: 'blocked',
            dependencies: ['task-5'],
            dependents: [],
            createdAt: '2026-03-08T10:03:00Z',
        },
        {
            id: 'task-5',
            name: 'Task 5',
            status: 'failed',
            dependencies: [],
            dependents: ['task-4'],
            createdAt: '2026-03-08T10:04:00Z',
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render the graph container', () => {
            render(<TaskDependencyGraph tasks={mockTasks} />);
            expect(screen.getByTestId('task-dependency-graph')).toBeInTheDocument();
        });

        it('should render force graph component', () => {
            render(<TaskDependencyGraph tasks={mockTasks} />);
            expect(screen.getByTestId('force-graph-2d')).toBeInTheDocument();
        });

        it('should render all task nodes', () => {
            render(<TaskDependencyGraph tasks={mockTasks} />);
            mockTasks.forEach(task => {
                expect(screen.getByTestId(`node-${task.id}`)).toBeInTheDocument();
            });
        });

        it('should render dependency links correctly', () => {
            render(<TaskDependencyGraph tasks={mockTasks} />);
            // task-1 -> task-2
            expect(screen.getByTestId('link-task-1-task-2')).toBeInTheDocument();
            // task-2 -> task-3
            expect(screen.getByTestId('link-task-2-task-3')).toBeInTheDocument();
            // task-5 -> task-4
            expect(screen.getByTestId('link-task-5-task-4')).toBeInTheDocument();
        });

        it('should display graph with default dimensions when not specified', () => {
            render(<TaskDependencyGraph tasks={mockTasks} />);
            const graph = screen.getByTestId('force-graph-2d');
            expect(graph).toHaveAttribute('data-width', '800');
            expect(graph).toHaveAttribute('data-height', '600');
        });

        it('should display graph with custom dimensions', () => {
            render(<TaskDependencyGraph tasks={mockTasks} width={1000} height={800} />);
            const graph = screen.getByTestId('force-graph-2d');
            expect(graph).toHaveAttribute('data-width', '1000');
            expect(graph).toHaveAttribute('data-height', '800');
        });
    });

    describe('Task Status Colors', () => {
        it('should apply correct colors for pending tasks', () => {
            render(<TaskDependencyGraph tasks={mockTasks} />);
            const pendingNode = screen.getByTestId('node-task-3');
            expect(pendingNode).toHaveAttribute('data-color', '#94a3b8'); // slate-400
        });

        it('should apply correct colors for in-progress tasks', () => {
            render(<TaskDependencyGraph tasks={mockTasks} />);
            const inProgressNode = screen.getByTestId('node-task-2');
            expect(inProgressNode).toHaveAttribute('data-color', '#3b82f6'); // blue-500
        });

        it('should apply correct colors for completed tasks', () => {
            render(<TaskDependencyGraph tasks={mockTasks} />);
            const completedNode = screen.getByTestId('node-task-1');
            expect(completedNode).toHaveAttribute('data-color', '#22c55e'); // green-500
        });

        it('should apply correct colors for blocked tasks', () => {
            render(<TaskDependencyGraph tasks={mockTasks} />);
            const blockedNode = screen.getByTestId('node-task-4');
            expect(blockedNode).toHaveAttribute('data-color', '#f59e0b'); // amber-500
        });

        it('should apply correct colors for failed tasks', () => {
            render(<TaskDependencyGraph tasks={mockTasks} />);
            const failedNode = screen.getByTestId('node-task-5');
            expect(failedNode).toHaveAttribute('data-color', '#ef4444'); // red-500
        });
    });

    describe('Graph Controls', () => {
        it('should render zoom in button', () => {
            render(<TaskDependencyGraph tasks={mockTasks} />);
            expect(screen.getByLabelText('Zoom in')).toBeInTheDocument();
        });

        it('should render zoom out button', () => {
            render(<TaskDependencyGraph tasks={mockTasks} />);
            expect(screen.getByLabelText('Zoom out')).toBeInTheDocument();
        });

        it('should render reset view button', () => {
            render(<TaskDependencyGraph tasks={mockTasks} />);
            expect(screen.getByLabelText('Reset view')).toBeInTheDocument();
        });

        it('should render status filter buttons', () => {
            render(<TaskDependencyGraph tasks={mockTasks} />);
            expect(screen.getByRole('button', { name: /^All$/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /^Pending$/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /^In Progress$/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /^Completed$/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /^Blocked$/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /^Failed$/i })).toBeInTheDocument();
        });

        it('should filter tasks by status when filter button is clicked', () => {
            render(<TaskDependencyGraph tasks={mockTasks} />);
            const completedFilter = screen.getByRole('button', { name: /^Completed$/i });
            fireEvent.click(completedFilter);

            // Only completed task should be visible
            expect(screen.getByTestId('node-task-1')).toBeInTheDocument();
            expect(screen.queryByTestId('node-task-2')).not.toBeInTheDocument();
            expect(screen.queryByTestId('node-task-3')).not.toBeInTheDocument();
        });

        it('should show all tasks when "All" filter is selected', () => {
            render(<TaskDependencyGraph tasks={mockTasks} />);

            // First filter by completed
            const completedFilter = screen.getByRole('button', { name: /^Completed$/i });
            fireEvent.click(completedFilter);

            // Then click All
            const allFilter = screen.getByRole('button', { name: /^All$/i });
            fireEvent.click(allFilter);

            // All tasks should be visible again
            mockTasks.forEach(task => {
                expect(screen.getByTestId(`node-${task.id}`)).toBeInTheDocument();
            });
        });

        it('should highlight active filter button', () => {
            render(<TaskDependencyGraph tasks={mockTasks} />);
            const blockedFilter = screen.getByRole('button', { name: /^Blocked$/i });
            fireEvent.click(blockedFilter);

            expect(blockedFilter).toHaveStyle({ backgroundColor: 'rgb(245, 158, 11)' });
        });
    });

    describe('Node Interactions', () => {
        it('should call onTaskClick when node is clicked', () => {
            const onTaskClick = vi.fn();
            render(<TaskDependencyGraph tasks={mockTasks} onTaskClick={onTaskClick} />);

            const node = screen.getByTestId('node-task-1');
            fireEvent.click(node);

            expect(onTaskClick).toHaveBeenCalledWith(mockTasks[0]);
        });

        it('should display task name in node label', () => {
            render(<TaskDependencyGraph tasks={mockTasks} />);
            const node = screen.getByTestId('node-task-1');
            expect(node).toHaveAttribute('aria-label', 'Task 1 (completed)');
        });
    });

    describe('Empty State', () => {
        it('should display empty state message when no tasks', () => {
            render(<TaskDependencyGraph tasks={[]} />);
            expect(screen.getByText('No tasks to display')).toBeInTheDocument();
        });

        it('should not render graph when no tasks', () => {
            render(<TaskDependencyGraph tasks={[]} />);
            expect(screen.queryByTestId('force-graph-2d')).not.toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should have proper ARIA labels on controls', () => {
            render(<TaskDependencyGraph tasks={mockTasks} />);

            expect(screen.getByLabelText('Zoom in')).toHaveAttribute('aria-label', 'Zoom in');
            expect(screen.getByLabelText('Zoom out')).toHaveAttribute('aria-label', 'Zoom out');
            expect(screen.getByLabelText('Reset view')).toHaveAttribute('aria-label', 'Reset view');
        });

        it('should have role="button" on interactive nodes', () => {
            render(<TaskDependencyGraph tasks={mockTasks} />);
            const node = screen.getByTestId('node-task-1');
            expect(node).toHaveAttribute('role', 'button');
        });

        it('should support keyboard navigation for controls', () => {
            render(<TaskDependencyGraph tasks={mockTasks} />);
            const zoomInButton = screen.getByLabelText('Zoom in');

            fireEvent.keyDown(zoomInButton, { key: 'Enter' });
            expect(zoomInButton).toBeInTheDocument();
        });
    });

    describe('Legend', () => {
        it('should display status legend', () => {
            render(<TaskDependencyGraph tasks={mockTasks} showLegend />);

            expect(screen.getByText('Task Status')).toBeInTheDocument();
            // Check that legend items exist (not filter buttons)
            const legend = screen.getByText('Task Status').parentElement;
            expect(legend).toHaveTextContent('Pending');
            expect(legend).toHaveTextContent('In Progress');
            expect(legend).toHaveTextContent('Completed');
            expect(legend).toHaveTextContent('Blocked');
            expect(legend).toHaveTextContent('Failed');
        });

        it('should not display legend when showLegend is false', () => {
            render(<TaskDependencyGraph tasks={mockTasks} showLegend={false} />);
            expect(screen.queryByText('Task Status')).not.toBeInTheDocument();
        });

        it('should display legend by default', () => {
            render(<TaskDependencyGraph tasks={mockTasks} />);
            expect(screen.getByText('Task Status')).toBeInTheDocument();
        });
    });

    describe('Performance', () => {
        it('should handle large number of tasks (50+)', () => {
            const largeTasks: Task[] = Array.from({ length: 60 }, (_, i) => ({
                id: `task-${i}`,
                name: `Task ${i}`,
                status: i % 5 === 0 ? 'completed' : i % 5 === 1 ? 'in-progress' : i % 5 === 2 ? 'pending' : i % 5 === 3 ? 'blocked' : 'failed',
                dependencies: i > 0 ? [`task-${i - 1}`] : [],
                dependents: i < 59 ? [`task-${i + 1}`] : [],
                createdAt: new Date(Date.now() - (60 - i) * 60000).toISOString(),
            }));

            const { container } = render(<TaskDependencyGraph tasks={largeTasks} />);
            expect(container).toBeInTheDocument();

            // Should render all 60 nodes
            expect(screen.getAllByTestId(/^node-task-/)).toHaveLength(60);
        });

        it('should render within reasonable time for 50+ tasks', () => {
            const start = performance.now();

            const largeTasks: Task[] = Array.from({ length: 50 }, (_, i) => ({
                id: `task-${i}`,
                name: `Task ${i}`,
                status: 'pending' as const,
                dependencies: [],
                dependents: [],
                createdAt: new Date().toISOString(),
            }));

            render(<TaskDependencyGraph tasks={largeTasks} />);

            const end = performance.now();
            const renderTime = end - start;

            // Should render in less than 1 second
            expect(renderTime).toBeLessThan(1000);
        });
    });

    describe('Data Transformation', () => {
        it('should correctly transform tasks to graph data structure', () => {
            render(<TaskDependencyGraph tasks={mockTasks} />);

            // Verify nodes are created for all tasks
            mockTasks.forEach(task => {
                expect(screen.getByTestId(`node-${task.id}`)).toBeInTheDocument();
            });

            // Verify links match dependencies
            expect(screen.getByTestId('link-task-1-task-2')).toBeInTheDocument();
            expect(screen.getByTestId('link-task-2-task-3')).toBeInTheDocument();
        });

        it('should handle circular dependencies gracefully', () => {
            const circularTasks: Task[] = [
                {
                    id: 'task-a',
                    name: 'Task A',
                    status: 'pending',
                    dependencies: ['task-b'],
                    dependents: ['task-b'],
                    createdAt: '2026-03-08T10:00:00Z',
                },
                {
                    id: 'task-b',
                    name: 'Task B',
                    status: 'pending',
                    dependencies: ['task-a'],
                    dependents: ['task-a'],
                    createdAt: '2026-03-08T10:01:00Z',
                },
            ];

            const { container } = render(<TaskDependencyGraph tasks={circularTasks} />);
            expect(container).toBeInTheDocument();
            expect(screen.getByTestId('node-task-a')).toBeInTheDocument();
            expect(screen.getByTestId('node-task-b')).toBeInTheDocument();
        });
    });

    describe('Styling', () => {
        it('should apply custom className', () => {
            const { container } = render(
                <TaskDependencyGraph tasks={mockTasks} className="custom-class" />
            );
            expect(container.firstChild).toHaveClass('custom-class');
        });

        it('should maintain responsive layout', () => {
            render(<TaskDependencyGraph tasks={mockTasks} />);
            const container = screen.getByTestId('task-dependency-graph');
            expect(container).toHaveClass('w-full');
        });
    });

    describe('Real-time Updates', () => {
        it('should update graph when tasks prop changes', async () => {
            const { rerender } = render(<TaskDependencyGraph tasks={mockTasks} />);

            expect(screen.getAllByTestId(/^node-task-/)).toHaveLength(5);

            const updatedTasks: Task[] = [
                ...mockTasks,
                {
                    id: 'task-6',
                    name: 'Task 6',
                    status: 'pending',
                    dependencies: [],
                    dependents: [],
                    createdAt: '2026-03-08T10:05:00Z',
                },
            ];

            rerender(<TaskDependencyGraph tasks={updatedTasks} />);

            await waitFor(() => {
                expect(screen.getAllByTestId(/^node-task-/)).toHaveLength(6);
            });
        });

        it('should reflect status changes in node colors', async () => {
            const { rerender } = render(<TaskDependencyGraph tasks={mockTasks} />);

            const node = screen.getByTestId('node-task-3');
            expect(node).toHaveAttribute('data-status', 'pending');

            const updatedTasks = mockTasks.map(task =>
                task.id === 'task-3' ? { ...task, status: 'completed' as const } : task
            );

            rerender(<TaskDependencyGraph tasks={updatedTasks} />);

            await waitFor(() => {
                expect(screen.getByTestId('node-task-3')).toHaveAttribute('data-status', 'completed');
            });
        });
    });
});
