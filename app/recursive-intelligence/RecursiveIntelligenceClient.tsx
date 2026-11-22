'use client';

import { motion } from 'framer-motion';
import {
  Activity,
  Brain,
  Cpu,
  Wrench,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Clock,
  Database,
  CloudOff,
  Cloud,
} from 'lucide-react';
import { fadeUp } from '@/lib/openclaw-utils';
import {
  useRecursiveIntelligence,
  useAgentHeartbeats,
  useRecentTasks,
  type LoopHealth,
} from '@/hooks/useRecursiveIntelligence';
import type { OpenClawAgent } from '@/types/openclaw';
import type { Task } from '@/types/tasks';

// ─── Constants ────────────────────────────────────────────────────────────────

const LOOP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'Sensor Loop': Activity,
  'Memory Loop': Brain,
  'Agent Loop': Cpu,
  'Tool Loop': Wrench,
  'Learning Loop': Sparkles,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusIndicator({ status }: { status: LoopHealth['status'] }) {
  if (status === 'healthy') {
    return <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" aria-label="Healthy" />;
  }
  if (status === 'degraded') {
    return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" aria-label="Degraded" />;
  }
  return <XCircle className="w-4 h-4 text-red-500 shrink-0" aria-label="Down" />;
}

function StatusBadge({ status }: { status: LoopHealth['status'] }) {
  const map = {
    healthy: 'bg-green-50 text-green-700 border border-green-200',
    degraded: 'bg-amber-50 text-amber-700 border border-amber-200',
    down: 'bg-red-50 text-red-700 border border-red-200',
  } as const;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status]}`}>
      {status}
    </span>
  );
}

function LoopCard({ loop, index }: { loop: LoopHealth; index: number }) {
  const Icon = LOOP_ICONS[loop.name] ?? Activity;
  const ringColor =
    loop.status === 'healthy'
      ? 'border-green-200'
      : loop.status === 'degraded'
      ? 'border-amber-200'
      : 'border-red-200';
  const iconBg =
    loop.status === 'healthy'
      ? 'bg-green-50 text-green-600'
      : loop.status === 'degraded'
      ? 'bg-amber-50 text-amber-600'
      : 'bg-red-50 text-red-600';

  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className={`rounded-xl border bg-white p-5 flex flex-col gap-3 ${ringColor}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <Icon className="w-4 h-4" aria-hidden="true" />
        </div>
        <StatusBadge status={loop.status} />
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 text-sm">{loop.name}</h3>
        <p className="text-xs text-gray-500 mt-0.5">{loop.question}</p>
      </div>
      <div className="flex items-center gap-1.5 mt-auto">
        <StatusIndicator status={loop.status} />
        <span className="text-sm text-gray-700 font-medium">{loop.value}</span>
      </div>
    </motion.div>
  );
}

function ClosureScoreRing({ score }: { score: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color =
    score >= 80 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';
  const label =
    score === 100 ? 'All loops closing' : score >= 60 ? 'Most loops active' : score >= 20 ? 'Loops degraded' : 'Loops offline';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28" role="img" aria-label={`Loop closure score: ${score} out of 100`}>
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#E8E6E1"
            strokeWidth="10"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.4s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">{score}</span>
          <span className="text-[10px] text-gray-500 uppercase tracking-wide">/ 100</span>
        </div>
      </div>
      <span className="text-xs text-gray-600 font-medium">{label}</span>
    </div>
  );
}

function AgentActivityRow({ agent }: { agent: OpenClawAgent }) {
  const statusColor =
    agent.status === 'running'
      ? 'bg-green-500'
      : agent.status === 'paused'
      ? 'bg-amber-400'
      : 'bg-gray-300';

  const lastSeen = agent.lastHeartbeatAt
    ? new Date(agent.lastHeartbeatAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '—';

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[#F0EFEC] last:border-0">
      <div className={`w-2 h-2 rounded-full shrink-0 ${statusColor}`} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{agent.name}</p>
        <p className="text-xs text-gray-500 truncate">{agent.model.split('/').at(-1) ?? agent.model}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs text-gray-500">{lastSeen}</p>
        <p className="text-xs capitalize text-gray-400">{agent.status}</p>
      </div>
    </div>
  );
}

function TaskActivityRow({ task }: { task: Task }) {
  const statusColor =
    task.status === 'COMPLETED'
      ? 'bg-green-100 text-green-700'
      : task.status === 'RUNNING'
      ? 'bg-amber-100 text-amber-700'
      : 'bg-blue-100 text-blue-700';

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[#F0EFEC] last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {task.taskType ?? 'Task'}
        </p>
        <p className="text-xs text-gray-500 truncate">{task.taskId ?? task.id}</p>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statusColor}`}>
        {task.status?.toLowerCase()}
      </span>
    </div>
  );
}

function MemoryHealthWidget({
  memory,
  available,
}: {
  memory: ReturnType<typeof useRecursiveIntelligence>['memory'];
  available: boolean;
}) {
  if (!available) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
        <CloudOff className="w-8 h-8 text-gray-300" aria-hidden="true" />
        <p className="text-sm text-gray-500">ZeroLocal not running</p>
        <p className="text-xs text-gray-400">Start with: zerodb serve</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Local memories</span>
        <span className="text-sm font-semibold text-gray-900">
          {(memory?.totalMemories ?? 0).toLocaleString()}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Cloud sync</span>
        <div className="flex items-center gap-1.5">
          {memory?.cloudSyncEnabled ? (
            <>
              <Cloud className="w-3.5 h-3.5 text-green-500" aria-hidden="true" />
              <span className="text-sm text-green-600 font-medium">Enabled</span>
            </>
          ) : (
            <>
              <CloudOff className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
              <span className="text-sm text-gray-500">Disabled</span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Last stored</span>
        <span className="text-sm text-gray-700">
          {memory?.lastStoredAt
            ? new Date(memory.lastStoredAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            : '—'}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Last sync</span>
        <span className="text-sm text-gray-700">
          {memory?.lastSyncAt
            ? new Date(memory.lastSyncAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            : '—'}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Last consolidation</span>
        <span className="text-sm text-gray-700">
          {memory?.lastConsolidatedAt
            ? new Date(memory.lastConsolidatedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'Never'}
        </span>
      </div>
    </div>
  );
}

// ─── Main client component ─────────────────────────────────────────────────────

export default function RecursiveIntelligenceClient() {
  const { loops, closureScore, memory, memoryAvailable } = useRecursiveIntelligence();
  const { data: agentData, isLoading: agentsLoading } = useAgentHeartbeats();
  const { data: taskData, isLoading: tasksLoading } = useRecentTasks();

  const recentAgents = agentData?.agents?.slice(0, 10) ?? [];
  const recentTasks = taskData?.tasks?.slice(0, 10) ?? [];

  return (
    <div className="space-y-8">
      {/* Page header */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Recursive Intelligence</h1>
            <p className="text-sm text-gray-500 mt-1">
              Real-time health of the five intelligence loops. All loops closing = the system is learning.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <RefreshCw className="w-3 h-3" aria-hidden="true" />
            <span>Auto-refreshes every 10s</span>
          </div>
        </div>
      </motion.div>

      {/* Loop closure score + loop cards */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
        <div className="rounded-xl border border-[#E8E6E1] bg-[#FAF9F7] p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
            {/* Score ring */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <ClosureScoreRing score={closureScore} />
              <p className="text-xs text-gray-500 mt-1">Loop Closure Score</p>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px self-stretch bg-[#E8E6E1]" aria-hidden="true" />

            {/* Score legend */}
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium text-gray-700">How the score is calculated</p>
              <ul className="space-y-1">
                {[
                  { label: '100 — All 5 loops active within the last hour', color: 'text-green-600' },
                  { label: '60–80 — Most loops active, one or two degraded', color: 'text-amber-600' },
                  { label: '0–40 — Critical loops offline', color: 'text-red-600' },
                ].map(({ label, color }) => (
                  <li key={label} className={`text-xs ${color} flex items-start gap-1.5`}>
                    <span className="mt-0.5 shrink-0">•</span>
                    <span>{label}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-400 mt-2">Each inactive loop deducts 20 points.</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Five loop status cards */}
      <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Loop Status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {loops.map((loop, i) => (
            <LoopCard key={loop.name} loop={loop} index={i + 3} />
          ))}
        </div>
      </motion.div>

      {/* Activity feed + memory health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent Activity Feed — spans 2 cols */}
        <motion.div
          custom={8}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="lg:col-span-2 space-y-4"
        >
          <div className="rounded-xl border border-[#E8E6E1] bg-white overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E6E1]">
              <h2 className="text-sm font-semibold text-gray-900">Agent Activity Feed</h2>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Clock className="w-3 h-3" aria-hidden="true" />
                <span>Last 10 agents</span>
              </div>
            </div>
            <div className="px-5 py-1">
              {agentsLoading ? (
                <div className="space-y-3 py-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 bg-gray-50 rounded animate-pulse" />
                  ))}
                </div>
              ) : recentAgents.length > 0 ? (
                recentAgents.map((agent) => (
                  <AgentActivityRow key={agent.id} agent={agent} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Cpu className="w-8 h-8 text-gray-200 mb-2" aria-hidden="true" />
                  <p className="text-sm text-gray-400">No agents found</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Tasks */}
          <div className="rounded-xl border border-[#E8E6E1] bg-white overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E6E1]">
              <h2 className="text-sm font-semibold text-gray-900">Recent Task Activity</h2>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Clock className="w-3 h-3" aria-hidden="true" />
                <span>Last 10 tasks</span>
              </div>
            </div>
            <div className="px-5 py-1">
              {tasksLoading ? (
                <div className="space-y-3 py-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 bg-gray-50 rounded animate-pulse" />
                  ))}
                </div>
              ) : recentTasks.length > 0 ? (
                recentTasks.map((task) => (
                  <TaskActivityRow key={task.id} task={task} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Wrench className="w-8 h-8 text-gray-200 mb-2" aria-hidden="true" />
                  <p className="text-sm text-gray-400">No tasks found</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Memory health widget */}
        <motion.div
          custom={9}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="rounded-xl border border-[#E8E6E1] bg-white overflow-hidden self-start"
        >
          <div className="flex items-center gap-2 px-5 py-4 border-b border-[#E8E6E1]">
            <Database className="w-4 h-4 text-[#A88B5F]" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-gray-900">Memory Health</h2>
          </div>
          <div className="px-5 py-4">
            <MemoryHealthWidget memory={memory} available={memoryAvailable} />
          </div>
          <div className="px-5 py-3 border-t border-[#E8E6E1] bg-[#FAF9F7]">
            <p className="text-[11px] text-gray-400 text-center">
              ZeroLocal at localhost:8765
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
