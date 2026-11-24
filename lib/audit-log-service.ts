import type {
  OpenClawSettings,
  RealAuditLogFilters,
  RealAuditLogResponse,
  UpdateSettingsRequest,
} from '@/types/openclaw';
import { MOCK_SETTINGS } from './audit-log-mock-data';
import apiClient from './api-client';

/**
 * AuditLogService
 *
 * Audit events (listAuditEvents) call the real backend --
 * GET /api/v1/security/audit-logs -- confirmed live and already recording
 * real backend-side security events (see issue #140). The event shape there
 * is intentionally generic (peerId/action/resource/result/reason/metadata,
 * no id/severity/agentName), nothing like the old AuditEvent mock type, so
 * callers use RealAuditEvent/RealAuditLogResponse instead.
 *
 * Gateway/agent-defaults settings (getSettings/updateSettings) are a
 * separate feature (the /settings page, not /audit-log) with no real
 * backend endpoint identified for this issue, so those remain mock --
 * mirrors the pattern used by OpenClawService in lib/openclaw-service.ts
 * for the still-mock parts of that service.
 */
class AuditLogService {
  private settings: OpenClawSettings = { ...MOCK_SETTINGS };

  async listAuditEvents(filters: RealAuditLogFilters = {}): Promise<RealAuditLogResponse> {
    const params: Record<string, string> = {};
    if (filters.peerId) params.peer_id = filters.peerId;
    if (filters.eventType) params.event_type = filters.eventType;
    if (filters.result) params.result = filters.result;
    if (filters.startTime) params.start_time = filters.startTime;
    if (filters.endTime) params.end_time = filters.endTime;
    params.limit = String(filters.limit ?? 50);
    params.offset = String(filters.offset ?? 0);

    return apiClient.get<RealAuditLogResponse>('/security/audit-logs', params);
  }

  async getSettings(): Promise<OpenClawSettings> {
    // TODO: Replace with real API call — GET to openclaw-gateway config API
    return { ...this.settings };
  }

  async updateSettings(data: UpdateSettingsRequest): Promise<OpenClawSettings> {
    // TODO: Replace with real API call — PATCH/PUT to openclaw-gateway config API
    this.settings = {
      gateway: { ...this.settings.gateway, ...data.gateway },
      agentDefaults: { ...this.settings.agentDefaults, ...data.agentDefaults },
      toolPermissions: { ...this.settings.toolPermissions, ...data.toolPermissions },
    };
    return { ...this.settings };
  }
}

const auditLogService = new AuditLogService();
export default auditLogService;
