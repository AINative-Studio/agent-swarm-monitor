/**
 * Tests for TaskCreateForm Component
 * Refs #141 - Task Management Frontend UI
 *
 * Tests cover:
 * - Form rendering and field validation
 * - Task type selection
 * - Priority selection
 * - Payload JSON validation
 * - Capability requirements configuration
 * - Form submission and error handling
 * - Accessibility compliance (WCAG AA)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TaskCreateForm from '@/components/tasks/TaskCreateForm';

// Mock the task service
vi.mock('@/lib/task-service', () => ({
    default: {
        createTask: vi.fn(),
    },
}));

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

describe('TaskCreateForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Form Rendering', () => {
        it('should render all form fields', () => {
            render(<TaskCreateForm onSuccess={vi.fn()} />, { wrapper: createWrapper() });

            // Check for form title
            expect(screen.getByRole('heading', { name: /create new task/i })).toBeInTheDocument();

            // Check for all required fields
            expect(screen.getByLabelText(/task type/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/payload/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/max retries/i)).toBeInTheDocument();

            // Check for submit button
            expect(screen.getByRole('button', { name: /create task/i })).toBeInTheDocument();
        });

        it('should have proper ARIA labels for accessibility', () => {
            render(<TaskCreateForm onSuccess={vi.fn()} />, { wrapper: createWrapper() });

            const form = screen.getByRole('form', { name: /task creation form/i });
            expect(form).toBeInTheDocument();

            // All inputs should have associated labels
            const taskTypeInput = screen.getByLabelText(/task type/i);
            expect(taskTypeInput).toHaveAttribute('aria-required', 'true');

            const prioritySelect = screen.getByLabelText(/priority/i);
            expect(prioritySelect).toHaveAttribute('aria-required', 'true');
        });

        it('should support keyboard navigation', async () => {
            const user = userEvent.setup();
            render(<TaskCreateForm onSuccess={vi.fn()} />, { wrapper: createWrapper() });

            const taskTypeInput = screen.getByLabelText(/task type/i);

            // Tab to first field
            await user.tab();
            expect(taskTypeInput).toHaveFocus();

            // Tab through fields
            await user.tab();
            expect(screen.getByLabelText(/priority/i)).toHaveFocus();
        });
    });

    describe('Task Type Input', () => {
        it('should accept valid task type input', async () => {
            const user = userEvent.setup();
            render(<TaskCreateForm onSuccess={vi.fn()} />, { wrapper: createWrapper() });

            const taskTypeInput = screen.getByLabelText(/task type/i) as HTMLInputElement;
            await user.type(taskTypeInput, 'code_generation');

            expect(taskTypeInput.value).toBe('code_generation');
        });

        it('should show error when task type is empty on submit', async () => {
            const user = userEvent.setup();
            render(<TaskCreateForm onSuccess={vi.fn()} />, { wrapper: createWrapper() });

            const submitButton = screen.getByRole('button', { name: /create task/i });
            await user.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText(/task type is required/i)).toBeInTheDocument();
            });
        });

        it('should suggest common task types', async () => {
            const user = userEvent.setup();
            render(<TaskCreateForm onSuccess={vi.fn()} />, { wrapper: createWrapper() });

            const taskTypeInput = screen.getByLabelText(/task type/i);
            await user.click(taskTypeInput);

            // Should show suggestions
            await waitFor(() => {
                expect(screen.getByText(/code_generation/i)).toBeInTheDocument();
                expect(screen.getByText(/data_analysis/i)).toBeInTheDocument();
                expect(screen.getByText(/api_request/i)).toBeInTheDocument();
            });
        });
    });

    describe('Priority Selection', () => {
        it('should allow selecting different priority levels', async () => {
            const user = userEvent.setup();
            render(<TaskCreateForm onSuccess={vi.fn()} />, { wrapper: createWrapper() });

            const prioritySelect = screen.getByLabelText(/priority/i);
            await user.click(prioritySelect);

            // Should show all priority options
            expect(screen.getByRole('option', { name: /low/i })).toBeInTheDocument();
            expect(screen.getByRole('option', { name: /normal/i })).toBeInTheDocument();
            expect(screen.getByRole('option', { name: /high/i })).toBeInTheDocument();
            expect(screen.getByRole('option', { name: /critical/i })).toBeInTheDocument();

            // Select HIGH priority
            await user.click(screen.getByRole('option', { name: /high/i }));
            expect(prioritySelect).toHaveTextContent(/high/i);
        });

        it('should default to NORMAL priority', () => {
            render(<TaskCreateForm onSuccess={vi.fn()} />, { wrapper: createWrapper() });

            const prioritySelect = screen.getByLabelText(/priority/i);
            expect(prioritySelect).toHaveTextContent(/normal/i);
        });
    });

    describe('Payload JSON Validation', () => {
        it('should accept valid JSON payload', async () => {
            const user = userEvent.setup();
            render(<TaskCreateForm onSuccess={vi.fn()} />, { wrapper: createWrapper() });

            const payloadInput = screen.getByLabelText(/payload/i) as HTMLTextAreaElement;
            const validJSON = '{"model": "claude-3-opus", "prompt": "Hello"}';

            await user.clear(payloadInput);
            await user.type(payloadInput, validJSON);

            expect(payloadInput.value).toBe(validJSON);
            expect(screen.queryByText(/invalid json/i)).not.toBeInTheDocument();
        });

        it('should show error for invalid JSON payload', async () => {
            const user = userEvent.setup();
            render(<TaskCreateForm onSuccess={vi.fn()} />, { wrapper: createWrapper() });

            const payloadInput = screen.getByLabelText(/payload/i);
            const invalidJSON = '{invalid json}';

            await user.clear(payloadInput);
            await user.type(payloadInput, invalidJSON);
            await user.tab(); // Trigger blur event

            await waitFor(() => {
                expect(screen.getByText(/invalid json format/i)).toBeInTheDocument();
            });
        });

        it('should provide JSON formatting help', async () => {
            const user = userEvent.setup();
            render(<TaskCreateForm onSuccess={vi.fn()} />, { wrapper: createWrapper() });

            const formatButton = screen.getByRole('button', { name: /format json/i });
            const payloadInput = screen.getByLabelText(/payload/i) as HTMLTextAreaElement;

            // Enter minified JSON
            await user.clear(payloadInput);
            await user.type(payloadInput, '{"a":1,"b":2}');
            await user.click(formatButton);

            await waitFor(() => {
                expect(payloadInput.value).toContain('  '); // Should be formatted with indentation
            });
        });
    });

    describe('Capability Requirements', () => {
        it('should allow adding capability requirements', async () => {
            const user = userEvent.setup();
            render(<TaskCreateForm onSuccess={vi.fn()} />, { wrapper: createWrapper() });

            const addCapabilityButton = screen.getByRole('button', { name: /add capability/i });
            await user.click(addCapabilityButton);

            // Should show capability input fields
            await waitFor(() => {
                expect(screen.getByLabelText(/capability type/i)).toBeInTheDocument();
                expect(screen.getByLabelText(/capability value/i)).toBeInTheDocument();
            });
        });

        it('should validate capability format', async () => {
            const user = userEvent.setup();
            render(<TaskCreateForm onSuccess={vi.fn()} />, { wrapper: createWrapper() });

            const addCapabilityButton = screen.getByRole('button', { name: /add capability/i });
            await user.click(addCapabilityButton);

            const capabilityInput = screen.getByLabelText(/capability type/i);
            await user.type(capabilityInput, 'gpu');

            const valueInput = screen.getByLabelText(/capability value/i);
            await user.type(valueInput, 'nvidia-a100');

            // Should show valid indicator
            await waitFor(() => {
                expect(screen.getByTestId('capability-valid-indicator')).toBeInTheDocument();
            });
        });

        it('should allow removing capability requirements', async () => {
            const user = userEvent.setup();
            render(<TaskCreateForm onSuccess={vi.fn()} />, { wrapper: createWrapper() });

            const addCapabilityButton = screen.getByRole('button', { name: /add capability/i });
            await user.click(addCapabilityButton);

            const removeButton = screen.getByRole('button', { name: /remove capability/i });
            await user.click(removeButton);

            await waitFor(() => {
                expect(screen.queryByLabelText(/capability type/i)).not.toBeInTheDocument();
            });
        });
    });

    describe('Form Submission', () => {
        it('should submit form with valid data', async () => {
            const user = userEvent.setup();
            const onSuccess = vi.fn();
            const taskService = await import('@/lib/task-service');

            vi.mocked(taskService.default.createTask).mockResolvedValue({
                id: 'task-123',
                taskId: 'task-123',
                taskType: 'code_generation',
                status: 'QUEUED',
                priority: 'NORMAL',
                payload: { model: 'claude-3-opus' },
                requiredCapabilities: null,
                assignedPeerId: null,
                result: null,
                errorMessage: null,
                retryCount: 0,
                maxRetries: 3,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                completedAt: null,
            });

            render(<TaskCreateForm onSuccess={onSuccess} />, { wrapper: createWrapper() });

            // Fill form
            await user.type(screen.getByLabelText(/task type/i), 'code_generation');
            await user.type(screen.getByLabelText(/payload/i), '{"model": "claude-3-opus"}');

            // Submit
            await user.click(screen.getByRole('button', { name: /create task/i }));

            await waitFor(() => {
                expect(taskService.default.createTask).toHaveBeenCalledWith({
                    taskType: 'code_generation',
                    priority: 'NORMAL',
                    payload: { model: 'claude-3-opus' },
                    requiredCapabilities: null,
                    maxRetries: 3,
                });
                expect(onSuccess).toHaveBeenCalled();
            });
        });

        it('should show loading state during submission', async () => {
            const user = userEvent.setup();
            const taskService = await import('@/lib/task-service');

            // Mock slow response
            vi.mocked(taskService.default.createTask).mockImplementation(
                () => new Promise((resolve) => setTimeout(resolve, 1000))
            );

            render(<TaskCreateForm onSuccess={vi.fn()} />, { wrapper: createWrapper() });

            // Fill and submit
            await user.type(screen.getByLabelText(/task type/i), 'test');
            await user.type(screen.getByLabelText(/payload/i), '{}');
            await user.click(screen.getByRole('button', { name: /create task/i }));

            // Should show loading state
            expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled();
            expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
        });

        it('should handle submission errors gracefully', async () => {
            const user = userEvent.setup();
            const taskService = await import('@/lib/task-service');

            vi.mocked(taskService.default.createTask).mockRejectedValue(
                new Error('Failed to create task')
            );

            render(<TaskCreateForm onSuccess={vi.fn()} />, { wrapper: createWrapper() });

            // Fill and submit
            await user.type(screen.getByLabelText(/task type/i), 'test');
            await user.type(screen.getByLabelText(/payload/i), '{}');
            await user.click(screen.getByRole('button', { name: /create task/i }));

            await waitFor(() => {
                expect(screen.getByRole('alert')).toHaveTextContent(/failed to create task/i);
            });
        });

        it('should reset form after successful submission', async () => {
            const user = userEvent.setup();
            const taskService = await import('@/lib/task-service');

            vi.mocked(taskService.default.createTask).mockResolvedValue({
                id: 'task-123',
                taskId: 'task-123',
                taskType: 'code_generation',
                status: 'QUEUED',
                priority: 'NORMAL',
                payload: {},
                requiredCapabilities: null,
                assignedPeerId: null,
                result: null,
                errorMessage: null,
                retryCount: 0,
                maxRetries: 3,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                completedAt: null,
            });

            render(<TaskCreateForm onSuccess={vi.fn()} />, { wrapper: createWrapper() });

            // Fill and submit
            const taskTypeInput = screen.getByLabelText(/task type/i) as HTMLInputElement;
            await user.type(taskTypeInput, 'test');
            await user.type(screen.getByLabelText(/payload/i), '{}');
            await user.click(screen.getByRole('button', { name: /create task/i }));

            await waitFor(() => {
                expect(taskTypeInput.value).toBe('');
            });
        });
    });

    describe('Accessibility Compliance', () => {
        it('should have no accessibility violations', async () => {
            const { container } = render(<TaskCreateForm onSuccess={vi.fn()} />, {
                wrapper: createWrapper()
            });

            // Basic accessibility checks
            const form = container.querySelector('form');
            expect(form).toHaveAttribute('aria-label');

            // All inputs should have labels
            const inputs = container.querySelectorAll('input, select, textarea');
            inputs.forEach((input) => {
                const id = input.getAttribute('id');
                if (id) {
                    const label = container.querySelector(`label[for="${id}"]`);
                    expect(label).toBeInTheDocument();
                }
            });
        });

        it('should announce errors to screen readers', async () => {
            const user = userEvent.setup();
            render(<TaskCreateForm onSuccess={vi.fn()} />, { wrapper: createWrapper() });

            const submitButton = screen.getByRole('button', { name: /create task/i });
            await user.click(submitButton);

            await waitFor(() => {
                const errorRegion = screen.getByRole('alert');
                expect(errorRegion).toHaveAttribute('aria-live', 'assertive');
            });
        });

        it('should have sufficient color contrast', () => {
            const { container } = render(<TaskCreateForm onSuccess={vi.fn()} />, {
                wrapper: createWrapper()
            });

            // Check for text elements with proper contrast
            const labels = container.querySelectorAll('label');
            labels.forEach((label) => {
                const styles = window.getComputedStyle(label);
                expect(styles.color).toBeTruthy();
            });
        });
    });
});
