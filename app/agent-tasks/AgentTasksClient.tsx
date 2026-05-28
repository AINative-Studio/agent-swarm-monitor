'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/openclaw-utils';
import TaskCreateForm from '@/components/tasks/TaskCreateForm';
import { Button } from '@/components/ui/button';
import { Plus, ListTodo, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useTaskQueue as useTaskList } from '@/hooks/useTasks';

export default function AgentTasksClient() {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState<'all' | 'QUEUED' | 'RUNNING' | 'COMPLETED'>('all');

    // Map UI filter to TaskStatus enum
    const getTaskStatus = () => {
        if (selectedFilter === 'all') return undefined;
        return selectedFilter;
    };

    const { data: tasks, isLoading } = useTaskList({
        status: getTaskStatus(),
        limit: 50,
    });

    const handleTaskCreated = () => {
        setShowCreateForm(false);
        // Tasks will auto-refresh via SWR
    };

    const stats = tasks ? {
        total: tasks.totalCount || 0,
        queued: tasks.tasks?.filter(t => t.status === 'QUEUED').length || 0,
        running: tasks.tasks?.filter(t => t.status === 'RUNNING').length || 0,
        completed: tasks.tasks?.filter(t => t.status === 'COMPLETED').length || 0,
    } : { total: 0, queued: 0, running: 0, completed: 0 };

    return (
        <div className="space-y-8">
            {/* Header */}
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Agent Tasks</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Create and manage tasks for your non-technical agents
                        </p>
                    </div>
                    <Button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="bg-[#A88B5F] hover:bg-[#8B7350] text-white"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Task
                    </Button>
                </div>
            </motion.div>

            {/* Stats Cards */}
            <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <button
                        onClick={() => setSelectedFilter('all')}
                        className={`rounded-lg border p-4 text-left transition-all ${
                            selectedFilter === 'all'
                                ? 'border-[#A88B5F] bg-[#FAF9F7]'
                                : 'border-[#E8E6E1] bg-white hover:border-gray-300'
                        }`}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <ListTodo className="w-4 h-4 text-gray-600" />
                            <div className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                                Total Tasks
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            {stats.total}
                        </div>
                    </button>

                    <button
                        onClick={() => setSelectedFilter('QUEUED')}
                        className={`rounded-lg border p-4 text-left transition-all ${
                            selectedFilter === 'QUEUED'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-[#E8E6E1] bg-white hover:border-gray-300'
                        }`}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-4 h-4 text-blue-600" />
                            <div className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                                Queued
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-blue-600">
                            {stats.queued}
                        </div>
                    </button>

                    <button
                        onClick={() => setSelectedFilter('RUNNING')}
                        className={`rounded-lg border p-4 text-left transition-all ${
                            selectedFilter === 'RUNNING'
                                ? 'border-amber-500 bg-amber-50'
                                : 'border-[#E8E6E1] bg-white hover:border-gray-300'
                        }`}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-amber-600" />
                            <div className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                                Running
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-amber-600">
                            {stats.running}
                        </div>
                    </button>

                    <button
                        onClick={() => setSelectedFilter('COMPLETED')}
                        className={`rounded-lg border p-4 text-left transition-all ${
                            selectedFilter === 'COMPLETED'
                                ? 'border-green-500 bg-green-50'
                                : 'border-[#E8E6E1] bg-white hover:border-gray-300'
                        }`}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <div className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                                Completed
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                            {stats.completed}
                        </div>
                    </button>
                </div>
            </motion.div>

            {/* Create Form */}
            {showCreateForm && (
                <motion.div
                    custom={2}
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    className="rounded-lg border border-[#E8E6E1] bg-white p-6"
                >
                    <h2 className="text-lg font-semibold mb-4">Create New Task</h2>
                    <TaskCreateForm onSuccess={handleTaskCreated} />
                </motion.div>
            )}

            {/* Task List */}
            <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
                <div className="rounded-lg border border-[#E8E6E1] bg-white">
                    <div className="p-6 border-b border-[#E8E6E1]">
                        <h2 className="text-lg font-semibold">
                            {selectedFilter === 'all' ? 'All Tasks' :
                             selectedFilter === 'QUEUED' ? 'Queued Tasks' :
                             selectedFilter === 'RUNNING' ? 'Running Tasks' :
                             'Completed Tasks'}
                        </h2>
                    </div>

                    <div className="p-6">
                        {isLoading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-20 bg-gray-50 rounded animate-pulse" />
                                ))}
                            </div>
                        ) : tasks?.tasks && tasks.tasks.length > 0 ? (
                            <div className="space-y-3">
                                {tasks.tasks.map((task: any) => (
                                    <div
                                        key={task.id}
                                        className="border border-[#E8E6E1] rounded-lg p-4 hover:border-[#A88B5F] transition-colors"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-medium text-gray-900">
                                                        {task.title || task.task_id}
                                                    </h3>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                        task.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                        task.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-blue-100 text-blue-700'
                                                    }`}>
                                                        {task.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    {task.description || task.payload?.description || 'No description'}
                                                </p>
                                                {task.assigned_peer_id && (
                                                    <p className="text-xs text-gray-500 mt-2">
                                                        Assigned to: {task.assigned_peer_id}
                                                    </p>
                                                )}
                                            </div>
                                            {task.created_at && (
                                                <span className="text-xs text-gray-500">
                                                    {new Date(task.created_at).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <ListTodo className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">
                                    {selectedFilter === 'all'
                                        ? 'No tasks yet. Create your first task above!'
                                        : `No ${selectedFilter.replace('_', ' ')} tasks`}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
