'use client';

/**
 * Example integration of TaskDependencyGraph component
 * This file demonstrates various usage patterns and best practices
 */

import { useState } from 'react';
import TaskDependencyGraph from '@/components/monitoring/TaskDependencyGraph';
import type { Task } from '@/types/monitoring';

// Example 1: Basic static data
const exampleTasks: Task[] = [
  {
    id: 'task-1',
    name: 'Initialize Agent Swarm',
    status: 'completed',
    description: 'Set up agent swarm infrastructure',
    dependencies: [],
    dependents: ['task-2', 'task-3'],
    agentId: 'agent-001',
    createdAt: '2026-03-08T10:00:00Z',
    startedAt: '2026-03-08T10:00:05Z',
    completedAt: '2026-03-08T10:02:30Z',
    estimatedDuration: 120,
    actualDuration: 145,
  },
  {
    id: 'task-2',
    name: 'Load Training Data',
    status: 'completed',
    description: 'Load and validate training datasets',
    dependencies: ['task-1'],
    dependents: ['task-4'],
    agentId: 'agent-002',
    createdAt: '2026-03-08T10:02:00Z',
    startedAt: '2026-03-08T10:02:35Z',
    completedAt: '2026-03-08T10:05:00Z',
    estimatedDuration: 180,
    actualDuration: 145,
  },
  {
    id: 'task-3',
    name: 'Configure Model Parameters',
    status: 'completed',
    description: 'Set hyperparameters for training',
    dependencies: ['task-1'],
    dependents: ['task-4'],
    agentId: 'agent-003',
    createdAt: '2026-03-08T10:02:00Z',
    startedAt: '2026-03-08T10:02:35Z',
    completedAt: '2026-03-08T10:03:15Z',
    estimatedDuration: 60,
    actualDuration: 40,
  },
  {
    id: 'task-4',
    name: 'Train Model',
    status: 'in-progress',
    description: 'Execute model training pipeline',
    dependencies: ['task-2', 'task-3'],
    dependents: ['task-5'],
    agentId: 'agent-004',
    createdAt: '2026-03-08T10:05:00Z',
    startedAt: '2026-03-08T10:05:10Z',
    completedAt: null,
    estimatedDuration: 600,
  },
  {
    id: 'task-5',
    name: 'Validate Model',
    status: 'pending',
    description: 'Run validation tests on trained model',
    dependencies: ['task-4'],
    dependents: ['task-6'],
    agentId: 'agent-005',
    createdAt: '2026-03-08T10:05:00Z',
    startedAt: null,
    completedAt: null,
    estimatedDuration: 120,
  },
  {
    id: 'task-6',
    name: 'Deploy Model',
    status: 'blocked',
    description: 'Deploy model to production (blocked by external resource)',
    dependencies: ['task-5'],
    dependents: [],
    agentId: 'agent-006',
    createdAt: '2026-03-08T10:05:00Z',
    startedAt: null,
    completedAt: null,
    estimatedDuration: 180,
    metadata: {
      blockReason: 'Waiting for production cluster availability',
    },
  },
  {
    id: 'task-7',
    name: 'Generate Reports',
    status: 'failed',
    description: 'Generate performance reports',
    dependencies: ['task-4'],
    dependents: [],
    agentId: 'agent-007',
    createdAt: '2026-03-08T10:10:00Z',
    startedAt: '2026-03-08T10:10:05Z',
    completedAt: null,
    estimatedDuration: 60,
    metadata: {
      error: 'Report template not found',
      retryCount: 3,
    },
  },
];

// Example 2: With task detail panel
export function TaskGraphWithDetails() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  return (
    <div className="flex gap-4">
      <div className="flex-1">
        <TaskDependencyGraph
          tasks={exampleTasks}
          onTaskClick={setSelectedTask}
          width={800}
          height={600}
        />
      </div>

      {selectedTask && (
        <div className="w-80 bg-white rounded-lg shadow-lg p-6 border border-slate-200">
          <h3 className="text-lg font-semibold mb-4">{selectedTask.name}</h3>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-slate-600">Status</label>
              <p className="text-sm capitalize">{selectedTask.status}</p>
            </div>

            {selectedTask.description && (
              <div>
                <label className="text-sm font-medium text-slate-600">Description</label>
                <p className="text-sm text-slate-700">{selectedTask.description}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-slate-600">Dependencies</label>
              <p className="text-sm">
                {selectedTask.dependencies.length > 0
                  ? selectedTask.dependencies.join(', ')
                  : 'None'}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600">Dependents</label>
              <p className="text-sm">
                {selectedTask.dependents.length > 0
                  ? selectedTask.dependents.join(', ')
                  : 'None'}
              </p>
            </div>

            {selectedTask.estimatedDuration && (
              <div>
                <label className="text-sm font-medium text-slate-600">Estimated Duration</label>
                <p className="text-sm">{selectedTask.estimatedDuration}s</p>
              </div>
            )}

            {selectedTask.actualDuration && (
              <div>
                <label className="text-sm font-medium text-slate-600">Actual Duration</label>
                <p className="text-sm">{selectedTask.actualDuration}s</p>
              </div>
            )}

            <button
              onClick={() => setSelectedTask(null)}
              className="mt-4 w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Example 3: With React Query (simulated)
export function LiveTaskGraph() {
  // In real implementation, use React Query:
  // const { data: tasks } = useQuery({
  //   queryKey: ['tasks'],
  //   queryFn: () => taskService.getTasks(),
  //   refetchInterval: 5000,
  // });

  // Simulated live updates
  const [tasks, setTasks] = useState<Task[]>(exampleTasks);

  // Simulate task status updates
  const simulateUpdate = () => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.status === 'in-progress' && Math.random() > 0.5) {
          return { ...task, status: 'completed' as const, completedAt: new Date().toISOString() };
        }
        if (task.status === 'pending' && task.dependencies.every((depId) =>
          prev.find((t) => t.id === depId)?.status === 'completed'
        )) {
          return { ...task, status: 'in-progress' as const, startedAt: new Date().toISOString() };
        }
        return task;
      })
    );
  };

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">Live Task Updates</h2>
        <button
          onClick={simulateUpdate}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Simulate Update
        </button>
      </div>
      <TaskDependencyGraph tasks={tasks} />
    </div>
  );
}

// Example 4: Responsive full-page layout
export function FullPageTaskGraph() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Task Dependency Graph</h1>
          <p className="text-slate-600 mt-2">
            Interactive visualization of task dependencies and execution status
          </p>
        </header>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <TaskDependencyGraph
            tasks={exampleTasks}
            width={1400}
            height={800}
            className="border-2 border-slate-100"
          />
        </div>

        <footer className="mt-6 text-sm text-slate-500 text-center">
          Click and drag nodes to reposition • Scroll to zoom • Click status filters to focus
        </footer>
      </div>
    </div>
  );
}

// Example 5: Compact widget
export function CompactTaskWidget() {
  return (
    <div className="w-96">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-4 py-3 bg-slate-100 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900">Task Dependencies</h3>
        </div>
        <div className="p-4">
          <TaskDependencyGraph
            tasks={exampleTasks}
            width={352}
            height={300}
            showLegend={false}
          />
        </div>
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600">
          {exampleTasks.length} tasks • {exampleTasks.filter(t => t.status === 'completed').length} completed
        </div>
      </div>
    </div>
  );
}

// Example 6: Multi-agent swarm visualization
export function MultiAgentSwarmGraph() {
  const [selectedAgent, setSelectedAgent] = useState<string | 'all'>('all');

  const filteredTasks = selectedAgent === 'all'
    ? exampleTasks
    : exampleTasks.filter((task) => task.agentId === selectedAgent);

  const agents = Array.from(new Set(exampleTasks.map((task) => task.agentId).filter(Boolean)));

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setSelectedAgent('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            selectedAgent === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          All Agents
        </button>
        {agents.map((agentId) => (
          <button
            key={agentId}
            onClick={() => setSelectedAgent(agentId!)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedAgent === agentId
                ? 'bg-blue-500 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {agentId}
          </button>
        ))}
      </div>

      <TaskDependencyGraph tasks={filteredTasks} />
    </div>
  );
}

// Export all examples
export default function TaskDependencyExamples() {
  return (
    <div className="space-y-12 p-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">1. Basic Graph</h2>
        <TaskDependencyGraph tasks={exampleTasks} />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">2. With Task Details</h2>
        <TaskGraphWithDetails />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">3. Live Updates</h2>
        <LiveTaskGraph />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">4. Compact Widget</h2>
        <CompactTaskWidget />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">5. Multi-Agent Filter</h2>
        <MultiAgentSwarmGraph />
      </section>
    </div>
  );
}
