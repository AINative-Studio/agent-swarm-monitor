'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ComingSoonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelName: string;
}

export default function ComingSoonModal({
  open,
  onOpenChange,
  channelName,
}: ComingSoonModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{channelName} - Coming Soon</DialogTitle>
          <DialogDescription>
            {channelName} integration is currently under development
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-8">
          <div className="text-6xl mb-4">🚧</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Under Development
          </h3>
          <p className="text-sm text-gray-600 text-center max-w-sm">
            We&apos;re working on bringing {channelName} integration to OpenClaw.
            Stay tuned for updates!
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
          >
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
