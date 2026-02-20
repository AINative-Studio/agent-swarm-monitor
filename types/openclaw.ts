export type AgentStatus = 'provisioning' | 'running' | 'paused' | 'stopped' | 'failed';
export type HeartbeatInterval = '5m' | '15m' | '30m' | '1h' | '2h';
export type TemplateCategory = 'engineering' | 'sales-outreach' | 'devops-infrastructure' | 'productivity';

export interface OpenClawAgent {
  id: string;
  name: string;
  persona: string | null;
  model: string;
  userId: string;
  status: AgentStatus;
  openclawSessionKey: string | null;
  openclawAgentId: string | null;
  heartbeatEnabled: boolean;
  heartbeatInterval: HeartbeatInterval | null;
  heartbeatChecklist: string[] | null;
  lastHeartbeatAt: string | null;
  nextHeartbeatAt: string | null;
  configuration: Record<string, unknown> | null;
  errorMessage: string | null;
  errorCount: number;
  createdAt: string;
  updatedAt: string | null;
  provisionedAt: string | null;
  pausedAt: string | null;
  stoppedAt: string | null;
}

export interface OpenClawAgentListResponse {
  agents: OpenClawAgent[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateAgentRequest {
  name: string;
  persona?: string;
  model: string;
  heartbeat?: {
    enabled: boolean;
    interval?: HeartbeatInterval;
    checklist?: string[];
  };
  configuration?: Record<string, unknown>;
}

export interface UpdateAgentSettingsRequest {
  persona?: string;
  model?: string;
  heartbeat?: {
    enabled: boolean;
    interval?: HeartbeatInterval;
    checklist?: string[];
  };
  configuration?: Record<string, unknown>;
}

export interface OpenClawTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  icons: string[];
  defaultModel: string;
  defaultPersona: string;
  defaultHeartbeatInterval: HeartbeatInterval;
  defaultChecklist: string[];
}

export interface Integration {
  id: string;
  name: string;
  icon: string;
  description: string;
  connected: boolean;
  comingSoon?: boolean;
}

export interface Channel {
  id: string;
  name: string;
  icon: string;
  description: string;
  connected: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  avatarInitials: string;
}

export interface ApiKeyProvider {
  id: string;
  name: string;
  configured: boolean;
}
