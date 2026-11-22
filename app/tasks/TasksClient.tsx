'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/openclaw-utils';
import { useTaskQueue, useTaskStats } from '@/hooks/useTasks';
import { useTaskUpdates } from '@/hooks/useTaskUpdates';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import TaskQueueTable from '@/components/tasks/TaskQueueTable';
import TaskFilters from '@/components/tasks/TaskFilters';
import TaskStatsChart from '@/components/tasks/TaskStatsChart';
import TaskDetailDrawer from '@/components/tasks/TaskDetailDrawer';
import TaskCreateForm from '@/components/tasks/TaskCreateForm';
import TaskAssignment from '@/components/tasks/TaskAssignment';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { Task, TaskQueueFilters } from '@/types/tasks';
import { Button } from '@/components/ui/button';

const VIRTUALIZATION_WINDOW = 25;

const FILTERS_STORAGE_KEY = 'tasks-client-filters';
const DEFAULT_FILTERS: TaskQueueFilters = { limit: 50, offset: 0 };

function loadStoredFilters(): TaskQueueFilters {
    if (typeof window === 'undefined') return DEFAULT_FILTERS;
    try {
        const stored = window.sessionStorage.getItem(FILTERS_STORAGE_KEY);
        return stored ? { ...DEFAULT_FILTERS, ...JSON.parse(stored) } : DEFAULT_FILTERS;
    } catch {
        return DEFAULT_FILTERS;
    }
}

export default function TasksClient() {
    // Filters are persisted to sessionStorage so navigating away from the
    // task queue and back (without closing the tab) restores the filters
    // the operator had set, instead of resetting to defaults every time.
    const [filters, setFilters] = useState<TaskQueueFilters>(loadStoredFilters);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [assignTaskTarget, setAssignTaskTarget] = useState<Task | null>(null);

    const { data: queueData, isLoading: queueLoading } = useTaskQueue(filters);
    const { data: stats, isLoading: statsLoading } = useTaskStats();
    const { updates, useFallbackPolling: isPollingFallback } = useTaskUpdates(
        (queueData?.tasks ?? []).map((task) => task.taskId ?? task.id)
    );
    const { toast } = useToast();

    useEffect(() => {
        try {
            window.sessionStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
        } catch {
            // sessionStorage can throw in privacy-restricted contexts;
            // filter persistence is a convenience, not a requirement.
        }
    }, [filters]);

    // Real-time status pushed over the WebSocket takes precedence over
    // whatever the last REST fetch returned for that task, so a running
    // task shows as RUNNING immediately instead of waiting for the next
    // 10s poll.
    const latestStatusByTaskId = useMemo(() => {
        const map = new Map<string, string>();
        for (const update of updates) {
            map.set(update.taskId, update.status);
        }
        return map;
    }, [updates]);

    const displayedTasks = useMemo(() => {
        const tasks = queueData?.tasks ?? [];
        return tasks
            // The server is expected to apply status/priority/etc.
            // filters itself, but re-applying them here too means the
            // displayed list stays correct even against a stale/cached
            // response that hasn't caught up with the latest filter yet.
            .filter((task) => !filters.status || task.status === filters.status)
            .filter((task) => !filters.priority || task.priority === filters.priority)
            .map((task) => {
                const liveStatus = latestStatusByTaskId.get(task.taskId ?? task.id);
                return liveStatus ? { ...task, status: liveStatus as Task['status'] } : task;
            });
    }, [queueData?.tasks, latestStatusByTaskId, filters.status, filters.priority]);

    const handleTaskClick = (taskId: string) => {
        setSelectedTaskId(taskId);
        setIsDrawerOpen(true);
    };

    const handleAssignClick = (taskId: string) => {
        const task = displayedTasks.find((t) => (t.taskId ?? t.id) === taskId);
        if (task) {
            setAssignTaskTarget(task);
        }
    };

    const handleCreateSuccess = () => {
        setIsCreateOpen(false);
        toast({ title: 'Task created successfully' });
    };

    const handleAssignmentComplete = () => {
        setAssignTaskTarget(null);
    };

    const handleNextPage = () => {
        setFilters((prev) => ({
            ...prev,
            offset: (prev.offset || 0) + (prev.limit || 50),
        }));
    };

    const handlePrevPage = () => {
        setFilters((prev) => ({
            ...prev,
            offset: Math.max(0, (prev.offset || 0) - (prev.limit || 50)),
        }));
    };

    const totalPages = queueData
        ? Math.ceil((queueData.totalCount ?? 0) / (filters.limit || 50))
        : 0;
    const currentPage = Math.floor((filters.offset || 0) / (filters.limit || 50)) + 1;

    return (
        <div className="space-y-8">
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Task Queue</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Monitor task queue, execution status, and performance metrics
                        </p>
                    </div>
                    <Button type="button" onClick={() => setIsCreateOpen(true)}>
                        Create Task
                    </Button>
                </div>
                {isPollingFallback && (
                    <div
                        data-testid="fallback-polling-indicator"
                        className="mt-3 inline-flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-800"
                    >
                        Live updates unavailable &mdash; using polling mode
                    </div>
                )}
            </motion.div>

            <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
                {queueLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} data-testid="loading-skeleton" className="h-20 bg-gray-50 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : queueData ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="rounded-lg border border-[#E8E6E1] p-4 bg-white">
                            <div className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">
                                Total Tasks
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                                {queueData.totalCount}
                            </div>
                        </div>
                        <div className="rounded-lg border border-[#E8E6E1] p-4 bg-white">
                            <div className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">
                                Current Page
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                                {queueData.tasks.length}
                            </div>
                        </div>
                        <div className="rounded-lg border border-[#E8E6E1] p-4 bg-white">
                            <div className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">
                                Page
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                                {currentPage} / {totalPages}
                            </div>
                        </div>
                        <div className="rounded-lg border border-[#E8E6E1] p-4 bg-white">
                            <div className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">
                                Auto-Refresh
                            </div>
                            <div className="text-sm font-medium text-green-600 mt-1">
                                Every 10s
                            </div>
                        </div>
                    </div>
                ) : null}
            </motion.div>

            <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
                <TaskFilters filters={filters} onFiltersChange={setFilters} />
            </motion.div>

            <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-gray-900">Task Queue</h2>
                    {queueData && queueData.totalCount > 0 && (
                        <div className="text-sm text-gray-600">
                            Showing {(filters.offset || 0) + 1} - {Math.min((filters.offset || 0) + (filters.limit || 50), queueData.totalCount)} of {queueData.totalCount}
                        </div>
                    )}
                </div>
                <TaskQueueTable
                    tasks={displayedTasks.slice(0, VIRTUALIZATION_WINDOW)}
                    onTaskClick={handleTaskClick}
                    onAssignClick={handleAssignClick}
                    isLoading={queueLoading}
                />

                {queueData && queueData.totalCount > (filters.limit || 50) && (
                    <div className="flex items-center justify-between mt-4">
                        <Button
                            variant="outline"
                            onClick={handlePrevPage}
                            disabled={(filters.offset || 0) === 0}
                        >
                            Previous
                        </Button>
                        <span className="text-sm text-gray-600">
                            Page {currentPage} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            onClick={handleNextPage}
                            disabled={(filters.offset || 0) + (filters.limit || 50) >= queueData.totalCount}
                        >
                            Next
                        </Button>
                    </div>
                )}
            </motion.div>

            <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">
                    Performance Statistics
                </h2>
                <TaskStatsChart stats={stats || null} isLoading={statsLoading} />
            </motion.div>

            <TaskDetailDrawer
                taskId={selectedTaskId}
                isOpen={isDrawerOpen}
                onClose={() => {
                    setIsDrawerOpen(false);
                    setSelectedTaskId(null);
                }}
            />

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Task</DialogTitle>
                        <DialogDescription className="sr-only">
                            Fill out the form to queue a new task for processing.
                        </DialogDescription>
                    </DialogHeader>
                    <TaskCreateForm onSuccess={handleCreateSuccess} />
                </DialogContent>
            </Dialog>

            {assignTaskTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                    <div className="w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg">
                        <TaskAssignment
                            task={assignTaskTarget}
                            onAssignmentComplete={handleAssignmentComplete}
                        />
                    </div>
                </div>
            )}

            <Toaster />
        </div>
    );
}
