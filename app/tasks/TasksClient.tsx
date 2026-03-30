'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/openclaw-utils';
import { useTaskQueue, useTaskStats } from '@/hooks/useTasks';
import TaskQueueTable from '@/components/tasks/TaskQueueTable';
import TaskFilters from '@/components/tasks/TaskFilters';
import TaskStatsChart from '@/components/tasks/TaskStatsChart';
import TaskDetailDrawer from '@/components/tasks/TaskDetailDrawer';
import type { TaskQueueFilters } from '@/types/tasks';
import { Button } from '@/components/ui/button';

export default function TasksClient() {
    const [filters, setFilters] = useState<TaskQueueFilters>({
        limit: 50,
        offset: 0,
    });
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const { data: queueData, isLoading: queueLoading } = useTaskQueue(filters);
    const { data: stats, isLoading: statsLoading } = useTaskStats();

    const handleTaskClick = (taskId: string) => {
        setSelectedTaskId(taskId);
        setIsDrawerOpen(true);
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
        ? Math.ceil((queueData.totalCount ?? queueData.total ?? 0) / (filters.limit || 50))
        : 0;
    const currentPage = Math.floor((filters.offset || 0) / (filters.limit || 50)) + 1;

    return (
        <div className="space-y-8">
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
                <h1 className="text-2xl font-bold text-gray-900">Task Queue</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Monitor task queue, execution status, and performance metrics
                </p>
            </motion.div>

            <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
                {queueLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-20 bg-gray-50 rounded-lg animate-pulse" />
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
                    tasks={queueData?.tasks || []}
                    onTaskClick={handleTaskClick}
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
        </div>
    );
}
