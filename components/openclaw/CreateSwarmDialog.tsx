'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useAgentList } from '@/hooks/useOpenClawAgents';
import type { CreateSwarmRequest, CoordinationStrategy } from '@/types/openclaw';

interface CreateSwarmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: CreateSwarmRequest) => void;
}

const STRATEGY_OPTIONS: { value: CoordinationStrategy; label: string; description: string }[] = [
    { value: 'parallel', label: 'Parallel', description: 'Agents work independently' },
    { value: 'sequential', label: 'Sequential', description: 'Agents work in sequence' },
    { value: 'hierarchical', label: 'Hierarchical', description: 'Leader-follower pattern' },
];

export default function CreateSwarmDialog({
    open,
    onOpenChange,
    onSubmit,
}: CreateSwarmDialogProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [strategy, setStrategy] = useState<CoordinationStrategy>('parallel');
    const [goal, setGoal] = useState('');
    const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);

    const { data: agentData } = useAgentList();
    const agents = agentData?.agents ?? [];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        onSubmit({
            name: name.trim(),
            strategy,
            description: description.trim() || undefined,
            goal: goal.trim() || undefined,
            agentIds: selectedAgentIds.length > 0 ? selectedAgentIds : undefined,
        });

        setName('');
        setDescription('');
        setStrategy('parallel');
        setGoal('');
        setSelectedAgentIds([]);
        onOpenChange(false);
    };

    const toggleAgent = (agentId: string) => {
        setSelectedAgentIds((prev) =>
            prev.includes(agentId)
                ? prev.filter((id) => id !== agentId)
                : [...prev, agentId]
        );
    };

    const isValid = name.trim().length > 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white border-gray-200 sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-gray-900">Create Swarm</DialogTitle>
                    <DialogDescription className="text-gray-500">
                        Create a new agent swarm to coordinate multiple agents together.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="swarm-name" className="text-gray-700 text-sm">
                            Name
                        </Label>
                        <Input
                            id="swarm-name"
                            placeholder="My Swarm"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="swarm-strategy" className="text-gray-700 text-sm">
                            Strategy
                        </Label>
                        <Select value={strategy} onValueChange={(v) => setStrategy(v as CoordinationStrategy)}>
                            <SelectTrigger
                                id="swarm-strategy"
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
                                        {opt.label} — {opt.description}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="swarm-goal" className="text-gray-700 text-sm">
                            Goal
                        </Label>
                        <Textarea
                            id="swarm-goal"
                            placeholder="What should this swarm accomplish?"
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            rows={2}
                            className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 resize-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="swarm-description" className="text-gray-700 text-sm">
                            Description
                        </Label>
                        <Textarea
                            id="swarm-description"
                            placeholder="Optional description..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 resize-none"
                        />
                    </div>

                    {agents.length > 0 && (
                        <div className="space-y-2">
                            <Label className="text-gray-700 text-sm">
                                Agents ({selectedAgentIds.length} selected)
                            </Label>
                            <div className="max-h-36 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
                                {agents
                                    .filter((a) => a.status !== 'stopped')
                                    .map((agent) => (
                                        <label
                                            key={agent.id}
                                            className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedAgentIds.includes(agent.id)}
                                                onChange={() => toggleAgent(agent.id)}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-900">{agent.name}</span>
                                            <span className="text-xs text-gray-400 ml-auto">{agent.status}</span>
                                        </label>
                                    ))}
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="border-gray-200 text-gray-700 bg-white hover:bg-gray-50"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!isValid}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Create
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
