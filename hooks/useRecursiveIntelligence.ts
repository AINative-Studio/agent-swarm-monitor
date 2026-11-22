import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { OpenClawAgentListResponse } from '@/types/openclaw';
import type { TaskQueueResponse } from '@/types/tasks';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ZeroLocalStats {
  totalMemories: number;
  lastStoredAt: string | null;
  lastConsolidatedAt: string | null;
  cloudSyncEnabled: boolean;
  lastSyncAt: string | null;
}

export interface LoopHealth {
  name: string;
  question: string;
  status: 'healthy' | 'degraded' | 'down';
  /** Human-readable value to display (e.g. "3m ago") */
  value: string;
  /** Raw ISO timestamp or number for comparisons */
  raw: string | number | null;
}

export interface RecursiveIntelligenceData {
  loops: LoopHealth[];
  closureScore: number;
  agents: OpenClawAgentListResponse | null;
  tasks: TaskQueueResponse | null;
  memory: ZeroLocalStats | null;
  memoryAvailable: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string | null): string {
  if (!iso) return 'never';
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const ONE_HOUR_MS = 60 * 60 * 1000;

function isActiveWithinHour(iso: string | null): boolean {
  if (!iso) return false;
  return Date.now() - new Date(iso).getTime() < ONE_HOUR_MS;
}

// ─── Individual fetchers ───────────────────────────────────────────────────────

async function fetchAgents(): Promise<OpenClawAgentListResponse> {
  return apiClient.get<OpenClawAgentListResponse>('/agents', { limit: '50' });
}

async function fetchTasks(): Promise<TaskQueueResponse> {
  return apiClient.get<TaskQueueResponse>('/tasks/queue', { limit: '50' });
}

async function fetchZeroLocalStats(): Promise<ZeroLocalStats> {
  const res = await fetch(
    'http://localhost:8765/v1/projects/e4f3d95f-593f-4ae6-9017-24bff5f72c5e/stats',
    { signal: AbortSignal.timeout(3000) }
  );
  if (!res.ok) throw new Error('ZeroLocal unavailable');
  const raw = await res.json();
  // Normalise whatever shape the stats endpoint returns
  return {
    totalMemories: raw.total_memories ?? raw.totalMemories ?? 0,
    lastStoredAt: raw.last_stored_at ?? raw.lastStoredAt ?? null,
    lastConsolidatedAt: raw.last_consolidated_at ?? raw.lastConsolidatedAt ?? null,
    cloudSyncEnabled: raw.cloud_sync_enabled ?? raw.cloudSyncEnabled ?? false,
    lastSyncAt: raw.last_sync_at ?? raw.lastSyncAt ?? null,
  };
}

// ─── Derived loop health ───────────────────────────────────────────────────────

function buildLoops(
  agents: OpenClawAgentListResponse | null,
  tasks: TaskQueueResponse | null,
  memory: ZeroLocalStats | null
): LoopHealth[] {
  // 1 — Sensor Loop: last agent heartbeat
  const lastHeartbeat =
    agents?.agents
      ?.map((a) => a.lastHeartbeatAt)
      .filter(Boolean)
      .sort()
      .at(-1) ?? null;

  const sensorActive = isActiveWithinHour(lastHeartbeat);

  // 2 — Memory Loop: memories stored
  const memoryActive = memory !== null && memory.totalMemories > 0;

  // 3 — Agent Loop: running agents
  const runningAgents = agents?.agents?.filter((a) => a.status === 'running').length ?? 0;
  const agentActive = runningAgents > 0;

  // 4 — Tool Loop: recent tasks (COMPLETED within last hour acts as proxy)
  const recentCompleted =
    tasks?.tasks?.filter((t) => {
      if (t.status !== 'COMPLETED') return false;
      return isActiveWithinHour(t.updatedAt ?? null);
    }).length ?? 0;
  const toolActive = recentCompleted > 0;

  // 5 — Learning Loop: consolidation timestamp
  const consolidationActive = isActiveWithinHour(memory?.lastConsolidatedAt ?? null);

  return [
    {
      name: 'Sensor Loop',
      question: 'Are channels ingesting?',
      status: sensorActive ? 'healthy' : lastHeartbeat ? 'degraded' : 'down',
      value: lastHeartbeat ? relativeTime(lastHeartbeat) : 'no heartbeats',
      raw: lastHeartbeat,
    },
    {
      name: 'Memory Loop',
      question: 'Are memories being stored?',
      status: memoryActive
        ? memory && isActiveWithinHour(memory.lastStoredAt)
          ? 'healthy'
          : 'degraded'
        : 'down',
      value: memory
        ? memory.totalMemories > 0
          ? `${memory.totalMemories.toLocaleString()} memories`
          : 'no memories'
        : 'ZeroLocal offline',
      raw: memory?.totalMemories ?? null,
    },
    {
      name: 'Agent Loop',
      question: 'Are agents running tasks?',
      status: agentActive ? 'healthy' : runningAgents === 0 && (agents?.total ?? 0) > 0 ? 'degraded' : 'down',
      value: runningAgents > 0 ? `${runningAgents} running` : 'no active agents',
      raw: runningAgents,
    },
    {
      name: 'Tool Loop',
      question: 'Are tool calls completing?',
      status: toolActive ? 'healthy' : (tasks?.totalCount ?? 0) > 0 ? 'degraded' : 'down',
      value: recentCompleted > 0 ? `${recentCompleted} completed (1h)` : 'no completions',
      raw: recentCompleted,
    },
    {
      name: 'Learning Loop',
      question: 'Are memories being consolidated?',
      status: consolidationActive ? 'healthy' : memory?.lastConsolidatedAt ? 'degraded' : 'down',
      value: memory?.lastConsolidatedAt ? relativeTime(memory.lastConsolidatedAt) : 'never',
      raw: memory?.lastConsolidatedAt ?? null,
    },
  ];
}

function calcClosureScore(loops: LoopHealth[]): number {
  const healthyCount = loops.filter((l) => l.status === 'healthy').length;
  return healthyCount * 20;
}

// ─── Exported hooks ────────────────────────────────────────────────────────────

export function useAgentHeartbeats() {
  return useQuery({
    queryKey: ['ri-agents'],
    queryFn: fetchAgents,
    refetchInterval: 10000,
    retry: 1,
  });
}

export function useRecentTasks() {
  return useQuery({
    queryKey: ['ri-tasks'],
    queryFn: fetchTasks,
    refetchInterval: 10000,
    retry: 1,
  });
}

export function useZeroLocalStats() {
  return useQuery({
    queryKey: ['ri-zerodb-stats'],
    queryFn: fetchZeroLocalStats,
    refetchInterval: 15000,
    retry: false,
    // Don't throw — graceful fallback when ZeroLocal is not running
  });
}

export function useRecursiveIntelligence(): RecursiveIntelligenceData {
  const { data: agents = null } = useAgentHeartbeats();
  const { data: tasks = null } = useRecentTasks();
  const { data: memory = null } = useZeroLocalStats();

  const loops = buildLoops(agents, tasks, memory);
  const closureScore = calcClosureScore(loops);

  return {
    loops,
    closureScore,
    agents,
    tasks,
    memory,
    memoryAvailable: memory !== null,
  };
}
