'use client';

import { useState, useEffect } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import ListErrorState from '@/components/openclaw/ListErrorState';
import type { CreateAgentRequest, HeartbeatInterval, OpenClawTemplate } from '@/types/openclaw';
import { MODEL_OPTIONS, HEARTBEAT_OPTIONS } from '@/lib/openclaw-utils';

interface CreateAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Must return a Promise that resolves on success and rejects on failure --
   * the dialog awaits it to decide whether to close/reset (success) or stay
   * open with an error banner and the user's input intact (failure). See
   * issue #108.
   */
  onSubmit: (data: CreateAgentRequest) => Promise<unknown>;
  template?: OpenClawTemplate | null;
  /** Mutation pending state, surfaced as a disabled/loading submit button. */
  isSubmitting?: boolean;
}

export default function CreateAgentDialog({
  open,
  onOpenChange,
  onSubmit,
  template,
  isSubmitting = false,
}: CreateAgentDialogProps) {
  const [name, setName] = useState('');
  const [model, setModel] = useState('anthropic/claude-opus-4-5');
  const [persona, setPersona] = useState('');
  const [heartbeatEnabled, setHeartbeatEnabled] = useState(false);
  const [heartbeatInterval, setHeartbeatInterval] = useState('5m');
  const [checklist, setChecklist] = useState('');
  const [submitError, setSubmitError] = useState<unknown>(null);

  useEffect(() => {
    if (template) {
      setName(template.name);
      setModel(template.defaultModel || 'anthropic/claude-opus-4-5');
      setPersona(template.defaultPersona || '');
      setHeartbeatEnabled(!!template.defaultHeartbeatInterval);
      setHeartbeatInterval(template.defaultHeartbeatInterval || '5m');
      setChecklist(
        template.defaultChecklist?.join('\n') || ''
      );
    } else {
      setName('');
      setModel('anthropic/claude-opus-4-5');
      setPersona('');
      setHeartbeatEnabled(false);
      setHeartbeatInterval('5m');
      setChecklist('');
    }
    setSubmitError(null);
  }, [template]);

  const resetForm = () => {
    setName('');
    setModel('anthropic/claude-opus-4-5');
    setPersona('');
    setHeartbeatEnabled(false);
    setHeartbeatInterval('5m');
    setChecklist('');
    setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitError(null);

    const checklistItems = checklist
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const data: CreateAgentRequest = {
      name: name.trim(),
      model,
      persona: persona.trim() || undefined,
    };

    if (heartbeatEnabled) {
      data.heartbeat = {
        enabled: true,
        interval: heartbeatInterval as HeartbeatInterval,
        checklist: checklistItems.length > 0 ? checklistItems : undefined,
      };
    }

    try {
      await onSubmit(data);
      // Only clear the form and close the dialog on confirmed success --
      // see issue #108. On failure, the form stays open with the user's
      // input intact and an error banner below.
      resetForm();
      onOpenChange(false);
    } catch (error) {
      setSubmitError(error);
    }
  };

  const isValid = name.trim().length > 0;
  const isFromTemplate = !!template;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-gray-200 sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gray-900">
            {isFromTemplate ? 'Create Agent from Template' : 'Create Agent'}
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            {isFromTemplate
              ? `Pre-filled from "${template.name}" template. Adjust settings as needed.`
              : 'Create a new AI agent to automate tasks and workflows.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {submitError != null && (
            <ListErrorState
              error={submitError}
              onRetry={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
            />
          )}

          <div className="space-y-2">
            <Label htmlFor="agent-name" className="text-gray-700 text-sm">
              Name
            </Label>
            <Input
              id="agent-name"
              placeholder="My Agent"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-model" className="text-gray-700 text-sm">
              Model
            </Label>
            <Select value={model} onValueChange={setModel} disabled={isSubmitting}>
              <SelectTrigger
                id="agent-model"
                className="bg-white border-gray-200 text-gray-900"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                {MODEL_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="text-gray-900"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-persona" className="text-gray-700 text-sm">
              Persona
            </Label>
            <Textarea
              id="agent-persona"
              placeholder="Describe the agent's role and behavior..."
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              disabled={isSubmitting}
              rows={4}
              className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 resize-none"
            />
          </div>

          {/* Heartbeat section */}
          <div className="space-y-3 rounded-lg border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="heartbeat-toggle" className="text-gray-700 text-sm">
                Heartbeat
              </Label>
              <Switch
                id="heartbeat-toggle"
                checked={heartbeatEnabled}
                onCheckedChange={setHeartbeatEnabled}
                disabled={isSubmitting}
              />
            </div>

            {heartbeatEnabled && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="heartbeat-interval" className="text-gray-700 text-sm">
                    Interval
                  </Label>
                  <Select value={heartbeatInterval} onValueChange={setHeartbeatInterval}>
                    <SelectTrigger
                      id="heartbeat-interval"
                      className="bg-white border-gray-200 text-gray-900"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      {HEARTBEAT_OPTIONS.map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value}
                          className="text-gray-900"
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="heartbeat-checklist" className="text-gray-700 text-sm">
                    Checklist (one item per line)
                  </Label>
                  <Textarea
                    id="heartbeat-checklist"
                    placeholder="Check for new issues&#10;Review open PRs&#10;Post status update"
                    value={checklist}
                    onChange={(e) => setChecklist(e.target.value)}
                    rows={3}
                    className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 resize-none text-sm"
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="border-gray-200 text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
