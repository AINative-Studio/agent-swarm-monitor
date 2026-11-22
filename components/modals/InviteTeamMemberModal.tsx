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
import type { TeamMemberRole } from '@/types/openclaw';

interface InviteTeamMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (email: string, role: TeamMemberRole) => Promise<void>;
  isLoading?: boolean;
}

const ROLE_OPTIONS: Array<{ value: TeamMemberRole; label: string; description: string }> = [
  { value: 'VIEWER', label: 'Viewer', description: 'Read-only access' },
  { value: 'MEMBER', label: 'Member', description: 'Can create and edit agents' },
  { value: 'ADMIN', label: 'Admin', description: 'Can manage agents and team members' },
];

export default function InviteTeamMemberModal({
  open,
  onOpenChange,
  onInvite,
  isLoading = false,
}: InviteTeamMemberModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamMemberRole>('VIEWER');
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInvite = async () => {
    if (!email.trim()) {
      setError('Email address is required');
      return;
    }

    if (!validateEmail(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setError(null);

    try {
      await onInvite(email.trim(), role);
      handleClose();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'detail' in err) {
        setError(err.detail as string);
      } else {
        setError('Failed to send invitation');
      }
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setEmail('');
      setRole('VIEWER');
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Invite Team Member</DialogTitle>
          <DialogDescription className="text-gray-500">
            Send an invitation to join your workspace. They will receive an email with instructions
            to accept the invite.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleInvite();
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="text-gray-700">
              Role
            </Label>
            <Select value={role} onValueChange={(value) => setRole(value as TeamMemberRole)} disabled={isLoading}>
              <SelectTrigger id="role" className="bg-white border-gray-200 text-gray-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                {ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-gray-900">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-gray-500">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleInvite}
            disabled={isLoading}
            className="bg-gray-900 hover:bg-gray-800 text-white"
          >
            {isLoading ? 'Sending...' : 'Send Invitation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
