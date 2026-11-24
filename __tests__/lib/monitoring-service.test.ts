import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import monitoringService from '@/lib/monitoring-service';

// Realistic sample of /metrics text as actually emitted by the openswarm
// backend (names/shape captured live 2026-11-23 — see issue #151). Counters
// use the real plural/renamed Prometheus series names; a couple of fields
// the UI type still carries (taskAssignmentRejectedTotal etc.) have no
// corresponding backend series at all and must resolve to 0, not throw.
const SAMPLE_METRICS_TEXT = `
# HELP openclaw_task_assignments_total Total task assignments
# TYPE openclaw_task_assignments_total counter
openclaw_task_assignments_total 42.0
# HELP openclaw_tasks_requeued_total Total tasks requeued
# TYPE openclaw_tasks_requeued_total counter
openclaw_tasks_requeued_total 3.0
# HELP openclaw_leases_issued_total Total leases issued
# TYPE openclaw_leases_issued_total counter
openclaw_leases_issued_total 7.0
# HELP openclaw_leases_expired_total Total leases expired
# TYPE openclaw_leases_expired_total counter
openclaw_leases_expired_total 1.0
# HELP openclaw_leases_revoked_total Total leases revoked
# TYPE openclaw_leases_revoked_total counter
openclaw_leases_revoked_total 0.0
# HELP openclaw_active_leases Current active leases
# TYPE openclaw_active_leases gauge
openclaw_active_leases 2.0
# HELP openclaw_node_crashes_total Total node crashes detected
# TYPE openclaw_node_crashes_total counter
openclaw_node_crashes_total 5.0
# HELP openclaw_partition_events_total Total partition events
# TYPE openclaw_partition_events_total counter
openclaw_partition_events_total 1.0
# HELP openclaw_recovery_operations_total Total recovery operations
# TYPE openclaw_recovery_operations_total counter
openclaw_recovery_operations_total 2.0
# HELP openclaw_buffer_size Current buffer size
# TYPE openclaw_buffer_size gauge
openclaw_buffer_size 10.0
# HELP openclaw_buffer_utilization_percent Buffer utilization percent
# TYPE openclaw_buffer_utilization_percent gauge
openclaw_buffer_utilization_percent 25.5
# HELP openclaw_partition_degraded Whether partition is degraded
# TYPE openclaw_partition_degraded gauge
openclaw_partition_degraded 0.0
# HELP openclaw_recovery_duration_seconds Recovery duration histogram
# TYPE openclaw_recovery_duration_seconds histogram
openclaw_recovery_duration_seconds_sum 4.2
openclaw_recovery_duration_seconds_count 2
# HELP openclaw_build_info Build info
# TYPE openclaw_build_info gauge
openclaw_build_info{python_version="3.14.2",version="0.1.0"} 1.0
`;

describe('MonitoringService.getPrometheusMetrics', () => {
    beforeEach(() => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                text: () => Promise.resolve(SAMPLE_METRICS_TEXT),
            })
        );
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('reads real counters by their actual backend series names (issue #151)', async () => {
        const result = await monitoringService.getPrometheusMetrics();

        // These previously queried non-existent singular/renamed metric names
        // and were permanently pinned at 0 regardless of backend activity.
        expect(result.taskAssignmentTotal).toBe(42);
        expect(result.taskRequeuedTotal).toBe(3);
        expect(result.leaseIssuedTotal).toBe(7);
        expect(result.leaseExpiredTotal).toBe(1);
        expect(result.leaseRevokedTotal).toBe(0);
        expect(result.nodeCrashDetectedTotal).toBe(5);
        expect(result.partitionDetectedTotal).toBe(1);
        expect(result.recoveryTriggeredTotal).toBe(2);
    });

    it('still reads the fields that were already correctly named', async () => {
        const result = await monitoringService.getPrometheusMetrics();

        expect(result.activeLeasesCount).toBe(2);
        expect(result.bufferSize).toBe(10);
        expect(result.bufferUtilizationPercent).toBe(25.5);
        expect(result.partitionDegraded).toBe(0);
        expect(result.buildInfo).toEqual({ version: '0.1.0', commit: '' });
    });

    it('falls back to 0 (not an error) for fields with no backend series at all', async () => {
        const result = await monitoringService.getPrometheusMetrics();

        expect(result.taskAssignmentRejectedTotal).toBe(0);
        expect(result.taskResultSubmittedTotal).toBe(0);
        expect(result.taskResultDuplicateTotal).toBe(0);
        expect(result.taskResultInvalidTotal).toBe(0);
    });
});
