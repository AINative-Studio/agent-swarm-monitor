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
import { useDeleteApiKey } from '@/hooks/useApiKeys';
import type { ServiceName } from '@/types/api-keys';

interface DeleteApiKeyDialogProps {
  open: boolean;
  onClose: () => void;
  serviceName: ServiceName | null;
  serviceLabel: string;
}

export default function DeleteApiKeyDialog({
  open,
  onClose,
  serviceName,
  serviceLabel,
}: DeleteApiKeyDialogProps) {
  const deleteMutation = useDeleteApiKey();

  const handleDelete = async () => {
    if (!serviceName) return;

    try {
      await deleteMutation.mutateAsync(serviceName);
      onClose();
    } catch (error) {
      console.error('Failed to delete API key:', error);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {serviceLabel} API Key?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the API key for {serviceLabel}. This action cannot be undone.
            Your agents will no longer be able to use this service.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
