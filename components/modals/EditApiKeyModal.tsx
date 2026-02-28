'use client';

import { useState, useEffect } from 'react';
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
import { useUpdateApiKey } from '@/hooks/useApiKeys';
import type { ServiceName } from '@/types/api-keys';

interface EditApiKeyModalProps {
  open: boolean;
  onClose: () => void;
  serviceName: ServiceName | null;
  serviceLabel: string;
}

export default function EditApiKeyModal({
  open,
  onClose,
  serviceName,
  serviceLabel,
}: EditApiKeyModalProps) {
  const [keyValue, setKeyValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const updateMutation = useUpdateApiKey();

  useEffect(() => {
    if (!open) {
      setKeyValue('');
      setError(null);
    }
  }, [open]);

  const handleSave = async () => {
    if (!serviceName) {
      setError('Service name is required');
      return;
    }
    if (!keyValue.trim()) {
      setError('API key cannot be empty');
      return;
    }

    setError(null);

    try {
      await updateMutation.mutateAsync({
        serviceName,
        data: { keyValue: keyValue.trim() },
      });
      handleClose();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'detail' in err) {
        setError(err.detail as string);
      } else {
        setError('Failed to update API key');
      }
    }
  };

  const handleClose = () => {
    if (!updateMutation.isPending) {
      setKeyValue('');
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update {serviceLabel} API Key</DialogTitle>
          <DialogDescription>
            Enter a new API key for {serviceLabel}. The old key will be replaced.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="service-display" className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Service
            </Label>
            <div className="px-3 py-2 bg-gray-50 rounded-md border border-gray-200">
              <p className="text-sm text-gray-700">{serviceLabel}</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="api-key">New API Key</Label>
            <Input
              id="api-key"
              type="password"
              value={keyValue}
              onChange={(e) => {
                setKeyValue(e.target.value);
                setError(null);
              }}
              placeholder="Enter your new API key"
              disabled={updateMutation.isPending}
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
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending || !keyValue.trim()}
          >
            {updateMutation.isPending ? 'Updating...' : 'Update Key'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
