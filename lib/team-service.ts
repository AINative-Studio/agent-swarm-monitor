import type {
  TeamMember,
  TeamMemberListResponse,
  InviteTeamMemberRequest,
  UpdateMemberRoleRequest,
} from '@/types/openclaw';
import apiClient from './api-client';

class TeamService {
  private basePath = '/team';

  async listMembers(
    limit: number = 50,
    offset: number = 0
  ): Promise<TeamMemberListResponse> {
    const params: Record<string, string> = {
      limit: String(limit),
      offset: String(offset),
    };
    return apiClient.get<TeamMemberListResponse>(`${this.basePath}/members`, params);
  }

  async inviteMember(data: InviteTeamMemberRequest): Promise<TeamMember> {
    return apiClient.post<TeamMember>(`${this.basePath}/members/invite`, data);
  }

  async removeMember(memberId: string): Promise<void> {
    return apiClient.delete(`${this.basePath}/members/${memberId}`);
  }

  async updateMemberRole(
    memberId: string,
    data: UpdateMemberRoleRequest
  ): Promise<TeamMember> {
    return apiClient.put<TeamMember>(`${this.basePath}/members/${memberId}/role`, data);
  }

  async acceptInvite(token: string): Promise<TeamMember> {
    return apiClient.post<TeamMember>(`${this.basePath}/members/accept-invite/${token}`);
  }
}

const teamService = new TeamService();
export default teamService;
