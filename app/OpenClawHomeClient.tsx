'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAgentList } from '@/hooks/useOpenClawAgents';
import { useSwarmHealth, useTimeline } from '@/hooks/useMonitoring';
import { MOCK_TEMPLATES } from '@/lib/openclaw-mock-data';
import {
  fadeUp,
  formatRelativeTime,
  formatHeartbeatInterval,
  formatModelShort,
} from '@/lib/openclaw-utils';
import AgentStatusBadge from '@/components/openclaw/AgentStatusBadge';
import TemplateGrid from '@/components/openclaw/TemplateGrid';
import type { OpenClawAgent } from '@/types/openclaw';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

interface StatCardProps {
  label: string;
  value: string | number;
  index: number;
}

function StatCard({ label, value, index }: StatCardProps) {
  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-1 rounded-lg border border-[#E8E6E1] bg-white p-4"
    >
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-2xl font-bold text-gray-900">{value}</span>
    </motion.div>
  );
}

interface AgentRowProps {
  agent: OpenClawAgent;
  index: number;
}

function AgentRow({ agent, index }: AgentRowProps) {
  return (
    <motion.div
      custom={index + 4}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
    >
      <Link
        href={`/agents/${agent.id}`}
        className="flex items-center gap-4 py-3 px-2 rounded-lg hover:bg-[#FAFAF8] transition-colors group"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F0EFEC] text-xs font-semibold text-[#6B6B6B] shrink-0" aria-hidden="true">
          {agent.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {agent.name}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {formatModelShort(agent.model)}
            {agent.heartbeatInterval
              ? ` \u00B7 ${formatHeartbeatInterval(agent.heartbeatInterval)}`
              : ''}
          </p>
        </div>
        <AgentStatusBadge status={agent.status} />
        <span className="text-xs text-gray-400 shrink-0 w-16 text-right">
          {formatRelativeTime(agent.updatedAt ?? agent.createdAt)}
        </span>
      </Link>
    </motion.div>
  );
}

export default function OpenClawHomeClient() {
  const router = useRouter();
  const { data, isLoading } = useAgentList();
  const { data: health } = useSwarmHealth();
  const { data: timeline } = useTimeline({ limit: 1, offset: 0 });

  const agents = data?.agents ?? [];
  const runningCount = agents.filter((a) => a.status === 'running').length;
  const homeTemplates = useMemo(() => MOCK_TEMPLATES.slice(0, 4), []);

  const healthLabel = health?.status
      ? health.status.charAt(0).toUpperCase() + health.status.slice(1)
      : '--';

  const stats = [
    { label: 'Total Agents', value: agents.length },
    { label: 'Running', value: runningCount },
    { label: 'Swarm Health', value: healthLabel },
    { label: 'Active Events', value: timeline?.totalCount ?? 0 },
  ];

  return (
    <div className="space-y-10">
      {/* Greeting */}
      <motion.div
        custom={0}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <h1 className="text-2xl font-bold text-gray-900">
          {getGreeting()}, Toby
        </h1>
        <p className="text-sm text-gray-500 mt-1">{formatDate()}</p>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            index={i}
          />
        ))}
      </div>

      {/* Your AI Team */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Your AI Team</h2>
          <Link
            href="/agents"
            className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Test Agent
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-14 rounded-lg bg-gray-50 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {agents.map((agent, i) => (
              <AgentRow key={agent.id} agent={agent} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* Templates */}
      <TemplateGrid
        templates={homeTemplates}
        title="What are you building?"
        showViewAll
        onViewAll={() => router.push('/templates')}
        onSelectTemplate={(t) =>
          router.push(`/templates?selected=${t.id}`)
        }
      />
    </div>
  );
}
