'use client';

import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import TaskHistoryTimeline from './TaskHistoryTimeline';
import { useTaskDetails, useTaskHistory } from '@/hooks/useTasks';

interface TaskDetailDrawerProps {
    taskId: string | null;
    isOpen: boolean;
    onClose: () => void;
}

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

export default function TaskDetailDrawer({ taskId, isOpen, onClose }: TaskDetailDrawerProps) {
    const { data: task, isLoading: taskLoading } = useTaskDetails(taskId);
    const { data: history, isLoading: historyLoading } = useTaskHistory(taskId);

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Task Details</SheetTitle>
                    <SheetDescription>
                        {taskId ? 'Task ID: ' + taskId.slice(0, 16) + '...' : 'Loading...'}
                    </SheetDescription>
                </SheetHeader>

                {taskLoading ? (
                    <div className="mt-6 space-y-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
                        ))}
                    </div>
                ) : task ? (
                    <div className="mt-6">
                        <Tabs defaultValue="overview" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                <TabsTrigger value="payload">Payload</TabsTrigger>
                                <TabsTrigger value="history">History</TabsTrigger>
                            </TabsList>

                            <TabsContent value="overview" className="space-y-4 mt-4">
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <div className="text-xs font-medium text-gray-600 mb-1.5">
                                            Status
                                        </div>
                                        <span
                                            className={'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ' +
                                                STATUS_COLORS[task.status]}
                                        >
                                            {task.status}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-xs font-medium text-gray-600 mb-1.5">
                                            Priority
                                        </div>
                                        <Badge className={PRIORITY_COLORS[task.priority]}>
                                            {task.priority}
                                        </Badge>
                                    </div>
                                </div>

                                <div>
                                    <div className="text-xs font-medium text-gray-600 mb-1.5">
                                        Task Type
                                    </div>
                                    <div className="text-sm text-gray-900">{task.taskType}</div>
                                </div>

                                <div>
                                    <div className="text-xs font-medium text-gray-600 mb-1.5">
                                        Task ID
                                    </div>
                                    <div className="text-sm font-mono text-gray-900 break-all">
                                        {task.taskId}
                                    </div>
                                </div>

                                <div>
                                    <div className="text-xs font-medium text-gray-600 mb-1.5">
                                        Assigned Peer
                                    </div>
                                    <div className="text-sm font-mono text-gray-900">
                                        {task.assignedPeerId || '-'}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-xs font-medium text-gray-600 mb-1.5">
                                            Retry Count
                                        </div>
                                        <div className="text-sm text-gray-900">
                                            {task.retryCount} / {task.maxRetries}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <div className="text-xs font-medium text-gray-600 mb-1.5">
                                            Created At
                                        </div>
                                        <div className="text-sm text-gray-900">
                                            {new Date(task.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-medium text-gray-600 mb-1.5">
                                            Updated At
                                        </div>
                                        <div className="text-sm text-gray-900">
                                            {new Date(task.updatedAt).toLocaleString()}
                                        </div>
                                    </div>
                                    {task.completedAt && (
                                        <div>
                                            <div className="text-xs font-medium text-gray-600 mb-1.5">
                                                Completed At
                                            </div>
                                            <div className="text-sm text-gray-900">
                                                {new Date(task.completedAt).toLocaleString()}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {task.errorMessage && (
                                    <div>
                                        <div className="text-xs font-medium text-gray-600 mb-1.5">
                                            Error Message
                                        </div>
                                        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
                                            {task.errorMessage}
                                        </div>
                                    </div>
                                )}

                                {task.result && (
                                    <div>
                                        <div className="text-xs font-medium text-gray-600 mb-1.5">
                                            Result
                                        </div>
                                        <pre className="text-xs text-gray-900 bg-gray-50 border border-gray-200 rounded p-3 overflow-x-auto">
                                            {JSON.stringify(task.result, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="payload" className="mt-4">
                                <div className="text-xs font-medium text-gray-600 mb-3">
                                    Task Payload
                                </div>
                                <pre className="text-xs text-gray-900 bg-gray-50 border border-gray-200 rounded p-4 overflow-x-auto">
                                    {JSON.stringify(task.payload, null, 2)}
                                </pre>

                                {task.requiredCapabilities && (
                                    <div className="mt-4">
                                        <div className="text-xs font-medium text-gray-600 mb-3">
                                            Required Capabilities
                                        </div>
                                        <pre className="text-xs text-gray-900 bg-gray-50 border border-gray-200 rounded p-4 overflow-x-auto">
                                            {JSON.stringify(task.requiredCapabilities, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="history" className="mt-4">
                                <TaskHistoryTimeline
                                    events={history?.events || []}
                                    isLoading={historyLoading}
                                />
                            </TabsContent>
                        </Tabs>
                    </div>
                ) : (
                    <div className="mt-6 text-center text-gray-500">Task not found</div>
                )}
            </SheetContent>
        </Sheet>
    );
}
