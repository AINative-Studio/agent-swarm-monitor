import type {
  AuditEvent,
  AuditEventFilters,
  AuditEventListResponse,
  OpenClawSettings,
  UpdateSettingsRequest,
} from '@/types/openclaw';
import { MOCK_AUDIT_EVENTS, MOCK_SETTINGS } from './audit-log-mock-data';

/**
 * AuditLogService
 *
 * Mock singleton service for audit events and gateway/agent settings.
 * Mirrors the pattern used by OpenClawService in lib/openclaw-service.ts.
 *
 * All methods currently filter/return in-memory mock data.
 */
class AuditLogService {
  private events: AuditEvent[] = [...MOCK_AUDIT_EVENTS];
  private settings: OpenClawSettings = { ...MOCK_SETTINGS };

  async listAuditEvents(filters: AuditEventFilters = {}): Promise<AuditEventListResponse> {
    // TODO: Replace with real API call — GET /api/v1/audit/events
    let filtered = [...this.events];

    if (filters.eventType && filters.eventType !== 'all') {
      filtered = filtered.filter((e) => e.eventType === filters.eventType);
    }

    if (filters.agentId && filters.agentId !== 'all') {
      filtered = filtered.filter((e) => e.agentId === filters.agentId);
    }

    if (filters.startDate) {
      const start = new Date(filters.startDate).getTime();
      filtered = filtered.filter((e) => new Date(e.timestamp).getTime() >= start);
    }

    if (filters.endDate) {
      // Include the entire end date day.
      const end = new Date(filters.endDate).getTime() + 86400000;
      filtered = filtered.filter((e) => new Date(e.timestamp).getTime() < end);
    }

    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;
    const page = filtered.slice(offset, offset + limit);

    return {
      events: page,
      total: filtered.length,
      limit,
      offset,
    };
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
