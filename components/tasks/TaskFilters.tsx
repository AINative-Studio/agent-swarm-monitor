'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { TaskQueueFilters } from '@/types/tasks';

interface TaskFiltersProps {
    filters: TaskQueueFilters;
    onFiltersChange: (filters: TaskQueueFilters) => void;
}

const SEARCH_DEBOUNCE_MS = 300;

export default function TaskFilters({ filters, onFiltersChange }: TaskFiltersProps) {
    const [taskTypeInput, setTaskTypeInput] = useState(filters.taskType || '');

    // Debounce the free-text search so each keystroke doesn't trigger a
    // fresh task-queue fetch -- only fire onFiltersChange once typing
    // pauses for SEARCH_DEBOUNCE_MS.
    useEffect(() => {
        const handle = setTimeout(() => {
            if (taskTypeInput !== (filters.taskType || '')) {
                onFiltersChange({
                    ...filters,
                    taskType: taskTypeInput || undefined,
                    offset: 0,
                });
            }
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(handle);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [taskTypeInput]);

    const handleReset = () => {
        setTaskTypeInput('');
        onFiltersChange({ limit: 50, offset: 0 });
    };

    return (
        <div className="flex flex-wrap gap-3 p-4 bg-gray-50 rounded-lg border border-[#E8E6E1]">
            <div className="flex-1 min-w-[200px]">
                <label htmlFor="status-filter" className="block text-xs font-medium text-gray-700 mb-1.5">Status</label>
                <Select
                    value={filters.status || 'all'}
                    onValueChange={(value) =>
                        onFiltersChange({
                            ...filters,
                            status: value === 'all' ? undefined : (value as any),
                            offset: 0,
                        })
                    }
                >
                    <SelectTrigger id="status-filter" aria-label="Status" className="bg-white">
                        <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="QUEUED">Queued</SelectItem>
                        <SelectItem value="LEASED">Leased</SelectItem>
                        <SelectItem value="RUNNING">Running</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="FAILED">Failed</SelectItem>
                        <SelectItem value="EXPIRED">Expired</SelectItem>
                        <SelectItem value="PERMANENTLY_FAILED">Permanently Failed</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
                <label htmlFor="priority-filter" className="block text-xs font-medium text-gray-700 mb-1.5">Priority</label>
                <Select
                    value={filters.priority || 'all'}
                    onValueChange={(value) =>
                        onFiltersChange({
                            ...filters,
                            priority: value === 'all' ? undefined : (value as any),
                            offset: 0,
                        })
                    }
                >
                    <SelectTrigger id="priority-filter" aria-label="Priority" className="bg-white">
                        <SelectValue placeholder="All priorities" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="NORMAL">Normal</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="CRITICAL">Critical</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Peer ID</label>
                <Input
                    placeholder="Search by peer ID..."
                    value={filters.assignedPeerId || ''}
                    onChange={(e) =>
                        onFiltersChange({
                            ...filters,
                            assignedPeerId: e.target.value || undefined,
                            offset: 0,
                        })
                    }
                    className="bg-white"
                />
            </div>

            <div className="flex-1 min-w-[200px]">
                <label htmlFor="task-type-search" className="block text-xs font-medium text-gray-700 mb-1.5">Search Tasks</label>
                <Input
                    id="task-type-search"
                    placeholder="Search tasks by type..."
                    value={taskTypeInput}
                    onChange={(e) => setTaskTypeInput(e.target.value)}
                    className="bg-white"
                />
            </div>

            <div className="flex items-end">
                <Button
                    variant="outline"
                    onClick={handleReset}
                    className="h-10"
                >
                    Reset
                </Button>
            </div>
        </div>
    );
}
