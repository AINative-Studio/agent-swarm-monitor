import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TddCycleStatusIndicator from '@/components/monitoring/TddCycleStatusIndicator';
import type { TddCycleStatus } from '@/types/monitoring';
import { createElement } from 'react';

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

describe('TddCycleStatusIndicator', () => {
    const mockStatuses: TddCycleStatus[] = [
        {
            phase: 'writing_tests',
            label: 'Writing Tests',
            description: 'Creating test cases',
            testsPassing: 0,
            testsFailing: 0,
            testsTotal: 5,
            coveragePercent: 0,
            timestamp: '2026-03-08T12:00:00Z',
        },
        {
            phase: 'red',
            label: 'Tests Failing',
            description: 'Tests are failing as expected',
            testsPassing: 0,
            testsFailing: 5,
            testsTotal: 5,
            coveragePercent: 45,
            timestamp: '2026-03-08T12:01:00Z',
        },
        {
            phase: 'green',
            label: 'Tests Passing',
            description: 'All tests passing',
            testsPassing: 5,
            testsFailing: 0,
            testsTotal: 5,
            coveragePercent: 85,
            timestamp: '2026-03-08T12:02:00Z',
        },
        {
            phase: 'refactoring',
            label: 'Refactoring',
            description: 'Improving code quality',
            testsPassing: 5,
            testsFailing: 0,
            testsTotal: 5,
            coveragePercent: 87,
            timestamp: '2026-03-08T12:03:00Z',
        },
        {
            phase: 'idle',
            label: 'Idle',
            description: 'No active TDD cycle',
            testsPassing: 5,
            testsFailing: 0,
            testsTotal: 5,
            coveragePercent: 87,
            timestamp: '2026-03-08T12:04:00Z',
        },
    ];

    describe('Rendering', () => {
        it('should render with idle status by default', () => {
            render(
                <TddCycleStatusIndicator status={mockStatuses[4]} />,
                { wrapper: createWrapper() }
            );

            expect(screen.getByText('Idle')).toBeInTheDocument();
            expect(screen.getByText('No active TDD cycle')).toBeInTheDocument();
        });

        it('should render writing_tests phase correctly', () => {
            render(
                <TddCycleStatusIndicator status={mockStatuses[0]} />,
                { wrapper: createWrapper() }
            );

            expect(screen.getByText('Writing Tests')).toBeInTheDocument();
            expect(screen.getByText('Creating test cases')).toBeInTheDocument();
        });

        it('should render red phase with failing tests', () => {
            render(
                <TddCycleStatusIndicator status={mockStatuses[1]} />,
                { wrapper: createWrapper() }
            );

            expect(screen.getByText('Tests Failing')).toBeInTheDocument();
            expect(screen.getByText('Tests are failing as expected')).toBeInTheDocument();
            expect(screen.getByText('0/5 passing')).toBeInTheDocument();
        });

        it('should render green phase with passing tests', () => {
            render(
                <TddCycleStatusIndicator status={mockStatuses[2]} />,
                { wrapper: createWrapper() }
            );

            expect(screen.getByText('Tests Passing')).toBeInTheDocument();
            expect(screen.getByText('All tests passing')).toBeInTheDocument();
            expect(screen.getByText('5/5 passing')).toBeInTheDocument();
        });

        it('should render refactoring phase', () => {
            render(
                <TddCycleStatusIndicator status={mockStatuses[3]} />,
                { wrapper: createWrapper() }
            );

            expect(screen.getByText('Refactoring')).toBeInTheDocument();
            expect(screen.getByText('Improving code quality')).toBeInTheDocument();
        });
    });

    describe('Color Coding', () => {
        it('should have gray styling for idle phase', () => {
            const { container } = render(
                <TddCycleStatusIndicator status={mockStatuses[4]} />,
                { wrapper: createWrapper() }
            );

            const indicator = container.querySelector('[data-phase="idle"]');
            expect(indicator).toBeInTheDocument();
        });

        it('should have yellow styling for writing_tests phase', () => {
            const { container } = render(
                <TddCycleStatusIndicator status={mockStatuses[0]} />,
                { wrapper: createWrapper() }
            );

            const indicator = container.querySelector('[data-phase="writing_tests"]');
            expect(indicator).toBeInTheDocument();
        });

        it('should have red styling for red phase', () => {
            const { container } = render(
                <TddCycleStatusIndicator status={mockStatuses[1]} />,
                { wrapper: createWrapper() }
            );

            const indicator = container.querySelector('[data-phase="red"]');
            expect(indicator).toBeInTheDocument();
        });

        it('should have green styling for green phase', () => {
            const { container } = render(
                <TddCycleStatusIndicator status={mockStatuses[2]} />,
                { wrapper: createWrapper() }
            );

            const indicator = container.querySelector('[data-phase="green"]');
            expect(indicator).toBeInTheDocument();
        });

        it('should have blue styling for refactoring phase', () => {
            const { container } = render(
                <TddCycleStatusIndicator status={mockStatuses[3]} />,
                { wrapper: createWrapper() }
            );

            const indicator = container.querySelector('[data-phase="refactoring"]');
            expect(indicator).toBeInTheDocument();
        });
    });

    describe('Test Metrics Display', () => {
        it('should display test pass/fail counts', () => {
            render(
                <TddCycleStatusIndicator status={mockStatuses[1]} />,
                { wrapper: createWrapper() }
            );

            expect(screen.getByText('0/5 passing')).toBeInTheDocument();
        });

        it('should display coverage percentage when available', () => {
            render(
                <TddCycleStatusIndicator status={mockStatuses[2]} />,
                { wrapper: createWrapper() }
            );

            expect(screen.getByText('85%')).toBeInTheDocument();
        });

        it('should show coverage warning when below 80%', () => {
            render(
                <TddCycleStatusIndicator status={mockStatuses[1]} />,
                { wrapper: createWrapper() }
            );

            const coverageElement = screen.getByText('45%');
            expect(coverageElement).toBeInTheDocument();
            expect(coverageElement.parentElement).toHaveAttribute('data-warning', 'true');
        });

        it('should not show coverage warning when above 80%', () => {
            render(
                <TddCycleStatusIndicator status={mockStatuses[2]} />,
                { wrapper: createWrapper() }
            );

            const coverageElement = screen.getByText('85%');
            expect(coverageElement).toBeInTheDocument();
            expect(coverageElement.parentElement).not.toHaveAttribute('data-warning', 'true');
        });
    });

    describe('Accessibility', () => {
        it('should have proper ARIA labels', () => {
            render(
                <TddCycleStatusIndicator status={mockStatuses[2]} />,
                { wrapper: createWrapper() }
            );

            expect(screen.getByRole('status')).toBeInTheDocument();
            expect(screen.getByLabelText(/TDD cycle status:/i)).toBeInTheDocument();
        });

        it('should have accessible status indicator for each phase', () => {
            mockStatuses.forEach((status) => {
                const { unmount } = render(
                    <TddCycleStatusIndicator status={status} />,
                    { wrapper: createWrapper() }
                );

                const statusElement = screen.getByRole('status');
                expect(statusElement).toHaveAttribute('aria-label');

                unmount();
            });
        });

        it('should have proper semantic HTML structure', () => {
            const { container } = render(
                <TddCycleStatusIndicator status={mockStatuses[2]} />,
                { wrapper: createWrapper() }
            );

            expect(container.querySelector('[role="status"]')).toBeInTheDocument();
        });
    });

    describe('Compact Mode', () => {
        it('should render in compact mode when specified', () => {
            render(
                <TddCycleStatusIndicator status={mockStatuses[2]} compact />,
                { wrapper: createWrapper() }
            );

            expect(screen.getByText('Tests Passing')).toBeInTheDocument();
            // Description should not be visible in compact mode
            expect(screen.queryByText('All tests passing')).not.toBeInTheDocument();
        });

        it('should show full details in non-compact mode', () => {
            render(
                <TddCycleStatusIndicator status={mockStatuses[2]} compact={false} />,
                { wrapper: createWrapper() }
            );

            expect(screen.getByText('Tests Passing')).toBeInTheDocument();
            expect(screen.getByText('All tests passing')).toBeInTheDocument();
        });
    });

    describe('Animation', () => {
        it('should have animation classes for phase transitions', () => {
            const { container } = render(
                <TddCycleStatusIndicator status={mockStatuses[2]} />,
                { wrapper: createWrapper() }
            );

            const indicator = container.querySelector('[data-animated="true"]');
            expect(indicator).toBeInTheDocument();
        });

        it('should have pulse animation for active phases', () => {
            const { container } = render(
                <TddCycleStatusIndicator status={mockStatuses[1]} />,
                { wrapper: createWrapper() }
            );

            // Red phase should pulse
            const indicator = container.querySelector('[data-phase="red"]');
            expect(indicator?.getAttribute('data-animated')).toBe('true');
        });

        it('should not pulse in idle phase', () => {
            const { container } = render(
                <TddCycleStatusIndicator status={mockStatuses[4]} />,
                { wrapper: createWrapper() }
            );

            const indicator = container.querySelector('[data-phase="idle"]');
            expect(indicator?.getAttribute('data-animated')).not.toBe('true');
        });
    });

    describe('Icons', () => {
        it('should display appropriate icon for each phase', () => {
            // Writing tests - should have pencil/edit icon
            const { container: container1, unmount: unmount1 } = render(
                <TddCycleStatusIndicator status={mockStatuses[0]} />,
                { wrapper: createWrapper() }
            );
            expect(container1.querySelector('svg')).toBeInTheDocument();
            unmount1();

            // Red phase - should have X or alert icon
            const { container: container2, unmount: unmount2 } = render(
                <TddCycleStatusIndicator status={mockStatuses[1]} />,
                { wrapper: createWrapper() }
            );
            expect(container2.querySelector('svg')).toBeInTheDocument();
            unmount2();

            // Green phase - should have check icon
            const { container: container3, unmount: unmount3 } = render(
                <TddCycleStatusIndicator status={mockStatuses[2]} />,
                { wrapper: createWrapper() }
            );
            expect(container3.querySelector('svg')).toBeInTheDocument();
            unmount3();

            // Refactoring - should have wrench/tool icon
            const { container: container4, unmount: unmount4 } = render(
                <TddCycleStatusIndicator status={mockStatuses[3]} />,
                { wrapper: createWrapper() }
            );
            expect(container4.querySelector('svg')).toBeInTheDocument();
            unmount4();

            // Idle - should have pause/circle icon
            const { container: container5 } = render(
                <TddCycleStatusIndicator status={mockStatuses[4]} />,
                { wrapper: createWrapper() }
            );
            expect(container5.querySelector('svg')).toBeInTheDocument();
        });
    });

    describe('Responsive Design', () => {
        it('should apply mobile-responsive classes', () => {
            const { container } = render(
                <TddCycleStatusIndicator status={mockStatuses[2]} />,
                { wrapper: createWrapper() }
            );

            const indicator = container.firstChild;
            expect(indicator).toHaveClass(/flex/);
        });
    });

    describe('Edge Cases', () => {
        it('should handle zero tests gracefully', () => {
            const zeroTestsStatus: TddCycleStatus = {
                phase: 'writing_tests',
                label: 'Writing Tests',
                description: 'No tests yet',
                testsPassing: 0,
                testsFailing: 0,
                testsTotal: 0,
                coveragePercent: 0,
                timestamp: '2026-03-08T12:00:00Z',
            };

            render(
                <TddCycleStatusIndicator status={zeroTestsStatus} />,
                { wrapper: createWrapper() }
            );

            expect(screen.getByText('0/0 passing')).toBeInTheDocument();
        });

        it('should handle coverage of 100%', () => {
            const fullCoverageStatus: TddCycleStatus = {
                phase: 'green',
                label: 'Tests Passing',
                description: 'Perfect coverage',
                testsPassing: 10,
                testsFailing: 0,
                testsTotal: 10,
                coveragePercent: 100,
                timestamp: '2026-03-08T12:00:00Z',
            };

            render(
                <TddCycleStatusIndicator status={fullCoverageStatus} />,
                { wrapper: createWrapper() }
            );

            expect(screen.getByText('100%')).toBeInTheDocument();
        });

        it('should handle partial passing tests', () => {
            const partialStatus: TddCycleStatus = {
                phase: 'red',
                label: 'Tests Failing',
                description: 'Some tests failing',
                testsPassing: 3,
                testsFailing: 2,
                testsTotal: 5,
                coveragePercent: 60,
                timestamp: '2026-03-08T12:00:00Z',
            };

            render(
                <TddCycleStatusIndicator status={partialStatus} />,
                { wrapper: createWrapper() }
            );

            expect(screen.getByText('3/5 passing')).toBeInTheDocument();
        });
    });

    describe('Custom className', () => {
        it('should accept and apply custom className', () => {
            const { container } = render(
                <TddCycleStatusIndicator
                    status={mockStatuses[2]}
                    className="custom-class"
                />,
                { wrapper: createWrapper() }
            );

            expect(container.firstChild).toHaveClass('custom-class');
        });
    });
});
