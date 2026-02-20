'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Pause, Play, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useAgent,
  usePauseAgent,
  useResumeAgent,
  useUpdateAgentSettings,
  useDeleteAgent,
  useExecuteHeartbeat,
} from '@/hooks/useOpenClawAgents';
import {
  fadeUpSimple as fadeUp,
  formatModelShort,
  formatHeartbeatInterval as formatHeartbeatShort,
} from '@/lib/openclaw-utils';
import AgentStatusBadge from '@/components/openclaw/AgentStatusBadge';
import AgentSettingsTab from '@/components/openclaw/AgentSettingsTab';
import AgentChatTab from '@/components/openclaw/AgentChatTab';
import AgentChannelsTab from '@/components/openclaw/AgentChannelsTab';
import AgentSkillsTab from '@/components/openclaw/AgentSkillsTab';
import type { UpdateAgentSettingsRequest } from '@/types/openclaw';

interface OpenClawAgentDetailClientProps {
  agentId: string;
}

export default function OpenClawAgentDetailClient({
  agentId,
}: OpenClawAgentDetailClientProps) {
  const router = useRouter();
  const { data: agent, isLoading, error } = useAgent(agentId);
  const pauseAgent = usePauseAgent();
  const resumeAgent = useResumeAgent();
  const updateSettings = useUpdateAgentSettings(agentId);
  const deleteAgent = useDeleteAgent();
  const executeHeartbeat = useExecuteHeartbeat();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isPaused = agent?.status === 'paused';

  const handleTogglePause = () => {
    if (!agent) return;
    if (isPaused) {
      resumeAgent.mutate(agent.id);
    } else {
      pauseAgent.mutate(agent.id);
    }
  };

  const handleSave = (data: UpdateAgentSettingsRequest) => {
    updateSettings.mutate(data);
  };

  const handleDelete = () => {
    if (!agent) return;
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!agent) return;
    deleteAgent.mutate(agent.id, {
      onSuccess: () => {
        router.push('/agents');
      },
    });
    setDeleteDialogOpen(false);
  };

  const handleRunHeartbeat = () => {
    if (!agent) return;
    executeHeartbeat.mutate(agent.id);
  };

  const handleRestart = () => {
    if (!agent) return;
    pauseAgent.mutate(agent.id, {
      onSuccess: () => {
        setTimeout(() => {
          resumeAgent.mutate(agent.id);
        }, 1000);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-40 bg-gray-100 animate-pulse rounded" />
        <div className="h-10 w-72 bg-gray-100 animate-pulse rounded" />
        <div className="h-8 w-64 bg-gray-50 animate-pulse rounded" />
        <div className="h-[400px] bg-gray-50 animate-pulse rounded-lg" />
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-sm text-gray-500 mb-4">
          {error ? 'Failed to load agent.' : 'Agent not found.'}
        </p>
        <Link
          href="/agents"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Back to Agents
        </Link>
      </div>
    );
  }

  const subtitle = [
    formatModelShort(agent.model),
    agent.heartbeatInterval ? formatHeartbeatShort(agent.heartbeatInterval) : null,
  ]
    .filter(Boolean)
    .join(' \u00B7 ');

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/agents"
          className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Agents</span>
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900 font-medium">{agent.name}</span>
      </div>

      {/* Agent heading + actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{agent.name}</h1>
            <AgentStatusBadge status={agent.status} />
          </div>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={handleTogglePause}
            disabled={pauseAgent.isPending || resumeAgent.isPending}
            className="border-gray-300 text-gray-700 bg-white hover:bg-gray-50 gap-1.5"
          >
            {isPaused ? (
              <>
                <Play className="h-3.5 w-3.5" />
                Resume
              </>
            ) : (
              <>
                <Pause className="h-3.5 w-3.5" />
                Pause
              </>
            )}
          </Button>
          <Button
            onClick={() => handleSave({})}
            disabled={updateSettings.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="bg-transparent border-b border-gray-200 rounded-none w-full justify-start h-auto p-0 gap-0">
          <TabsTrigger
            value="settings"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-gray-500 data-[state=active]:text-gray-900 px-4 py-2.5 text-sm font-medium"
          >
            Settings
          </TabsTrigger>
          <TabsTrigger
            value="chat"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-gray-500 data-[state=active]:text-gray-900 px-4 py-2.5 text-sm font-medium gap-1.5"
          >
            Chat
          </TabsTrigger>
          <TabsTrigger
            value="channels"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-gray-500 data-[state=active]:text-gray-900 px-4 py-2.5 text-sm font-medium"
          >
            Channels
          </TabsTrigger>
          <TabsTrigger
            value="skills"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-gray-500 data-[state=active]:text-gray-900 px-4 py-2.5 text-sm font-medium"
          >
            Skills
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="mt-6">
          <AgentSettingsTab
            agent={agent}
            onSave={handleSave}
            onDelete={handleDelete}
            onRunHeartbeat={handleRunHeartbeat}
            onRestart={handleRestart}
          />
        </TabsContent>

        <TabsContent value="chat" className="mt-6">
          <AgentChatTab agent={agent} />
        </TabsContent>

        <TabsContent value="channels" className="mt-6">
          <AgentChannelsTab />
        </TabsContent>

        <TabsContent value="skills" className="mt-6">
          <AgentSkillsTab />
        </TabsContent>
      </Tabs>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Delete Agent</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500">
              Are you sure you want to delete this agent? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-200 text-gray-700 bg-white hover:bg-gray-50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
