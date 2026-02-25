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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface GmailConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (email: string) => Promise<void>;
  onDisconnect?: () => Promise<void>;
  currentEmail?: string;
  isConnected?: boolean;
}

export default function GmailConnectionDialog({
  open,
  onOpenChange,
  onConnect,
  onDisconnect,
  currentEmail,
  isConnected = false,
}: GmailConnectionDialogProps) {
  const [email, setEmail] = useState(currentEmail || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      await onConnect(email.trim());
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to connect Gmail:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!onDisconnect) return;

    setIsLoading(true);
    try {
      await onDisconnect();
      setEmail('');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to disconnect Gmail:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-gray-200 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-gray-900 flex items-center gap-2">
            Gmail Integration
            {isConnected && (
              <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px] px-1.5 py-0 font-medium hover:bg-green-50">
                Connected
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            {isConnected
              ? 'Manage your Gmail connection settings.'
              : 'Connect your Gmail account to enable email processing.'}
          </DialogDescription>
        </DialogHeader>

        {isConnected ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Connected Email
                </Label>
                <p className="text-sm text-gray-900 font-medium">{currentEmail}</p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-gray-200 text-gray-700 bg-white hover:bg-gray-50"
                disabled={isLoading}
              >
                Close
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDisconnect}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isLoading ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleConnect} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gmail-email" className="text-gray-700 text-sm">
                Email Address
              </Label>
              <Input
                id="gmail-email"
                type="email"
                placeholder="your-email@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
                autoFocus
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                You will be redirected to Google to authorize access.
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-gray-200 text-gray-700 bg-white hover:bg-gray-50"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!email.trim() || isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? 'Connecting...' : 'Connect Gmail'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
