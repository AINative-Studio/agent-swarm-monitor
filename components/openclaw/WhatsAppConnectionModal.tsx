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
import { Loader2 } from 'lucide-react';

interface WhatsAppConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (data: { phoneNumber: string }) => Promise<void>;
}

export default function WhatsAppConnectionModal({
  open,
  onOpenChange,
  onConnect,
}: WhatsAppConnectionModalProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      // In a real implementation, this would:
      // 1. Request QR code from backend
      // 2. Display QR code for user to scan
      // 3. Wait for connection confirmation
      // 4. Save phone number on success

      // For MVP, we'll simulate this:
      const phoneNumber = '+1234567890'; // This would come from the QR scan
      await onConnect({ phoneNumber });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect WhatsApp');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect WhatsApp</DialogTitle>
          <DialogDescription>
            Scan the QR code with your WhatsApp mobile app to connect this agent
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-8">
          {/* QR Code Placeholder */}
          <div className="w-64 h-64 bg-gray-100 border-2 border-gray-300 border-dashed rounded-lg flex items-center justify-center">
            {isConnecting ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                <p className="text-sm text-gray-500">Waiting for connection...</p>
              </div>
            ) : (
              <div className="text-center px-4">
                <div className="text-4xl mb-2">📱</div>
                <p className="text-sm text-gray-500">
                  QR code will appear here
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  (Implementation pending)
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 text-sm text-red-600 bg-red-50 px-4 py-2 rounded">
              {error}
            </div>
          )}

          <div className="mt-6 text-center">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">
              How to connect:
            </h4>
            <ol className="text-sm text-gray-600 text-left space-y-1">
              <li>1. Open WhatsApp on your phone</li>
              <li>2. Tap Menu (⋮) and select &quot;Linked Devices&quot;</li>
              <li>3. Tap &quot;Link a Device&quot;</li>
              <li>4. Point your phone at the QR code above</li>
            </ol>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isConnecting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect (Demo)'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
