'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Task, TaskStatus, TaskGraphNode, TaskGraphLink, TaskGraphData } from '@/types/monitoring';
import { cn } from '@/lib/utils';

interface TaskDependencyGraphProps {
    tasks: Task[];
    width?: number;
    height?: number;
    className?: string;
    onTaskClick?: (task: Task) => void;
    showLegend?: boolean;
}

const STATUS_COLORS: Record<TaskStatus, string> = {
    'pending': '#94a3b8',      // slate-400
    'in-progress': '#3b82f6',  // blue-500
    'completed': '#22c55e',    // green-500
    'blocked': '#f59e0b',      // amber-500
    'failed': '#ef4444',       // red-500
};

const STATUS_LABELS: Record<TaskStatus, string> = {
    'pending': 'Pending',
    'in-progress': 'In Progress',
    'completed': 'Completed',
    'blocked': 'Blocked',
    'failed': 'Failed',
};

export default function TaskDependencyGraph({
    tasks,
    width = 800,
    height = 600,
    className,
    onTaskClick,
    showLegend = true,
}: TaskDependencyGraphProps) {
    const graphRef = useRef<any>();
    const [selectedStatus, setSelectedStatus] = useState<TaskStatus | 'all'>('all');
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);

    // Filter tasks based on selected status
    const filteredTasks = useMemo(() => {
        if (selectedStatus === 'all') return tasks;
        return tasks.filter(task => task.status === selectedStatus);
    }, [tasks, selectedStatus]);

    // Transform tasks to graph data structure
    const graphData = useMemo((): TaskGraphData => {
        const taskMap = new Map(filteredTasks.map(task => [task.id, task]));

        const nodes: TaskGraphNode[] = filteredTasks.map(task => ({
            id: task.id,
            name: task.name,
            status: task.status,
            val: 10, // Node size
            color: STATUS_COLORS[task.status],
        }));

        const links: TaskGraphLink[] = [];
        filteredTasks.forEach(task => {
            task.dependencies.forEach(depId => {
                // Only create link if both nodes exist in filtered set
                if (taskMap.has(depId)) {
                    links.push({
                        source: depId,
                        target: task.id,
                        color: '#64748b', // slate-500
                    });
                }
            });
        });

        return { nodes, links };
    }, [filteredTasks]);

    // Graph control handlers
    const handleZoomIn = useCallback(() => {
        if (graphRef.current) {
            const currentZoom = graphRef.current.zoom();
            graphRef.current.zoom(currentZoom * 1.2, 400);
        }
    }, []);

    const handleZoomOut = useCallback(() => {
        if (graphRef.current) {
            const currentZoom = graphRef.current.zoom();
            graphRef.current.zoom(currentZoom * 0.8, 400);
        }
    }, []);

    const handleResetView = useCallback(() => {
        if (graphRef.current) {
            graphRef.current.zoomToFit(400);
        }
    }, []);

    // Node interaction handlers
    const handleNodeClick = useCallback((node: any) => {
        const task = tasks.find(t => t.id === node.id);
        if (task && onTaskClick) {
            onTaskClick(task);
        }
    }, [tasks, onTaskClick]);

    const handleNodeHover = useCallback((node: any) => {
        setHoveredNode(node ? node.id : null);
    }, []);

    // Node label formatter
    const getNodeLabel = useCallback((node: any) => {
        return `${node.name} (${node.status})`;
    }, []);

    // Node color accessor
    const getNodeColor = useCallback((node: any) => {
        return node.color || '#94a3b8';
    }, []);

    // Link color accessor
    const getLinkColor = useCallback((link: any) => {
        return link.color || '#64748b';
    }, []);

    // Status filter buttons
    const statusFilters: Array<{ status: TaskStatus | 'all'; label: string }> = [
        { status: 'all', label: 'All' },
        { status: 'pending', label: 'Pending' },
        { status: 'in-progress', label: 'In Progress' },
        { status: 'completed', label: 'Completed' },
        { status: 'blocked', label: 'Blocked' },
        { status: 'failed', label: 'Failed' },
    ];

    // Empty state
    if (tasks.length === 0) {
        return (
            <div
                data-testid="task-dependency-graph"
                className={cn('flex items-center justify-center h-96 bg-slate-50 rounded-lg border border-slate-200', className)}
            >
                <div className="text-center">
                    <p className="text-slate-500 text-lg">No tasks to display</p>
                    <p className="text-slate-400 text-sm mt-1">Tasks will appear here once created</p>
                </div>
            </div>
        );
    }

    return (
        <div
            data-testid="task-dependency-graph"
            className={cn('w-full relative bg-slate-50 rounded-lg border border-slate-200', className)}
        >
            {/* Controls */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                <button
                    onClick={handleZoomIn}
                    aria-label="Zoom in"
                    className="p-2 bg-white rounded-lg shadow-md hover:bg-slate-50 transition-colors border border-slate-200"
                    title="Zoom in"
                >
                    <ZoomIn className="w-5 h-5 text-slate-700" />
                </button>
                <button
                    onClick={handleZoomOut}
                    aria-label="Zoom out"
                    className="p-2 bg-white rounded-lg shadow-md hover:bg-slate-50 transition-colors border border-slate-200"
                    title="Zoom out"
                >
                    <ZoomOut className="w-5 h-5 text-slate-700" />
                </button>
                <button
                    onClick={handleResetView}
                    aria-label="Reset view"
                    className="p-2 bg-white rounded-lg shadow-md hover:bg-slate-50 transition-colors border border-slate-200"
                    title="Reset view"
                >
                    <Maximize2 className="w-5 h-5 text-slate-700" />
                </button>
            </div>

            {/* Status Filters */}
            <div className="absolute top-4 right-4 z-10 flex flex-wrap gap-2 max-w-md">
                {statusFilters.map(({ status, label }) => {
                    const isActive = selectedStatus === status;
                    const color = status !== 'all' ? STATUS_COLORS[status] : '#64748b';

                    return (
                        <motion.button
                            key={status}
                            onClick={() => setSelectedStatus(status)}
                            className={cn(
                                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
                                'hover:shadow-md',
                                isActive
                                    ? 'text-white shadow-md scale-105'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            )}
                            style={
                                isActive
                                    ? { backgroundColor: color, borderColor: color }
                                    : undefined
                            }
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {label}
                        </motion.button>
                    );
                })}
            </div>

            {/* Legend */}
            <AnimatePresence>
                {showLegend && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-md p-4 border border-slate-200"
                    >
                        <h3 className="text-sm font-semibold text-slate-700 mb-2">Task Status</h3>
                        <div className="space-y-1.5">
                            {(Object.keys(STATUS_COLORS) as TaskStatus[]).map(status => (
                                <div key={status} className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: STATUS_COLORS[status] }}
                                    />
                                    <span className="text-xs text-slate-600">{STATUS_LABELS[status]}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Graph */}
            <div className="relative" style={{ width, height }}>
                <ForceGraph2D
                    ref={graphRef}
                    graphData={graphData}
                    width={width}
                    height={height}
                    nodeLabel={getNodeLabel}
                    nodeColor={getNodeColor}
                    linkColor={getLinkColor}
                    onNodeClick={handleNodeClick}
                    onNodeHover={handleNodeHover}
                    nodeRelSize={6}
                    linkWidth={2}
                    linkDirectionalArrowLength={6}
                    linkDirectionalArrowRelPos={1}
                    linkDirectionalParticles={2}
                    linkDirectionalParticleWidth={2}
                    linkDirectionalParticleSpeed={0.005}
                    d3AlphaDecay={0.02}
                    d3VelocityDecay={0.3}
                    cooldownTicks={100}
                    enableNodeDrag={true}
                    enableZoomInteraction={true}
                    enablePanInteraction={true}
                />
            </div>

            {/* Task Count Badge */}
            <div className="absolute bottom-4 right-4 z-10 bg-white rounded-lg shadow-md px-3 py-2 border border-slate-200">
                <span className="text-xs font-medium text-slate-600">
                    {filteredTasks.length} {filteredTasks.length === 1 ? 'Task' : 'Tasks'}
                </span>
            </div>
        </div>
    );
}
