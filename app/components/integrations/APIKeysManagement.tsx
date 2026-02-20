'use client';

import { useState } from 'react';
import { AIKitButton } from '../../../components/aikit/AIKitButton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { mockAPIKeys, maskAPIKey } from '../../lib/mockIntegrations';
import type { APIKey } from '../../lib/mockIntegrations';
import { Copy, RefreshCw, Trash2, Plus, CheckCircle } from 'lucide-react';

interface APIKeysManagementProps {
  onCreateKey: () => void;
  onCopyKey: (key: APIKey) => void;
  onRegenerateKey: (key: APIKey) => void;
  onDeleteKey: (key: APIKey) => void;
}

export default function APIKeysManagement({
  onCreateKey,
  onCopyKey,
  onRegenerateKey,
  onDeleteKey,
}: APIKeysManagementProps) {
  const [apiKeys] = useState<APIKey[]>(mockAPIKeys);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  const handleCopy = async (key: APIKey) => {
    try {
      await navigator.clipboard.writeText(key.key);
      setCopiedKeyId(key.id);
      setTimeout(() => setCopiedKeyId(null), 2000);
      onCopyKey(key);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">API Keys</h3>
        <AIKitButton
          variant="default"
          size="sm"
          onClick={onCreateKey}
          className="flex items-center gap-2 bg-[#4B6FED] hover:bg-[#4B6FED]/90"
        >
          <Plus className="w-4 h-4" />
          Create API Key
        </AIKitButton>
      </div>

      <div className="border border-gray-700 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Used</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apiKeys.map((key) => (
              <TableRow key={key.id}>
                <TableCell className="font-medium">{key.name}</TableCell>
                <TableCell>
                  <code className="text-xs bg-gray-800 px-2 py-1 rounded">
                    {maskAPIKey(key.key)}
                  </code>
                  {key.expiresAt && (
                    <p className="text-xs text-yellow-400 mt-1">
                      Expires: {formatDate(key.expiresAt)}
                    </p>
                  )}
                </TableCell>
                <TableCell className="text-sm text-gray-400">
                  {formatDate(key.createdAt)}
                </TableCell>
                <TableCell className="text-sm text-gray-400">
                  {formatDate(key.lastUsedAt)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <AIKitButton
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopy(key)}
                      className="h-8 w-8"
                    >
                      {copiedKeyId === key.id ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      <span className="sr-only">Copy</span>
                    </AIKitButton>
                    <AIKitButton
                      variant="ghost"
                      size="icon"
                      onClick={() => onRegenerateKey(key)}
                      className="h-8 w-8"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span className="sr-only">Regenerate</span>
                    </AIKitButton>
                    <AIKitButton
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteKey(key)}
                      className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="sr-only">Delete</span>
                    </AIKitButton>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
