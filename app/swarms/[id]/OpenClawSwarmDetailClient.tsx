'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Pause, Square, Sparkles, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    useSwarm,
    useUpdateSwarm,
    useStartSwarm,
    usePauseSwarm,
    useResumeSwarm,
    useStopSwarm,
    useAddAgentsToSwarm,
    useRemoveAgentsFromSwarm,
} from '@/hooks/useSwarms';
import { useAgentList } from '@/hooks/useOpenClawAgents';
import { fadeUpSimple as fadeUp } from '@/lib/openclaw-utils';
import SwarmStatusBadge from '@/components/openclaw/SwarmStatusBadge';
import SwarmStrategyBadge from '@/components/openclaw/SwarmStrategyBadge';
import AgentStatusBadge from '@/components/openclaw/AgentStatusBadge';
import type { CoordinationStrategy, UpdateSwarmRequest, AgentStatus } from '@/types/openclaw';

interface OpenClawSwarmDetailClientProps {
    swarmId: string;
}

const STRATEGY_OPTIONS: { value: CoordinationStrategy; label: string }[] = [
    { value: 'parallel', label: 'Parallel' },
    { value: 'sequential', label: 'Sequential' },
    { value: 'hierarchical', label: 'Hierarchical' },
];

export default function OpenClawSwarmDetailClient({
    swarmId,
}: OpenClawSwarmDetailClientProps) {
    const router = useRouter();
    const { data: swarm, isLoading, error } = useSwarm(swarmId);
    const updateSwarm = useUpdateSwarm(swarmId);
    const startSwarm = useStartSwarm();
    const pauseSwarm = usePauseSwarm();
    const resumeSwarm = useResumeSwarm();
    const stopSwarm = useStopSwarm();
    const addAgents = useAddAgentsToSwarm(swarmId);
    const removeAgents = useRemoveAgentsFromSwarm(swarmId);

    const { data: agentData } = useAgentList();
    const allAgents = agentData?.agents ?? [];

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [addAgentDialogOpen, setAddAgentDialogOpen] = useState(false);
    const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);

    const [editName, setEditName] = useState('');
    const [editGoal, setEditGoal] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editStrategy, setEditStrategy] = useState<CoordinationStrategy>('parallel');
    const [hasInitialized, setHasInitialized] = useState(false);

    if (swarm && !hasInitialized) {
        setEditName(swarm.name);
        setEditGoal(swarm.goal ?? '');
        setEditDescription(swarm.description ?? '');
        setEditStrategy(swarm.strategy);
        setHasInitialized(true);
    }

    const swarmAgents = allAgents.filter(
        (a) => swarm?.agentIds?.includes(a.id)
    );

    const availableAgents = allAgents.filter(
        (a) => !swarm?.agentIds?.includes(a.id) && a.status !== 'stopped'
    );

    const handleLifecycleAction = () => {
        if (!swarm) return;
        if (swarm.status === 'idle' || swarm.status === 'failed') {
            startSwarm.mutate(swarm.id);
        } else if (swarm.status === 'running') {
            pauseSwarm.mutate(swarm.id);
        } else if (swarm.status === 'paused') {
            resumeSwarm.mutate(swarm.id);
        }
    };

    const handleSave = () => {
        const data: UpdateSwarmRequest = {};
        if (editName !== swarm?.name) data.name = editName;
        if (editGoal !== (swarm?.goal ?? '')) data.goal = editGoal || undefined;
        if (editDescription !== (swarm?.description ?? '')) data.description = editDescription || undefined;
        if (editStrategy !== swarm?.strategy) data.strategy = editStrategy;
        updateSwarm.mutate(data);
    };

    const handleDelete = () => {
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!swarm) return;
        stopSwarm.mutate(swarm.id, {
            onSuccess: () => {
                router.push('/swarms');
            },
        });
        setDeleteDialogOpen(false);
    };

    const handleAddAgents = () => {
        if (selectedAgentIds.length === 0) return;
        addAgents.mutate(selectedAgentIds, {
            onSuccess: () => {
                setSelectedAgentIds([]);
                setAddAgentDialogOpen(false);
            },
        });
    };

    const handleRemoveAgent = (agentId: string) => {
        removeAgents.mutate([agentId]);
    };

    const toggleAgentSelection = (agentId: string) => {
        setSelectedAgentIds((prev) =>
            prev.includes(agentId)
                ? prev.filter((id) => id !== agentId)
                : [...prev, agentId]
        );
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

    if (error || !swarm) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <p className="text-sm text-gray-500 mb-4">
                    {error ? 'Failed to load swarm.' : 'Swarm not found.'}
                </p>
                <Link
                    href="/swarms"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                    Back to Swarms
                </Link>
            </div>
        );
    }

    const lifecycleLabel = (() => {
        if (swarm.status === 'idle' || swarm.status === 'failed') return 'Start';
        if (swarm.status === 'running') return 'Pause';
        if (swarm.status === 'paused') return 'Resume';
        return null;
    })();

    const LifecycleIcon = (() => {
        if (swarm.status === 'idle' || swarm.status === 'failed') return Play;
        if (swarm.status === 'running') return Pause;
        if (swarm.status === 'paused') return Play;
        return null;
    })();

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
                    href="/swarms"
                    className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Swarms</span>
                </Link>
                <span className="text-gray-300">/</span>
                <span className="text-gray-900 font-medium">{swarm.name}</span>
            </div>

            {/* Heading + actions */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900">{swarm.name}</h1>
                        <SwarmStatusBadge status={swarm.status} />
                        <SwarmStrategyBadge strategy={swarm.strategy} />
                    </div>
                    {swarm.goal && (
                        <p className="text-sm text-gray-500">{swarm.goal}</p>
                    )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {lifecycleLabel && LifecycleIcon && (
                        <Button
                            variant="outline"
                            onClick={handleLifecycleAction}
                            disabled={
                                startSwarm.isPending ||
                                pauseSwarm.isPending ||
                                resumeSwarm.isPending
                            }
                            className="border-gray-300 text-gray-700 bg-white hover:bg-gray-50 gap-1.5"
                        >
                            <LifecycleIcon className="h-3.5 w-3.5" />
                            {lifecycleLabel}
                        </Button>
                    )}
                    <Button
                        onClick={handleSave}
                        disabled={updateSwarm.isPending}
                        className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                    >
                        <Sparkles className="h-3.5 w-3.5" />
                        Save Changes
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="bg-transparent border-b border-gray-200 rounded-none w-full justify-start h-auto p-0 gap-0">
                    <TabsTrigger
                        value="overview"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-gray-500 data-[state=active]:text-gray-900 px-4 py-2.5 text-sm font-medium"
                    >
                        Overview
                    </TabsTrigger>
                    <TabsTrigger
                        value="agents"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-gray-500 data-[state=active]:text-gray-900 px-4 py-2.5 text-sm font-medium"
                    >
                        Agents ({swarm.agentCount})
                    </TabsTrigger>
                </TabsList>

                {/* Overview tab */}
                <TabsContent value="overview" className="mt-6 space-y-6">
                    <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="detail-name" className="text-gray-700 text-sm">
                                Name
                            </Label>
                            <Input
                                id="detail-name"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="bg-white border-gray-200 text-gray-900"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="detail-strategy" className="text-gray-700 text-sm">
                                Strategy
                            </Label>
                            <Select
                                value={editStrategy}
                                onValueChange={(v) => setEditStrategy(v as CoordinationStrategy)}
                            >
                                <SelectTrigger
                                    id="detail-strategy"
                                    className="bg-white border-gray-200 text-gray-900"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-gray-200">
                                    {STRATEGY_OPTIONS.map((opt) => (
                                        <SelectItem
                                            key={opt.value}
                                            value={opt.value}
                                            className="text-gray-900"
                                        >
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="detail-goal" className="text-gray-700 text-sm">
                                Goal
                            </Label>
                            <Textarea
                                id="detail-goal"
                                value={editGoal}
                                onChange={(e) => setEditGoal(e.target.value)}
                                rows={3}
                                placeholder="What should this swarm accomplish?"
                                className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="detail-description" className="text-gray-700 text-sm">
                                Description
                            </Label>
                            <Textarea
                                id="detail-description"
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                rows={3}
                                placeholder="Optional description..."
                                className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 resize-none"
                            />
                        </div>
                    </div>

                    {/* Danger zone */}
                    <div className="rounded-lg border border-red-200 bg-red-50/50 p-6">
                        <h3 className="text-sm font-semibold text-red-900 mb-1">Danger Zone</h3>
                        <p className="text-sm text-red-700 mb-4">
                            Stopping this swarm will terminate all agent activity.
                        </p>
                        <Button
                            variant="outline"
                            onClick={handleDelete}
                            className="border-red-300 text-red-700 bg-white hover:bg-red-50 gap-1.5"
                        >
                            <Square className="h-3.5 w-3.5" />
                            Stop & Delete Swarm
                        </Button>
                    </div>
                </TabsContent>

                {/* Agents tab */}
                <TabsContent value="agents" className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            {swarm.agentCount} agent{swarm.agentCount !== 1 ? 's' : ''} in this swarm
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSelectedAgentIds([]);
                                setAddAgentDialogOpen(true);
                            }}
                            className="border-gray-200 text-gray-700 bg-white hover:bg-gray-50 gap-1.5"
                        >
                            <Plus className="h-4 w-4" />
                            Add Agents
                        </Button>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                        {swarmAgents.length === 0 ? (
                            <div className="px-5 py-10 text-center text-sm text-gray-500">
                                No agents in this swarm yet. Click &quot;Add Agents&quot; to get started.
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-[1fr_120px_140px_60px] px-5 py-3 border-b border-gray-100">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        Name
                                    </span>
                                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        Status
                                    </span>
                                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        Model
                                    </span>
                                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">
                                        Actions
                                    </span>
                                </div>
                                {swarmAgents.map((agent) => (
                                    <div
                                        key={agent.id}
                                        className="grid grid-cols-[1fr_120px_140px_60px] items-center px-5 py-3 border-b border-gray-50 last:border-b-0"
                                    >
                                        <Link
                                            href={`/agents/${agent.id}`}
                                            className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate"
                                        >
                                            {agent.name}
                                        </Link>
                                        <AgentStatusBadge status={agent.status as AgentStatus} />
                                        <span className="text-sm text-gray-500 truncate">
                                            {agent.model.split('/').pop()}
                                        </span>
                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveAgent(agent.id)}
                                                className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                                                title="Remove from swarm"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Delete confirmation dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="bg-white border-gray-200">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-gray-900">Delete Swarm</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-500">
                            Are you sure you want to stop and delete this swarm? This will not delete the individual agents.
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

            {/* Add agents dialog */}
            <Dialog open={addAgentDialogOpen} onOpenChange={setAddAgentDialogOpen}>
                <DialogContent className="bg-white border-gray-200 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-gray-900">Add Agents</DialogTitle>
                        <DialogDescription className="text-gray-500">
                            Select agents to add to this swarm.
                        </DialogDescription>
                    </DialogHeader>

                    {availableAgents.length === 0 ? (
                        <p className="text-sm text-gray-500 py-4 text-center">
                            No available agents to add.
                        </p>
                    ) : (
                        <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
                            {availableAgents.map((agent) => (
                                <label
                                    key={agent.id}
                                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedAgentIds.includes(agent.id)}
                                        onChange={() => toggleAgentSelection(agent.id)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-900">{agent.name}</span>
                                    <span className="text-xs text-gray-400 ml-auto">{agent.status}</span>
                                </label>
                            ))}
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setAddAgentDialogOpen(false)}
                            className="border-gray-200 text-gray-700 bg-white hover:bg-gray-50"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            disabled={selectedAgentIds.length === 0 || addAgents.isPending}
                            onClick={handleAddAgents}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Add ({selectedAgentIds.length})
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}
