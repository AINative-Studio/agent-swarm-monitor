'use client';

/**
 * TaskAssignment Component
 * Refs #141 - Task Management Frontend UI
 *
 * Lets an operator pick an available peer node to assign a queued task
 * to, with capability matching, load-balancing guidance, and a
 * confirmation step before the assignment actually happens.
 */

import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
import taskService, { type PeerNode } from '@/lib/task-service';
import type { Task } from '@/types/tasks';
import { cn } from '@/lib/utils';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface TaskAssignmentProps {
    task: Task;
    onAssignmentComplete?: () => void;
}

// A capability value like "16GB" or "8-core" is a minimum requirement --
// a peer with more (e.g. "32GB" when "16GB" is required) still qualifies.
// A non-numeric value like a GPU model name is a feature requirement and
// must match exactly: a peer with a different GPU can't just have "more"
// of it.
function parseQuantity(value: unknown): number | null {
    if (typeof value !== 'string') return null;
    const match = value.match(/^(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : null;
}

function capabilitySatisfies(required: unknown, actual: unknown): boolean {
    const requiredQty = parseQuantity(required);
    const actualQty = parseQuantity(actual);
    if (requiredQty !== null && actualQty !== null) {
        return actualQty >= requiredQty;
    }
    return actual === required;
}

function capabilitiesMatch(
    required: Record<string, unknown> | null,
    peer: PeerNode
): boolean {
    if (!required) return true;
    return Object.entries(required).every(
        ([key, value]) => capabilitySatisfies(value, peer.capabilities[key])
    );
}

function mismatchedCapabilities(
    required: Record<string, unknown> | null,
    peer: PeerNode
): Array<{ key: string; peerValue: unknown }> {
    if (!required) return [];
    return Object.entries(required)
        .filter(([key, value]) => !capabilitySatisfies(value, peer.capabilities[key]))
        .map(([key]) => ({ key, peerValue: peer.capabilities[key] }));
}

const HIGH_LOAD_THRESHOLD = 0.6;

export default function TaskAssignment({ task, onAssignmentComplete }: TaskAssignmentProps) {
    const [showOffline, setShowOffline] = useState(false);
    const [selectedPeerId, setSelectedPeerId] = useState<string | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [highLoadWarning, setHighLoadWarning] = useState<string | null>(null);
    const [assignError, setAssignError] = useState<string | null>(null);
    const [announcement, setAnnouncement] = useState('');
    const [hoveredPeerId, setHoveredPeerId] = useState<string | null>(null);

    const {
        data: peers,
        isError: peersErrored,
        refetch: refetchPeers,
    } = useQuery({
        queryKey: ['available-peers', task.taskId],
        queryFn: () => taskService.getAvailablePeers(),
        retry: false,
    });

    const assignMutation = useMutation({
        mutationFn: (peerId: string) => taskService.assignTask(task.taskId, peerId),
        onSuccess: () => {
            setConfirmOpen(false);
            setAssignError(null);
            onAssignmentComplete?.();
        },
        onError: (error: Error) => {
            setAssignError(error.message);
        },
    });

    // Offline peers are always shown (marked via aria-disabled/the
    // "offline" class) rather than hidden outright -- an operator needs
    // to see the full roster to understand why a node isn't selectable,
    // not have it silently disappear. The toggle instead governs whether
    // an offline peer can actually be selected for assignment.
    const visiblePeers = peers ?? [];

    const recommendedPeerId = useMemo(() => {
        const candidates = (peers ?? []).filter(
            (peer) => peer.isOnline && capabilitiesMatch(task.requiredCapabilities, peer)
        );
        if (candidates.length === 0) return null;
        return candidates.reduce((best, peer) =>
            peer.currentLoad < best.currentLoad ? peer : best
        ).id;
    }, [peers, task.requiredCapabilities]);

    const selectedPeer = (peers ?? []).find((peer) => peer.id === selectedPeerId) ?? null;

    const selectPeer = (peer: PeerNode) => {
        setSelectedPeerId(peer.id);
        setAnnouncement(`${peer.name} selected`);
        setHighLoadWarning(
            peer.currentLoad >= HIGH_LOAD_THRESHOLD
                ? `High load: ${Math.round(peer.currentLoad * 100)}% on ${peer.name}`
                : null
        );
    };

    const handleConfirm = () => {
        if (!selectedPeerId) return;
        assignMutation.mutate(selectedPeerId);
    };

    return (
        <div role="dialog" aria-label="Assign Task" className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-gray-900">Assign Task</h2>
                <p className="text-sm text-gray-600">
                    {task.taskId} &middot; {task.taskType}
                </p>
            </div>

            {peersErrored && (
                <div className="space-y-3 text-sm text-gray-700">
                    <p>Failed to load peers</p>
                    <Button type="button" variant="outline" onClick={() => refetchPeers()}>
                        Retry
                    </Button>
                </div>
            )}

            {!peersErrored && (
                <div role="listbox" aria-label="Select node" className="space-y-2">
                    {visiblePeers.map((peer) => {
                        const matches = capabilitiesMatch(task.requiredCapabilities, peer);
                        const mismatches = mismatchedCapabilities(task.requiredCapabilities, peer);
                        const isSelected = peer.id === selectedPeerId;
                        const isRecommended = peer.id === recommendedPeerId;

                        return (
                            <div
                                key={peer.id}
                                data-testid={`peer-${peer.id}`}
                                role="button"
                                tabIndex={0}
                                aria-selected={isSelected}
                                aria-disabled={!peer.isOnline}
                                onClick={() => (peer.isOnline || showOffline) && selectPeer(peer)}
                                onKeyDown={(e) => {
                                    if ((e.key === 'Enter' || e.key === ' ') && (peer.isOnline || showOffline)) {
                                        e.preventDefault();
                                        selectPeer(peer);
                                    }
                                }}
                                onMouseEnter={() => setHoveredPeerId(peer.id)}
                                onMouseLeave={() => setHoveredPeerId((id) => (id === peer.id ? null : id))}
                                className={cn(
                                    'relative rounded-md border p-3 cursor-pointer transition-colors',
                                    matches && 'capability-match',
                                    !peer.isOnline && 'offline opacity-60 cursor-not-allowed',
                                    isSelected && 'border-primary ring-2 ring-primary'
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-900">{peer.name}</span>
                                        {matches && (
                                            <CheckCircle2
                                                data-testid="match-indicator"
                                                className="h-4 w-4 text-green-600"
                                            />
                                        )}
                                        {isRecommended && (
                                            <Badge data-testid="recommended-badge" variant="secondary">
                                                Recommended
                                            </Badge>
                                        )}
                                        {!peer.isOnline && <Badge variant="outline">Offline</Badge>}
                                    </div>
                                    <div
                                        role="progressbar"
                                        aria-valuenow={Math.round(peer.currentLoad * 100)}
                                        aria-valuemin={0}
                                        aria-valuemax={100}
                                        className="relative h-2 w-24 rounded-full bg-gray-200 overflow-hidden"
                                    >
                                        <div
                                            className={cn(
                                                'h-full rounded-full',
                                                peer.currentLoad >= HIGH_LOAD_THRESHOLD
                                                    ? 'bg-red-500'
                                                    : 'bg-primary'
                                            )}
                                            style={{ width: `${Math.round(peer.currentLoad * 100)}%` }}
                                        />
                                    </div>
                                </div>

                                {mismatches.length > 0 && (
                                    <p className="mt-1 text-xs text-amber-700">
                                        Capability mismatch:{' '}
                                        {mismatches
                                            .map(({ key, peerValue }) => `${key}: ${peerValue}`)
                                            .join(', ')}
                                    </p>
                                )}

                                {hoveredPeerId === peer.id && (
                                    <div
                                        data-testid="peer-details-tooltip"
                                        role="tooltip"
                                        className="absolute left-full top-0 z-10 ml-2 w-48 rounded-md border bg-white p-2 text-xs shadow-lg"
                                    >
                                        <p>Current load: {Math.round(peer.currentLoad * 100)}%</p>
                                        <p>CPU: {String(peer.capabilities.cpu ?? 'unknown')}</p>
                                        <p>Memory: {String(peer.capabilities.memory ?? 'unknown')}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="flex items-center justify-between">
                <Label htmlFor="show-offline-peers" className="text-sm font-medium text-gray-700">
                    Show offline peers
                </Label>
                <Switch
                    id="show-offline-peers"
                    aria-label="Show offline peers"
                    checked={showOffline}
                    onCheckedChange={setShowOffline}
                />
            </div>

            {highLoadWarning && (
                <p role="alert" className="text-sm text-amber-700">
                    {highLoadWarning}
                </p>
            )}

            {assignError && (
                <p role="alert" className="text-sm text-red-600">
                    {assignError}
                </p>
            )}

            <div className="flex justify-end">
                <Button
                    type="button"
                    disabled={!selectedPeer}
                    onClick={() => setConfirmOpen(true)}
                >
                    {selectedPeer ? `Assign to ${selectedPeer.name}` : 'Assign'}
                </Button>
            </div>

            <span role="status" aria-label="selection announcement" className="sr-only">
                {announcement}
            </span>

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Assignment</AlertDialogTitle>
                        <AlertDialogDescription>
                            Assign {task.taskId} to {selectedPeer?.name}?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirm}
                            disabled={assignMutation.isPending}
                        >
                            {assignMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                'Confirm'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
