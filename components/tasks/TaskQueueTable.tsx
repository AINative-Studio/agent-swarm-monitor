'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import type { Task } from '@/types/tasks';

const STATUS_COLORS = {
    QUEUED: 'bg-blue-50 text-blue-700 border-blue-200',
    LEASED: 'bg-purple-50 text-purple-700 border-purple-200',
    RUNNING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    COMPLETED: 'bg-green-50 text-green-700 border-green-200',
    FAILED: 'bg-red-50 text-red-700 border-red-200',
    EXPIRED: 'bg-orange-50 text-orange-700 border-orange-200',
    PERMANENTLY_FAILED: 'bg-gray-50 text-gray-700 border-gray-300',
} as const;

const PRIORITY_COLORS = {
    LOW: 'bg-gray-100 text-gray-600',
    NORMAL: 'bg-blue-100 text-blue-600',
    HIGH: 'bg-orange-100 text-orange-600',
    CRITICAL: 'bg-red-100 text-red-600',
} as const;

interface TaskQueueTableProps {
    tasks: Task[];
    onTaskClick: (taskId: string) => void;
    isLoading?: boolean;
}

type SortKey = 'createdAt' | 'priority' | 'status';
type SortDirection = 'asc' | 'desc';

export default function TaskQueueTable({ tasks, onTaskClick, isLoading }: TaskQueueTableProps) {
    const [sortKey, setSortKey] = useState<SortKey>('createdAt');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('desc');
        }
    };

    const sortedTasks = [...tasks].sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        if (sortKey === 'createdAt') {
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
        } else if (sortKey === 'priority') {
            const priorityOrder = { LOW: 0, NORMAL: 1, HIGH: 2, CRITICAL: 3 };
            aValue = priorityOrder[a.priority];
            bValue = priorityOrder[b.priority];
        } else {
            aValue = a.status;
            bValue = b.status;
        }

        if (sortDirection === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    if (isLoading) {
        return (
            <div className="rounded-lg border border-[#E8E6E1] overflow-hidden">
                <div className="animate-pulse space-y-2 p-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-12 bg-gray-100 rounded" />
                    ))}
                </div>
            </div>
        );
    }

    if (tasks.length === 0) {
        return (
            <div className="rounded-lg border border-[#E8E6E1] p-8 text-center text-gray-500">
                No tasks found
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-[#E8E6E1] overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#E8E6E1]">
                    <thead className="bg-gray-50">
                        <tr>
                            <th
                                className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('createdAt')}
                            >
                                <div className="flex items-center gap-1">
                                    Task ID
                                    {sortKey === 'createdAt' && (
                                        <span className="text-gray-400">
                                            {sortDirection === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </div>
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Type
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('status')}
                            >
                                <div className="flex items-center gap-1">
                                    Status
                                    {sortKey === 'status' && (
                                        <span className="text-gray-400">
                                            {sortDirection === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('priority')}
                            >
                                <div className="flex items-center gap-1">
                                    Priority
                                    {sortKey === 'priority' && (
                                        <span className="text-gray-400">
                                            {sortDirection === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </div>
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Peer
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Retries
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Created
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-[#E8E6E1]">
                        {sortedTasks.map((task) => (
                            <tr
                                key={task.id}
                                onClick={() => onTaskClick(task.id)}
                                className="hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                                <td className="px-4 py-3 text-sm font-mono text-gray-900">
                                    {task.taskId.slice(0, 8)}...
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700">{task.taskType}</td>
                                <td className="px-4 py-3 text-sm">
                                    <span
                                        className={'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ' +
                                            STATUS_COLORS[task.status]}
                                    >
                                        {task.status}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    <Badge className={PRIORITY_COLORS[task.priority]}>
                                        {task.priority}
                                    </Badge>
                                </td>
                                <td className="px-4 py-3 text-sm font-mono text-gray-600">
                                    {task.assignedPeerId ? task.assignedPeerId.slice(0, 12) + '...' : '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                    {task.retryCount}/{task.maxRetries}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                    {new Date(task.createdAt).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
