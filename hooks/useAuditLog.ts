import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import auditLogService from '@/lib/audit-log-service';
import type { AuditEventFilters, UpdateSettingsRequest } from '@/types/openclaw';

export function useAuditEvents(filters: AuditEventFilters = {}) {
  return useQuery({
    queryKey: ['audit-events', filters],
    queryFn: () => auditLogService.listAuditEvents(filters),
    // Audit logs don't need aggressive polling.
    refetchInterval: 30000,
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ['openclaw-settings'],
    queryFn: () => auditLogService.getSettings(),
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateSettingsRequest) => auditLogService.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['openclaw-settings'] });
    },
  });
}
