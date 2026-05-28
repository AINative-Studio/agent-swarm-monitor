'use client';

/**
 * TaskCreateForm Component
 * Refs #141 - Task Management Frontend UI
 *
 * Form for creating new tasks with validation, JSON formatting,
 * and capability requirements configuration.
 */

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import taskService from '@/lib/task-service';
import type { TaskPriority } from '@/types/tasks';
import { Loader2, Plus, Trash2, Check } from 'lucide-react';

interface TaskCreateFormProps {
    onSuccess?: () => void;
}

interface CapabilityRequirement {
    type: string;
    value: string;
}

const COMMON_TASK_TYPES = [
    'code_generation',
    'data_analysis',
    'api_request',
    'file_processing',
    'model_inference',
];

export default function TaskCreateForm({ onSuccess }: TaskCreateFormProps) {
    const queryClient = useQueryClient();
    const [taskType, setTaskType] = useState('');
    const [priority, setPriority] = useState<TaskPriority>('NORMAL');
    const [payload, setPayload] = useState('{}');
    const [maxRetries, setMaxRetries] = useState(3);
    const [capabilities, setCapabilities] = useState<CapabilityRequirement[]>([]);
    const [payloadError, setPayloadError] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [submitError, setSubmitError] = useState('');

    const createTaskMutation = useMutation({
        mutationFn: async (data: {
            taskType: string;
            priority: TaskPriority;
            payload: Record<string, unknown>;
            requiredCapabilities: Record<string, unknown> | null;
            maxRetries: number;
        }) => {
            return await taskService.createTask(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['task-queue'] });
            queryClient.invalidateQueries({ queryKey: ['task-stats'] });
            resetForm();
            if (onSuccess) {
                onSuccess();
            }
        },
        onError: (error: Error) => {
            setSubmitError(error.message);
        },
    });

    const validateJSON = (value: string): boolean => {
        try {
            JSON.parse(value);
            setPayloadError('');
            return true;
        } catch (error) {
            setPayloadError('Invalid JSON format');
            return false;
        }
    };

    const handlePayloadChange = (value: string) => {
        setPayload(value);
        if (value.trim()) {
            validateJSON(value);
        } else {
            setPayloadError('');
        }
    };

    const formatJSON = () => {
        if (validateJSON(payload)) {
            try {
                const parsed = JSON.parse(payload);
                setPayload(JSON.stringify(parsed, null, 2));
            } catch {
                // Error already handled by validateJSON
            }
        }
    };

    const addCapability = () => {
        setCapabilities([...capabilities, { type: '', value: '' }]);
    };

    const removeCapability = (index: number) => {
        setCapabilities(capabilities.filter((_, i) => i !== index));
    };

    const updateCapability = (index: number, field: 'type' | 'value', value: string) => {
        const updated = [...capabilities];
        updated[index][field] = value;
        setCapabilities(updated);
    };

    const resetForm = () => {
        setTaskType('');
        setPriority('NORMAL');
        setPayload('{}');
        setMaxRetries(3);
        setCapabilities([]);
        setPayloadError('');
        setSubmitError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError('');

        if (!taskType.trim()) {
            setSubmitError('Task type is required');
            return;
        }

        if (!validateJSON(payload)) {
            return;
        }

        try {
            const parsedPayload = JSON.parse(payload);
            const requiredCapabilities =
                capabilities.length > 0
                    ? capabilities.reduce((acc, cap) => {
                          if (cap.type && cap.value) {
                              acc[cap.type] = cap.value;
                          }
                          return acc;
                      }, {} as Record<string, unknown>)
                    : null;

            await createTaskMutation.mutateAsync({
                taskType,
                priority,
                payload: parsedPayload,
                requiredCapabilities,
                maxRetries,
            });
        } catch (error) {
            // Error handled by mutation
        }
    };

    const filteredSuggestions = COMMON_TASK_TYPES.filter((type) =>
        type.toLowerCase().includes(taskType.toLowerCase())
    );

    return (
        <form
            onSubmit={handleSubmit}
            aria-label="Task creation form"
            className="space-y-6"
        >
            <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Create New Task
                </h2>
            </div>

            {submitError && (
                <Alert variant="destructive" role="alert" aria-live="assertive">
                    <AlertDescription>{submitError}</AlertDescription>
                </Alert>
            )}

            {/* Task Type */}
            <div className="space-y-2">
                <Label htmlFor="taskType" className="text-sm font-medium text-gray-700">
                    Task Type *
                </Label>
                <div className="relative">
                    <Input
                        id="taskType"
                        value={taskType}
                        onChange={(e) => setTaskType(e.target.value)}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        placeholder="e.g., code_generation"
                        required
                        aria-required="true"
                        className="w-full"
                    />
                    {showSuggestions && filteredSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                            {filteredSuggestions.map((suggestion) => (
                                <button
                                    key={suggestion}
                                    type="button"
                                    onClick={() => {
                                        setTaskType(suggestion);
                                        setShowSuggestions(false);
                                    }}
                                    className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-md last:rounded-b-md"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Priority */}
            <div className="space-y-2">
                <Label htmlFor="priority" className="text-sm font-medium text-gray-700">
                    Priority *
                </Label>
                <Select value={priority} onValueChange={(value: TaskPriority) => setPriority(value)}>
                    <SelectTrigger
                        id="priority"
                        aria-required="true"
                        className="w-full"
                    >
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="NORMAL">Normal</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="CRITICAL">Critical</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Payload */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="payload" className="text-sm font-medium text-gray-700">
                        Payload (JSON) *
                    </Label>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={formatJSON}
                        className="text-xs"
                    >
                        Format JSON
                    </Button>
                </div>
                <Textarea
                    id="payload"
                    value={payload}
                    onChange={(e) => handlePayloadChange(e.target.value)}
                    onBlur={() => validateJSON(payload)}
                    placeholder='{"key": "value"}'
                    required
                    rows={6}
                    className="font-mono text-sm w-full"
                />
                {payloadError && (
                    <p className="text-sm text-red-600" role="alert">
                        {payloadError}
                    </p>
                )}
            </div>

            {/* Max Retries */}
            <div className="space-y-2">
                <Label htmlFor="maxRetries" className="text-sm font-medium text-gray-700">
                    Max Retries
                </Label>
                <Input
                    id="maxRetries"
                    type="number"
                    min="0"
                    max="10"
                    value={maxRetries}
                    onChange={(e) => setMaxRetries(parseInt(e.target.value, 10))}
                    className="w-full"
                />
            </div>

            {/* Capability Requirements */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-700">
                        Capability Requirements
                    </Label>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addCapability}
                        className="text-xs"
                    >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Capability
                    </Button>
                </div>
                {capabilities.map((cap, index) => (
                    <div key={index} className="flex gap-2 items-start">
                        <div className="flex-1">
                            <Input
                                placeholder="Type (e.g., gpu)"
                                value={cap.type}
                                onChange={(e) => updateCapability(index, 'type', e.target.value)}
                                aria-label="Capability type"
                                className="mb-2"
                            />
                            <Input
                                placeholder="Value (e.g., nvidia-a100)"
                                value={cap.value}
                                onChange={(e) => updateCapability(index, 'value', e.target.value)}
                                aria-label="Capability value"
                            />
                        </div>
                        {cap.type && cap.value && (
                            <div
                                className="flex-shrink-0 mt-1"
                                data-testid="capability-valid-indicator"
                            >
                                <Check className="w-5 h-5 text-green-600" />
                            </div>
                        )}
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCapability(index)}
                            aria-label="Remove capability"
                            className="flex-shrink-0"
                        >
                            <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                    </div>
                ))}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    disabled={createTaskMutation.isPending}
                >
                    Reset
                </Button>
                <Button
                    type="submit"
                    disabled={createTaskMutation.isPending || !!payloadError}
                >
                    {createTaskMutation.isPending && (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" data-testid="loading-spinner" />
                            Creating...
                        </>
                    )}
                    {!createTaskMutation.isPending && 'Create Task'}
                </Button>
            </div>
        </form>
    );
}
