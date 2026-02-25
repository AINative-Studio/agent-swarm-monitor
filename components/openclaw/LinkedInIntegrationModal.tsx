'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, ExternalLink } from 'lucide-react';

interface LinkedInIntegrationModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (username: string) => Promise<void>;
  currentUsername?: string;
}

export default function LinkedInIntegrationModal({
  open,
  onClose,
  onSave,
  currentUsername,
}: LinkedInIntegrationModalProps) {
  const [username, setUsername] = useState(currentUsername || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);

    if (!username.trim()) {
      setError('LinkedIn username is required');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(username.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save LinkedIn integration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isSaving) {
      setUsername(currentUsername || '');
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect LinkedIn</DialogTitle>
          <DialogDescription>
            Enter your LinkedIn username to enable LinkedIn integration. OAuth authentication will be required in a future release.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="linkedin-username">LinkedIn Username</Label>
            <Input
              id="linkedin-username"
              type="text"
              placeholder="your-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isSaving) {
                  handleSave();
                }
              }}
              disabled={isSaving}
              className="bg-white"
            />
            <p className="text-xs text-gray-500">
              This is the part after linkedin.com/in/ in your profile URL
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-xs text-amber-700 font-medium mb-2">
              Coming Soon
            </p>
            <p className="text-xs text-amber-700">
              Full LinkedIn OAuth integration with browser automation for posting content, reading profiles, and managing connections is currently in development.
            </p>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-xs text-blue-700">
              <strong>Note:</strong> For now, this will save your username for configuration purposes. Browser-based OAuth will be enabled in a future release.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
