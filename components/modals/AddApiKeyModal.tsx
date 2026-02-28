'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateApiKey } from '@/hooks/useApiKeys';
import type { ServiceName } from '@/types/api-keys';

interface AddApiKeyModalProps {
  open: boolean;
  onClose: () => void;
  existingServices?: ServiceName[];
}

const SERVICE_OPTIONS: Array<{ value: ServiceName; label: string }> = [
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'cohere', label: 'Cohere' },
  { value: 'huggingface', label: 'HuggingFace' },
];

export default function AddApiKeyModal({
  open,
  onClose,
  existingServices = [],
}: AddApiKeyModalProps) {
  const [serviceName, setServiceName] = useState<ServiceName | ''>('');
  const [keyValue, setKeyValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const createMutation = useCreateApiKey();

  const availableServices = SERVICE_OPTIONS.filter(
    (service) => !existingServices.includes(service.value)
  );

  const handleSave = async () => {
    if (!serviceName) {
      setError('Please select a service');
      return;
    }
    if (!keyValue.trim()) {
      setError('API key cannot be empty');
      return;
    }

    setError(null);

    try {
      await createMutation.mutateAsync({
        serviceName: serviceName as ServiceName,
        keyValue: keyValue.trim(),
      });
      handleClose();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'detail' in err) {
        setError(err.detail as string);
      } else {
        setError('Failed to save API key');
      }
    }
  };

  const handleClose = () => {
    if (!createMutation.isPending) {
      setServiceName('');
      setKeyValue('');
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add API Key</DialogTitle>
          <DialogDescription>
            Add a new API key for LLM provider integration. Keys are encrypted and stored securely.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="service">Service</Label>
            <Select
              value={serviceName}
              onValueChange={(value) => {
                setServiceName(value as ServiceName);
                setError(null);
              }}
              disabled={createMutation.isPending}
            >
              <SelectTrigger id="service">
                <SelectValue placeholder="Select a service..." />
              </SelectTrigger>
              <SelectContent>
                {availableServices.map((service) => (
                  <SelectItem key={service.value} value={service.value}>
                    {service.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input
              id="api-key"
              type="password"
              value={keyValue}
              onChange={(e) => {
                setKeyValue(e.target.value);
                setError(null);
              }}
              placeholder="Enter your API key"
              disabled={createMutation.isPending}
              className="font-mono"
            />
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={createMutation.isPending || !serviceName || !keyValue.trim()}
          >
            {createMutation.isPending ? 'Saving...' : 'Save Key'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
