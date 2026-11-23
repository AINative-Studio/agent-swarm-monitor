/**
 * TddCycleStatusIndicator Usage Examples
 *
 * This file demonstrates various usage patterns for the TddCycleStatusIndicator component.
 * These examples can be integrated into monitoring dashboards, agent detail pages,
 * or standalone TDD tracking interfaces.
 */

import TddCycleStatusIndicator from '@/components/monitoring/TddCycleStatusIndicator';
import type { TddCycleStatus } from '@/types/monitoring';

// ============================================================================
// Example 1: Basic Dashboard Integration
// ============================================================================

export function TddDashboardExample() {
    const currentStatus: TddCycleStatus = {
        phase: 'green',
        label: 'Tests Passing',
        description: 'All tests passing with excellent coverage',
        testsPassing: 28,
        testsFailing: 0,
        testsTotal: 28,
        coveragePercent: 100,
        timestamp: new Date().toISOString(),
    };

    return (
        <div className="p-6 space-y-4">
            <h2 className="text-2xl font-bold">TDD Cycle Status</h2>
            <TddCycleStatusIndicator status={currentStatus} />
        </div>
    );
}

// ============================================================================
// Example 2: Agent-Specific TDD Monitoring
// ============================================================================

export function AgentTddMonitorExample({ agentId }: { agentId: string }) {
    // In a real implementation, this would come from a React Query hook
    const agentStatus: TddCycleStatus = {
        phase: 'refactoring',
        label: 'Refactoring',
        description: 'Improving code quality while maintaining tests',
        testsPassing: 142,
        testsFailing: 0,
        testsTotal: 142,
        coveragePercent: 87,
        timestamp: new Date().toISOString(),
    };

    return (
        <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Agent: {agentId}</h3>
                <span className="text-xs text-gray-500">
                    Last updated: {new Date(agentStatus.timestamp).toLocaleTimeString()}
                </span>
            </div>
            <TddCycleStatusIndicator status={agentStatus} />
        </div>
    );
}

// ============================================================================
// Example 3: Multi-Agent TDD Grid (Compact Mode)
// ============================================================================

export function MultiAgentTddGridExample() {
    const agents: Array<{ id: string; name: string; status: TddCycleStatus }> = [
        {
            id: 'agent-001',
            name: 'Customer Service Agent',
            status: {
                phase: 'green',
                label: 'Tests Passing',
                description: 'All tests passing',
                testsPassing: 45,
                testsFailing: 0,
                testsTotal: 45,
                coveragePercent: 92,
                timestamp: new Date().toISOString(),
            },
        },
        {
            id: 'agent-002',
            name: 'Data Analysis Agent',
            status: {
                phase: 'red',
                label: 'Tests Failing',
                description: 'New feature tests failing',
                testsPassing: 38,
                testsFailing: 7,
                testsTotal: 45,
                coveragePercent: 78,
                timestamp: new Date().toISOString(),
            },
        },
        {
            id: 'agent-003',
            name: 'Email Agent',
            status: {
                phase: 'writing_tests',
                label: 'Writing Tests',
                description: 'Creating test cases for new functionality',
                testsPassing: 0,
                testsFailing: 0,
                testsTotal: 12,
                coveragePercent: 65,
                timestamp: new Date().toISOString(),
            },
        },
    ];

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Agent TDD Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map((agent) => (
                    <div key={agent.id} className="space-y-2">
                        <h3 className="font-semibold text-sm">{agent.name}</h3>
                        <TddCycleStatusIndicator status={agent.status} compact />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ============================================================================
// Example 4: TDD Workflow Timeline
// ============================================================================

export function TddWorkflowTimelineExample() {
    const workflowSteps: TddCycleStatus[] = [
        {
            phase: 'writing_tests',
            label: 'Writing Tests',
            description: 'Step 1: Write failing tests',
            testsPassing: 0,
            testsFailing: 0,
            testsTotal: 5,
            coveragePercent: 0,
            timestamp: '2026-03-08T10:00:00Z',
        },
        {
            phase: 'red',
            label: 'Tests Failing',
            description: 'Step 2: Tests fail as expected',
            testsPassing: 0,
            testsFailing: 5,
            testsTotal: 5,
            coveragePercent: 45,
            timestamp: '2026-03-08T10:15:00Z',
        },
        {
            phase: 'green',
            label: 'Tests Passing',
            description: 'Step 3: Implement minimal code to pass',
            testsPassing: 5,
            testsFailing: 0,
            testsTotal: 5,
            coveragePercent: 82,
            timestamp: '2026-03-08T10:45:00Z',
        },
        {
            phase: 'refactoring',
            label: 'Refactoring',
            description: 'Step 4: Improve code quality',
            testsPassing: 5,
            testsFailing: 0,
            testsTotal: 5,
            coveragePercent: 87,
            timestamp: '2026-03-08T11:00:00Z',
        },
    ];

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">TDD Workflow</h2>
            <div className="space-y-4">
                {workflowSteps.map((step, index) => (
                    <div key={index} className="relative">
                        {index < workflowSteps.length - 1 && (
                            <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-gray-200" />
                        )}
                        <TddCycleStatusIndicator status={step} />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ============================================================================
// Example 5: Live TDD Status with Real-time Updates
// ============================================================================

export function LiveTddStatusExample() {
    // In a real implementation, this would use React Query with polling
    // const { data: status } = useTddCycleStatus({ refetchInterval: 5000 });

    const liveStatus: TddCycleStatus = {
        phase: 'green',
        label: 'Tests Passing',
        description: 'All tests passing - ready for deployment',
        testsPassing: 156,
        testsFailing: 0,
        testsTotal: 156,
        coveragePercent: 94,
        timestamp: new Date().toISOString(),
    };

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold">Live TDD Status</h2>
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm text-gray-600">Live</span>
                </div>
            </div>
            <TddCycleStatusIndicator status={liveStatus} />
            <p className="mt-3 text-xs text-gray-500 text-center">
                Updates every 5 seconds
            </p>
        </div>
    );
}

// ============================================================================
// Example 6: Coverage Warning Demonstration
// ============================================================================

export function CoverageWarningExample() {
    const lowCoverageStatus: TddCycleStatus = {
        phase: 'red',
        label: 'Tests Failing',
        description: 'Coverage below target threshold',
        testsPassing: 12,
        testsFailing: 8,
        testsTotal: 20,
        coveragePercent: 65, // Below 80% target
        timestamp: new Date().toISOString(),
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Coverage Warning Example</h2>
            <TddCycleStatusIndicator status={lowCoverageStatus} />
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-700">
                    <strong>Note:</strong> Coverage is below the 80% target. The indicator
                    displays a warning with the target percentage.
                </p>
            </div>
        </div>
    );
}

// ============================================================================
// Example 7: Integration with Monitoring Dashboard
// ============================================================================

export function MonitoringDashboardIntegration() {
    const systemStatus: TddCycleStatus = {
        phase: 'green',
        label: 'Tests Passing',
        description: 'System-wide test suite passing',
        testsPassing: 1247,
        testsFailing: 0,
        testsTotal: 1247,
        coveragePercent: 89,
        timestamp: new Date().toISOString(),
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-6">
            {/* Other monitoring widgets */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow p-4">
                    <h3 className="text-lg font-semibold mb-3">System Health</h3>
                    {/* Health metrics... */}
                </div>
            </div>

            {/* TDD Status Widget */}
            <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold mb-3">TDD Status</h3>
                <TddCycleStatusIndicator status={systemStatus} />
            </div>
        </div>
    );
}

// ============================================================================
// Example 8: Responsive Layout Example
// ============================================================================

export function ResponsiveTddLayoutExample() {
    const status: TddCycleStatus = {
        phase: 'refactoring',
        label: 'Refactoring',
        description: 'Code quality improvements in progress',
        testsPassing: 89,
        testsFailing: 0,
        testsTotal: 89,
        coveragePercent: 91,
        timestamp: new Date().toISOString(),
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {/* Mobile: Full card */}
            <div className="block sm:hidden">
                <TddCycleStatusIndicator status={status} />
            </div>

            {/* Tablet: Compact mode */}
            <div className="hidden sm:block lg:hidden">
                <TddCycleStatusIndicator status={status} compact />
            </div>

            {/* Desktop: Full mode with custom styling */}
            <div className="hidden lg:block">
                <TddCycleStatusIndicator
                    status={status}
                    className="max-w-2xl mx-auto shadow-xl"
                />
            </div>
        </div>
    );
}
