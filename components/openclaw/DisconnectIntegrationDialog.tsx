'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DisconnectIntegrationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  integrationName: string;
}

export default function DisconnectIntegrationDialog({
  open,
  onClose,
  onConfirm,
  integrationName,
}: DisconnectIntegrationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Disconnect {integrationName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove the {integrationName} integration from this agent. You can reconnect it later if needed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-red-600 hover:bg-red-700">
            Disconnect
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
