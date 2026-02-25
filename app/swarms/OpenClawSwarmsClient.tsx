'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSwarmList, useCreateSwarm } from '@/hooks/useSwarms';
import { fadeUp, formatRelativeTime } from '@/lib/openclaw-utils';
import SwarmStatusBadge from '@/components/openclaw/SwarmStatusBadge';
import SwarmStrategyBadge from '@/components/openclaw/SwarmStrategyBadge';
import CreateSwarmDialog from '@/components/openclaw/CreateSwarmDialog';
import type { CreateSwarmRequest } from '@/types/openclaw';

export default function OpenClawSwarmsClient() {
    const router = useRouter();
    const { data, isLoading } = useSwarmList();
    const createSwarm = useCreateSwarm();
    const [search, setSearch] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);

    const swarms = useMemo(() => data?.swarms ?? [], [data?.swarms]);

    const filtered = useMemo(() => {
        if (!search.trim()) return swarms;
        const q = search.toLowerCase();
        return swarms.filter((s) => s.name.toLowerCase().includes(q));
    }, [swarms, search]);

    const handleCreate = (formData: CreateSwarmRequest) => {
        createSwarm.mutate(formData, {
            onSuccess: (swarm) => {
                router.push(`/swarms/${swarm.id}`);
            },
        });
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <motion.div
                custom={0}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="flex items-center justify-between"
            >
                <h1 className="text-2xl font-bold text-gray-900">Agent Swarms</h1>
                <Button
                    onClick={() => setDialogOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                >
                    <Plus className="h-4 w-4" />
                    Create Swarm
                </Button>
            </motion.div>

            {/* Search */}
            <motion.div
                custom={1}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="relative"
            >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search swarms"
                    className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    aria-label="Search swarms"
                />
            </motion.div>

            {/* Swarm table */}
            <motion.div
                custom={2}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
            >
                {isLoading ? (
                    <div className="space-y-3">
                        {[...Array(4)].map((_, i) => (
                            <div
                                key={i}
                                className="h-12 rounded-lg bg-gray-50 animate-pulse"
                            />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                        {/* Table header */}
                        <div className="grid grid-cols-[1fr_120px_80px_100px_100px] px-5 py-3 border-b border-gray-100">
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Name
                            </span>
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Strategy
                            </span>
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">
                                Agents
                            </span>
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Status
                            </span>
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">
                                Updated
                            </span>
                        </div>

                        {/* Table rows */}
                        {filtered.length === 0 ? (
                            <div className="px-5 py-10 text-center text-sm text-gray-500">
                                {search.trim()
                                    ? 'No swarms match your search.'
                                    : 'No swarms yet. Create your first swarm to get started.'}
                            </div>
                        ) : (
                            filtered.map((swarm) => (
                                <Link
                                    key={swarm.id}
                                    href={`/swarms/${swarm.id}`}
                                    className="grid grid-cols-[1fr_120px_80px_100px_100px] items-center px-5 py-3.5 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F0EFEC] text-xs font-semibold text-[#6B6B6B] shrink-0" aria-hidden="true">
                                            {swarm.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-sm font-medium text-gray-900 truncate">
                                            {swarm.name}
                                        </span>
                                    </div>
                                    <SwarmStrategyBadge strategy={swarm.strategy} />
                                    <span className="text-sm text-gray-700 text-center font-medium">
                                        {swarm.agentCount}
                                    </span>
                                    <SwarmStatusBadge status={swarm.status} />
                                    <span className="text-sm text-gray-500 text-right">
                                        {formatRelativeTime(swarm.updatedAt ?? swarm.createdAt)}
                                    </span>
                                </Link>
                            ))
                        )}
                    </div>
                )}
            </motion.div>

            {/* Create dialog */}
            <CreateSwarmDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSubmit={handleCreate}
            />
        </div>
    );
}
