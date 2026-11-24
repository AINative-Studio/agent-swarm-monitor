import { AgentConfiguration, AgentChannels } from './agent-configuration';

// Re-export as ChannelConfiguration for channels page
export type ChannelConfiguration = AgentChannels;

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
  configuration: AgentConfiguration | null;
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

/**
 * Chat message transcript types (MessageTranscriptViewer / useMessages)
 */
export interface Message {
  id: string;
  conversationId: string;
  agentId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  model?: string;
  tokensUsed?: number;
}

export interface MessageListResponse {
  messages: Message[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface SendMessageRequest {
  agentId: string;
  conversationId?: string;
  message: string;
}

export interface SendMessageResponse {
  messageId: string;
  conversationId: string;
  response: string;
  model?: string;
  tokensUsed?: number;
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
  configuration?: AgentConfiguration;
}

export interface UpdateAgentSettingsRequest {
  persona?: string;
  model?: string;
  heartbeat?: {
    enabled: boolean;
    interval?: HeartbeatInterval;
    checklist?: string[];
  };
  configuration?: AgentConfiguration;
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
  userId?: string;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface TemplateListResponse {
  templates: OpenClawTemplate[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  category: TemplateCategory;
  icons?: string[];
  defaultModel?: string;
  defaultPersona?: string;
  defaultHeartbeatInterval?: HeartbeatInterval;
  defaultChecklist?: string[];
}

export interface UpdateTemplateRequest {
  name?: string;
  description?: string;
  category?: TemplateCategory;
  icons?: string[];
  defaultModel?: string;
  defaultPersona?: string;
  defaultHeartbeatInterval?: HeartbeatInterval;
  defaultChecklist?: string[];
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
  connectionDetails?: {
    workspace?: string;
    username?: string;
    phoneNumber?: string;
    connectedAt?: string;
  };
}

// Matches the real backend's TeamMemberRole enum exactly (backend/models/team_member.py):
// OWNER/ADMIN/MEMBER/VIEWER, uppercase, with no separate "editor" role -- see issue #131.
export type TeamMemberRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamMemberRole;
  avatarInitials: string;
}

export interface ApiKeyProvider {
  id: string;
  name: string;
  configured: boolean;
}

export interface TeamMemberListResponse {
  members: TeamMember[];
  total: number;
  limit: number;
  offset: number;
}

export interface InviteTeamMemberRequest {
  email: string;
  name: string;
  role: TeamMemberRole;
}

export interface UpdateMemberRoleRequest {
  role: TeamMemberRole;
}

export type SwarmStatus = 'idle' | 'running' | 'paused' | 'stopped' | 'failed';
export type CoordinationStrategy = 'parallel' | 'sequential' | 'hierarchical';

export interface AgentSwarm {
  id: string;
  name: string;
  description: string | null;
  strategy: CoordinationStrategy;
  goal: string | null;
  status: SwarmStatus;
  agentIds: string[];
  agentCount: number;
  userId: string;
  configuration: Record<string, unknown> | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string | null;
  startedAt: string | null;
  pausedAt: string | null;
  stoppedAt: string | null;
}

export interface AgentSwarmListResponse {
  swarms: AgentSwarm[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateSwarmRequest {
  name: string;
  description?: string;
  strategy: CoordinationStrategy;
  goal?: string;
  agentIds?: string[];
  configuration?: Record<string, unknown>;
}

export interface UpdateSwarmRequest {
  name?: string;
  description?: string;
  strategy?: CoordinationStrategy;
  goal?: string;
  configuration?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Audit Log
// ---------------------------------------------------------------------------

export type AuditEventType =
  | 'agent_created'
  | 'agent_paused'
  | 'agent_resumed'
  | 'agent_deleted'
  | 'agent_provisioned'
  | 'settings_changed'
  | 'api_key_rotated'
  | 'channel_connected'
  | 'channel_disconnected'
  | 'heartbeat_failed'
  | 'heartbeat_executed'
  | 'team_member_invited'
  | 'team_member_role_changed'
  | 'integration_connected';

export type AuditEventSeverity = 'info' | 'warning' | 'critical';

export interface AuditEvent {
  id: string;
  timestamp: string;
  eventType: AuditEventType;
  agentId: string | null;
  agentName: string | null;
  actor: string;
  description: string;
  severity: AuditEventSeverity;
}

export interface AuditEventListResponse {
  events: AuditEvent[];
  total: number;
  limit: number;
  offset: number;
}

export interface AuditEventFilters {
  eventType?: AuditEventType | 'all';
  agentId?: string | 'all';
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export const AUDIT_EVENT_TYPES: { value: AuditEventType; label: string }[] = [
  { value: 'agent_created', label: 'Agent Created' },
  { value: 'agent_paused', label: 'Agent Paused' },
  { value: 'agent_resumed', label: 'Agent Resumed' },
  { value: 'agent_deleted', label: 'Agent Deleted' },
  { value: 'agent_provisioned', label: 'Agent Provisioned' },
  { value: 'settings_changed', label: 'Settings Changed' },
  { value: 'api_key_rotated', label: 'API Key Rotated' },
  { value: 'channel_connected', label: 'Channel Connected' },
  { value: 'channel_disconnected', label: 'Channel Disconnected' },
  { value: 'heartbeat_failed', label: 'Heartbeat Failed' },
  { value: 'heartbeat_executed', label: 'Heartbeat Executed' },
  { value: 'team_member_invited', label: 'Team Member Invited' },
  { value: 'team_member_role_changed', label: 'Team Member Role Changed' },
  { value: 'integration_connected', label: 'Integration Connected' },
];

// ---------------------------------------------------------------------------
// Real backend audit log shape (issue #140)
//
// GET /api/v1/security/audit-logs returns events shaped nothing like the
// AuditEvent mock type above (no id, no severity, no agentId/agentName --
// just a generic peerId/action/resource/result/reason/metadata record of
// security-relevant actions the backend itself tracks). apiClient's
// snakeToCamelKeys converts event_type/peer_id on the way in, so these
// fields are already camelCase by the time the frontend sees them.
// ---------------------------------------------------------------------------

export interface RealAuditEvent {
  timestamp: string;
  eventType: string;
  peerId: string;
  action: string;
  resource: string | null;
  result: string;
  reason: string;
  metadata: Record<string, unknown>;
}

export interface RealAuditLogResponse {
  events: RealAuditEvent[];
  total: number;
  limit: number;
  offset: number;
}

export interface RealAuditLogFilters {
  peerId?: string;
  eventType?: string;
  result?: string;
  startTime?: string;
  endTime?: string;
  limit?: number;
  offset?: number;
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export type GatewayBindMode = 'localhost' | 'lan' | 'public';

export interface GatewaySettings {
  port: number;
  bindMode: GatewayBindMode;
  authEnabled: boolean;
}

export interface AgentDefaults {
  defaultModel: string;
  sandboxEnabled: boolean;
  compactionEnabled: boolean;
}

export interface ToolPermissions {
  fileAccess: boolean;
  networkAccess: boolean;
  shellExecution: boolean;
}

export interface OpenClawSettings {
  gateway: GatewaySettings;
  agentDefaults: AgentDefaults;
  toolPermissions: ToolPermissions;
}

export interface UpdateSettingsRequest {
  gateway?: Partial<GatewaySettings>;
  agentDefaults?: Partial<AgentDefaults>;
  toolPermissions?: Partial<ToolPermissions>;
}

/**
 * Real-time message streaming (useMessageStream / ConnectionStatusBadge)
 */
export type ConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'error';

export interface StreamingMessage {
  messageId: string;
  content: string;
  isComplete: boolean;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

export interface WebSocketMessage {
  type: 'message_chunk' | 'message_complete' | 'thinking' | 'error' | 'ping' | 'pong' | 'stop_ack';
  conversationId?: string;
  messageId?: string;
  chunk?: string;
  content?: string;
  isComplete?: boolean;
  timestamp?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface MessageChunkEvent {
  messageId: string;
  chunk?: string;
  isComplete: boolean;
}

export interface MessageCompleteEvent {
  messageId: string;
  content: string;
}

export interface MessageStreamConfig {
  conversationId: string;
  agentId: string;
  /** Automatically open the WebSocket connection on mount (default true) */
  autoConnect?: boolean;
  /** Automatically attempt to reconnect with exponential backoff when the connection drops (default true) */
  autoReconnect?: boolean;
  /** Maximum number of reconnect attempts before giving up (default 5) */
  maxReconnectAttempts?: number;
  /** Base delay in ms for exponential backoff reconnects (default 1000) */
  reconnectDelay?: number;
  /** Maximum delay in ms between reconnect attempts, caps the exponential backoff (default 30000) */
  maxReconnectDelay?: number;
  onMessageChunk?: (event: MessageChunkEvent) => void;
  onMessageComplete?: (event: MessageCompleteEvent) => void;
  onConnectionChange?: (status: ConnectionStatus) => void;
  onError?: (error: Error) => void;
}
