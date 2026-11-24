'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Crown, Pencil, Eye, Circle, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import teamService from '@/lib/team-service';
import ListErrorState, { getErrorMessage } from '@/components/openclaw/ListErrorState';
import { toast } from '@/hooks/use-toast';
import type { TeamMember, TeamMemberRole } from '@/types/openclaw';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: 'easeOut' },
  }),
};

// Keyed by the real backend's TeamMemberRole enum (OWNER/ADMIN/MEMBER/VIEWER,
// uppercase) -- see issue #131, where the previous lowercase owner/editor/viewer
// values here (and in the invite payload) didn't match any role the backend's
// POST /team/members/invite endpoint accepts, so every invite 422'd.
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
    description: 'Full access \u2014 can manage members, billing, and all agents',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  ADMIN: {
    icon: Pencil,
    label: 'Admin',
    description: 'Can manage agents and team members',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  MEMBER: {
    icon: Pencil,
    label: 'Member',
    description: 'Can create, edit, and deploy agents',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  VIEWER: {
    icon: Eye,
    label: 'Viewer',
    description: 'Read-only access to agents and dashboard',
    badgeClass: 'bg-gray-50 text-gray-600 border-gray-200',
  },
};

interface MemberRowProps {
  member: TeamMember;
  onRoleChange: (memberId: string, role: TeamMemberRole) => void;
  onRemove: (member: TeamMember) => void;
  isRoleChangePending: boolean;
  isRemovePending: boolean;
}

function MemberRow({ member, onRoleChange, onRemove, isRoleChangePending, isRemovePending }: MemberRowProps) {
  // Defensive fallback: member.role comes straight from the real backend, so
  // guard against a role value this frontend doesn't (yet) know how to label
  // rather than crashing the whole list on an unrecognized value.
  const config = roleConfig[member.role] ?? {
    icon: Circle,
    label: member.role,
    description: '',
    badgeClass: 'bg-gray-50 text-gray-600 border-gray-200',
  };
  const RoleIcon = config.icon;
  const isBusy = isRoleChangePending || isRemovePending;

  return (
    <div className="flex items-center gap-4 py-4">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8E6E1] text-sm font-medium text-[#6B6B6B] shrink-0"
        aria-hidden="true"
      >
        {member.avatarInitials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{member.name}</p>
        <p className="text-sm text-gray-500 mt-0.5">{member.email}</p>
      </div>
      <Select
        value={member.role in roleConfig ? member.role : undefined}
        onValueChange={(value) => onRoleChange(member.id, value as TeamMemberRole)}
        disabled={isBusy}
      >
        <SelectTrigger
          aria-label={`Change role for ${member.name}`}
          className={`w-[130px] text-xs font-medium border ${config.badgeClass}`}
        >
          <span className="inline-flex items-center gap-1.5">
            <RoleIcon className="h-3 w-3" />
            <SelectValue placeholder={config.label} />
          </span>
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
          <SelectItem value="OWNER" className="text-gray-900 text-sm">
            Owner
          </SelectItem>
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onRemove(member)}
        disabled={isBusy}
        aria-label={`Remove ${member.name}`}
        className="text-gray-400 hover:text-red-600 hover:bg-red-50 shrink-0"
      >
        {isRemovePending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function OpenClawTeamClient() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamMemberRole>('VIEWER');
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => teamService.listMembers(),
    refetchInterval: 30000,
  });

  const members: TeamMember[] = (data?.members ?? []).map((m) => ({
    ...m,
    avatarInitials: m.avatarInitials || getInitials(m.name),
  }));

  const inviteMutation = useMutation({
    mutationFn: (vars: { email: string; name: string; role: TeamMemberRole }) =>
      teamService.inviteMember(vars),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      // Only clear the form on confirmed success -- see issue #108.
      setEmail('');
      setRole('VIEWER');
    },
  });

  const handleAddMember = () => {
    if (!email.trim()) return;
    inviteMutation.mutate({ email: email.trim(), name: email.split('@')[0], role });
  };

  // Issue #142 / originally scoped (and never shipped) in issue #8: finishes
  // the Team page's acceptance criteria with a remove-member action and a
  // role-change control, both backed by the real, already-working backend
  // endpoints (DELETE /team/members/{id}, PUT /team/members/{id}/role).
  const roleMutation = useMutation({
    mutationFn: ({ memberId, newRole }: { memberId: string; newRole: TeamMemberRole }) =>
      teamService.updateMemberRole(memberId, { role: newRole }),
    onSuccess: (_, { newRole }) => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast({
        title: 'Role updated',
        description: `Member role changed to ${roleConfig[newRole]?.label ?? newRole}.`,
      });
    },
    onError: (err) => {
      toast({
        title: 'Failed to update role',
        description: getErrorMessage(err, 'Could not change this member’s role.'),
        variant: 'destructive',
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (memberId: string) => teamService.removeMember(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast({
        title: 'Member removed',
        description: removeTarget ? `${removeTarget.name} has been removed from the workspace.` : undefined,
      });
      setRemoveTarget(null);
    },
    onError: (err) => {
      toast({
        title: 'Failed to remove member',
        description: getErrorMessage(err, 'Could not remove this member.'),
        variant: 'destructive',
      });
      setRemoveTarget(null);
    },
  });

  const handleRoleChange = (memberId: string, newRole: TeamMemberRole) => {
    roleMutation.mutate({ memberId, newRole });
  };

  const confirmRemove = () => {
    if (!removeTarget) return;
    removeMutation.mutate(removeTarget.id);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        custom={0}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <h1 className="text-2xl font-bold text-gray-900">Team</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage who has access to this workspace
        </p>
      </motion.div>

      {/* Add Member card */}
      <motion.div
        custom={1}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="rounded-lg border border-gray-200 bg-white p-5 space-y-4"
      >
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-gray-500" />
          <h2 className="text-base font-semibold text-gray-900">Add Member</h2>
        </div>

        {inviteMutation.isError && (
          <ListErrorState
            error={inviteMutation.error}
            onRetry={handleAddMember}
          />
        )}

        <div className="flex items-center gap-3">
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={inviteMutation.isPending}
            className="flex-1 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddMember();
            }}
          />
          <Select
            value={role}
            onValueChange={(value) => setRole(value as TeamMemberRole)}
            disabled={inviteMutation.isPending}
          >
            <SelectTrigger className="w-[130px] bg-white border-gray-200 text-gray-900 text-sm">
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
            </SelectContent>
          </Select>
          <Button
            onClick={handleAddMember}
            disabled={!email.trim() || inviteMutation.isPending}
            className="bg-gray-900 hover:bg-gray-800 text-white px-5"
          >
            {inviteMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              'Add'
            )}
          </Button>
        </div>
      </motion.div>

      {/* Members card */}
      <motion.div
        custom={2}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="rounded-lg border border-gray-200 bg-white"
      >
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            Members {isLoading || isError ? '' : `(${members.length})`}
          </h2>
        </div>
        <div className="px-5 divide-y divide-gray-100">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : isError ? (
            <div className="py-4">
              <ListErrorState
                error={error}
                message={getErrorMessage(error, 'Failed to load team members.')}
                onRetry={() => refetch()}
              />
            </div>
          ) : (
            members.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                onRoleChange={handleRoleChange}
                onRemove={setRemoveTarget}
                isRoleChangePending={
                  roleMutation.isPending && roleMutation.variables?.memberId === member.id
                }
                isRemovePending={removeMutation.isPending && removeMutation.variables === member.id}
              />
            ))
          )}
        </div>
      </motion.div>

      {/* Roles card */}
      <motion.div
        custom={3}
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

      {/* Remove member confirmation dialog -- matches the delete-confirmation
          pattern used on the agent detail page's Danger Zone. */}
      <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent className="bg-white border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500">
              Are you sure you want to remove {removeTarget?.name} ({removeTarget?.email}) from
              this workspace? They will lose access immediately. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-200 text-gray-700 bg-white hover:bg-gray-50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemove}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
