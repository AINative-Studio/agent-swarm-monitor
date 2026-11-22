import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import teamService from '@/lib/team-service';
import type { InviteTeamMemberRequest, TeamMemberRole } from '@/types/openclaw';

export function useTeamMembers() {
  return useQuery({
    queryKey: ['team-members'],
    queryFn: () => teamService.listMembers(),
    refetchInterval: 30000,
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InviteTeamMemberRequest) => teamService.inviteMember(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => teamService.removeMember(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: TeamMemberRole }) =>
      teamService.updateMemberRole(memberId, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
  });
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => teamService.acceptInvite(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
  });
}
