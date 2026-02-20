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
import type { CreateAgentRequest } from '@/types/openclaw';
import { MODEL_OPTIONS } from '@/lib/openclaw-utils';

interface CreateAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateAgentRequest) => void;
}

export default function CreateAgentDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateAgentDialogProps) {
  const [name, setName] = useState('');
  const [model, setModel] = useState('anthropic/claude-opus-4-5');
  const [persona, setPersona] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSubmit({
      name: name.trim(),
      model,
      persona: persona.trim() || undefined,
    });

    setName('');
    setModel('anthropic/claude-opus-4-5');
    setPersona('');
    onOpenChange(false);
  };

  const isValid = name.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-gray-200 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Create Agent</DialogTitle>
          <DialogDescription className="text-gray-500">
            Create a new AI agent to automate tasks and workflows.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agent-name" className="text-gray-700 text-sm">
              Name
            </Label>
            <Input
              id="agent-name"
              placeholder="My Agent"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-model" className="text-gray-700 text-sm">
              Model
            </Label>
            <Select value={model} onValueChange={setModel}>
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
              rows={4}
              className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 resize-none"
            />
          </div>

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
