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
import { useTestApiKey } from '@/hooks/useApiKeys';
import { CheckCircle2, XCircle, Loader2, Info } from 'lucide-react';
import type { ApiKeyProvider } from '@/types/api-keys';

interface TestApiKeyModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm?: (providerId: string, keyValue: string) => void;
  providers: ApiKeyProvider[];
}

export default function TestApiKeyModal({
  open,
  onClose,
  onConfirm,
  providers,
}: TestApiKeyModalProps) {
  const [providerId, setProviderId] = useState<string>('');
  const [keyValue, setKeyValue] = useState('');
  const [testResult, setTestResult] = useState<{
    valid: boolean;
    message?: string;
    quotaInfo?: {
      remaining?: number;
      total?: number;
      resetDate?: string;
    };
  } | null>(null);

  const testMutation = useTestApiKey();

  const handleTest = async () => {
    if (!providerId || !keyValue.trim()) {
      return;
    }

    setTestResult(null);

    try {
      const result = await testMutation.mutateAsync({
        providerId,
        keyValue: keyValue.trim(),
      });
      setTestResult(result);
    } catch (err: unknown) {
      setTestResult({
        valid: false,
        message: err && typeof err === 'object' && 'detail' in err
          ? (err.detail as string)
          : 'Failed to test API key',
      });
    }
  };

  const handleConfirm = () => {
    if (testResult?.valid && onConfirm) {
      onConfirm(providerId, keyValue.trim());
      handleClose();
    }
  };

  const handleClose = () => {
    if (!testMutation.isPending) {
      setProviderId('');
      setKeyValue('');
      setTestResult(null);
      onClose();
    }
  };

  const availableProviders = providers.filter((p) => !p.configured);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Test API Key</DialogTitle>
          <DialogDescription>
            Test your API key before saving to ensure it works correctly.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <Select
              value={providerId}
              onValueChange={(value) => {
                setProviderId(value);
                setTestResult(null);
              }}
              disabled={testMutation.isPending}
            >
              <SelectTrigger id="provider">
                <SelectValue placeholder="Select a provider..." />
              </SelectTrigger>
              <SelectContent>
                {availableProviders.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.name}
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
                setTestResult(null);
              }}
              placeholder="sk-..."
              disabled={testMutation.isPending}
              className="font-mono"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && providerId && keyValue.trim()) {
                  handleTest();
                }
              }}
            />
          </div>

          {testMutation.isPending && (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Testing API key...</span>
            </div>
          )}

          {testResult && (
            <div
              className={`flex items-start gap-2 text-sm p-3 rounded-lg ${
                testResult.valid
                  ? 'text-green-700 bg-green-50'
                  : 'text-red-700 bg-red-50'
              }`}
            >
              {testResult.valid ? (
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
              )}
              <div className="flex-1 space-y-1">
                <p className="font-medium">
                  {testResult.valid ? 'API key is valid' : 'API key is invalid'}
                </p>
                {testResult.message && (
                  <p className="text-xs opacity-90">{testResult.message}</p>
                )}
                {testResult.valid && testResult.quotaInfo && (
                  <div className="flex items-center gap-1 text-xs opacity-80 mt-2">
                    <Info className="h-3 w-3" />
                    {testResult.quotaInfo.remaining !== undefined && (
                      <span>
                        Quota: {testResult.quotaInfo.remaining}
                        {testResult.quotaInfo.total && `/${testResult.quotaInfo.total}`}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={testMutation.isPending}
          >
            Cancel
          </Button>
          {!testResult?.valid && (
            <Button
              onClick={handleTest}
              disabled={testMutation.isPending || !providerId || !keyValue.trim()}
            >
              Test Connection
            </Button>
          )}
          {testResult?.valid && (
            <Button onClick={handleConfirm}>
              Save Key
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
