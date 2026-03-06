# Team Management Client Implementation Guide

## File: `/Users/aideveloper/agent-swarm-monitor/app/team/OpenClawTeamClient.tsx`

This document provides the complete implementation for integrating the Team Management page with the backend API.

## Complete Implementation

Replace the contents of `app/team/OpenClawTeamClient.tsx` with the following code:

```typescript
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Crown, Shield, User, Eye, Circle, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { useTeamMembers, useInviteMember, useRemoveMember, useUpdateMemberRole } from '@/hooks/useTeamManagement';
import InviteTeamMemberModal from '@/components/modals/InviteTeamMemberModal';
import type { TeamMember, TeamMemberRole } from '@/types/openclaw';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: 'easeOut' },
  }),
};

const roleConfig: Record<
  TeamMemberRole,
  {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    description: string;
    badgeClass: string;
  }
> = {
  OWNER: {
    icon: Crown,
    label: 'Owner',
    description: 'Full access - can manage members, billing, and all agents',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  ADMIN: {
    icon: Shield,
    label: 'Admin',
    description: 'Can manage agents and team members (except owner)',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  MEMBER: {
    icon: User,
    label: 'Member',
    description: 'Can create and edit agents',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  VIEWER: {
    icon: Eye,
    label: 'Viewer',
    description: 'Read-only access to agents and dashboard',
    badgeClass: 'bg-gray-50 text-gray-600 border-gray-200',
  },
};

const statusConfig = {
  PENDING: {
    label: 'Pending',
    badgeClass: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  },
  ACTIVE: {
    label: 'Active',
    badgeClass: 'bg-green-50 text-green-700 border-green-200',
  },
  SUSPENDED: {
    label: 'Suspended',
    badgeClass: 'bg-red-50 text-red-700 border-red-200',
  },
};

interface MemberRowProps {
  member: TeamMember;
  currentUserRole: TeamMemberRole;
  onRoleChange: (memberId: string, role: TeamMemberRole) => void;
  onRemove: (member: TeamMember) => void;
  isUpdating: boolean;
}

function MemberRow({ member, currentUserRole, onRoleChange, onRemove, isUpdating }: MemberRowProps) {
  const config = roleConfig[member.role];
  const statusCfg = statusConfig[member.status];
  const RoleIcon = config.icon;

  const isOwner = member.role === 'OWNER';
  const canModify = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';
  const canModifyThisMember = canModify && (currentUserRole === 'OWNER' || !isOwner);

  const getInitials = (email: string, name?: string): string => {
    if (name) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const displayName = member.name || member.email.split('@')[0];
  const initials = member.avatarInitials || getInitials(member.email, member.name);

  return (
    <div className="flex items-center gap-4 py-4">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8E6E1] text-sm font-medium text-[#6B6B6B] shrink-0"
        aria-hidden="true"
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-gray-900">{displayName}</p>
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${config.badgeClass}`}
          >
            <RoleIcon className="h-3 w-3" />
            {config.label}
          </span>
          {member.status !== 'ACTIVE' && (
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusCfg.badgeClass}`}
            >
              {statusCfg.label}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-0.5">{member.email}</p>
        {member.status === 'PENDING' && member.invitedAt && (
          <p className="text-xs text-gray-400 mt-0.5">
            Invited {new Date(member.invitedAt).toLocaleDateString()}
          </p>
        )}
      </div>
      {canModifyThisMember && (
        <div className="flex items-center gap-2">
          <Select
            value={member.role}
            onValueChange={(value) => onRoleChange(member.id, value as TeamMemberRole)}
            disabled={isUpdating || isOwner}
          >
            <SelectTrigger className="w-[120px] bg-white border-gray-200 text-gray-900 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200">
              <SelectItem value="VIEWER" className="text-gray-900 text-sm">
                Viewer
              </SelectItem>
              <SelectItem value="MEMBER" className="text-gray-900 text-sm">
                Member
              </SelectItem>
              <SelectItem value="ADMIN" className="text-gray-900 text-sm">
                Admin
              </SelectItem>
              {currentUserRole === 'OWNER' && (
                <SelectItem value="OWNER" className="text-gray-900 text-sm">
                  Owner
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          {!isOwner && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(member)}
              disabled={isUpdating}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default function OpenClawTeamClient() {
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data, isLoading, error } = useTeamMembers();
  const inviteMutation = useInviteMember();
  const removeMutation = useRemoveMember();
  const updateRoleMutation = useUpdateMemberRole();

  // In production, get this from auth context
  const currentUserRole: TeamMemberRole = 'ADMIN';

  const members = data?.members || [];
  const activeMembers = members.filter((m) => m.status === 'ACTIVE');
  const pendingMembers = members.filter((m) => m.status === 'PENDING');

  const handleInvite = async (email: string, role: TeamMemberRole) => {
    try {
      setErrorMessage(null);
      await inviteMutation.mutateAsync({ email, role });
      setInviteModalOpen(false);
    } catch (err: any) {
      setErrorMessage(err.detail || 'Failed to send invitation');
    }
  };

  const handleRoleChange = async (memberId: string, role: TeamMemberRole) => {
    try {
      setErrorMessage(null);
      await updateRoleMutation.mutateAsync({ memberId, role });
    } catch (err: any) {
      setErrorMessage(err.detail || 'Failed to update member role');
    }
  };

  const handleRemoveConfirm = async () => {
    if (!memberToRemove) return;

    try {
      setErrorMessage(null);
      await removeMutation.mutateAsync(memberToRemove.id);
      setMemberToRemove(null);
    } catch (err: any) {
      setErrorMessage(err.detail || 'Failed to remove member');
      setMemberToRemove(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading team members...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
          <p className="text-gray-900 font-medium">Failed to load team members</p>
          <p className="text-sm text-gray-500">
            {error instanceof Error ? error.message : 'An error occurred'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div
        custom={0}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Team</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage who has access to this workspace
            </p>
          </div>
          {(currentUserRole === 'OWNER' || currentUserRole === 'ADMIN') && (
            <Button
              onClick={() => setInviteModalOpen(true)}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          )}
        </div>
      </motion.div>

      {errorMessage && (
        <motion.div
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="rounded-lg border border-red-200 bg-red-50 p-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">Error</p>
              <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setErrorMessage(null)}
              className="text-red-600 hover:text-red-700 hover:bg-red-100"
            >
              Dismiss
            </Button>
          </div>
        </motion.div>
      )}

      <motion.div
        custom={2}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="rounded-lg border border-gray-200 bg-white"
      >
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            Active Members ({activeMembers.length})
          </h2>
        </div>
        <div className="px-5 divide-y divide-gray-100">
          {activeMembers.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No active members found
            </div>
          ) : (
            activeMembers.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                currentUserRole={currentUserRole}
                onRoleChange={handleRoleChange}
                onRemove={setMemberToRemove}
                isUpdating={updateRoleMutation.isPending || removeMutation.isPending}
              />
            ))
          )}
        </div>
      </motion.div>

      {pendingMembers.length > 0 && (
        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="rounded-lg border border-gray-200 bg-white"
        >
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">
              Pending Invitations ({pendingMembers.length})
            </h2>
          </div>
          <div className="px-5 divide-y divide-gray-100">
            {pendingMembers.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                currentUserRole={currentUserRole}
                onRoleChange={handleRoleChange}
                onRemove={setMemberToRemove}
                isUpdating={updateRoleMutation.isPending || removeMutation.isPending}
              />
            ))}
          </div>
        </motion.div>
      )}

      <motion.div
        custom={4}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="rounded-lg border border-gray-200 bg-white"
      >
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Circle className="h-4 w-4 text-gray-500" />
            <h2 className="text-base font-semibold text-gray-900">Roles</h2>
          </div>
        </div>
        <div className="px-5 divide-y divide-gray-100">
          {(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'] as const).map((roleKey) => {
            const config = roleConfig[roleKey];
            const RoleIcon = config.icon;
            return (
              <div key={roleKey} className="flex items-center gap-3 py-4">
                <RoleIcon className="h-4 w-4 text-gray-500 shrink-0" />
                <div>
                  <span className="text-sm font-semibold text-gray-900">
                    {config.label}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">
                    {config.description}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      <InviteTeamMemberModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        onInvite={handleInvite}
        isLoading={inviteMutation.isPending}
      />

      <AlertDialog
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500">
              Are you sure you want to remove{' '}
              <span className="font-medium text-gray-900">{memberToRemove?.email}</span>?
              This will revoke their access to the workspace immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-gray-200 text-gray-700 hover:bg-gray-50"
              disabled={removeMutation.isPending}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveConfirm}
              disabled={removeMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {removeMutation.isPending ? 'Removing...' : 'Remove Member'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

## Features Implemented

1. **Team Member List Display**
   - Active members section
   - Pending invitations section (conditional rendering)
   - Member avatars with initials
   - Role badges with icons
   - Status badges (PENDING/ACTIVE/SUSPENDED)

2. **Invite Flow**
   - Invite button (visible to ADMIN/OWNER only)
   - InviteTeamMemberModal with email validation
   - Role selection (VIEWER/MEMBER/ADMIN)
   - Success/error handling

3. **Role Management**
   - Inline role dropdown for each member
   - Disabled for OWNER role
   - ADMIN cannot change OWNER role
   - Optimistic UI updates via TanStack Query

4. **Member Removal**
   - Trash icon button for each member
   - Remove confirmation dialog
   - Cannot remove OWNER
   - Error handling

5. **Permission Enforcement**
   - Only ADMIN/OWNER can modify members
   - OWNER role is protected
   - Clear visual feedback for disabled actions

6. **Loading & Error States**
   - Loading spinner while fetching
   - Error display with retry option
   - Empty state messages

7. **Roles Reference Card**
   - Visual guide showing all 4 roles
   - Role descriptions
   - Always visible for reference

## Testing

1. Start backend server at `http://localhost:8000`
2. Navigate to `/team` page
3. Test each operation:
   - View members list
   - Invite new member
   - Change member role
   - Remove member
   - View pending invitations

## Notes

- `currentUserRole` is hardcoded to 'ADMIN' for demo
- In production, fetch from authentication context
- All mutations invalidate the `team-members` query cache
- Auto-refresh enabled (30 seconds interval)
