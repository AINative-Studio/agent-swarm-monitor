'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { OpenClawAgent } from '@/types/openclaw';

interface AgentPickerProps {
  agents: OpenClawAgent[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  className?: string;
}

export default function AgentPicker({
  agents,
  selectedId,
  onSelect,
  className,
}: AgentPickerProps) {
  return (
    <Select value={selectedId} onValueChange={onSelect}>
      <SelectTrigger
        className={cn(
          'w-[220px] bg-white border-gray-200 text-gray-900 text-sm',
          className
        )}
        aria-label="Select an agent"
      >
        <SelectValue placeholder="Select an agent" />
      </SelectTrigger>
      <SelectContent className="bg-white border-gray-200">
        {agents.map((agent) => (
          <SelectItem
            key={agent.id}
            value={agent.id}
            className="text-sm text-gray-900"
          >
            {agent.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
