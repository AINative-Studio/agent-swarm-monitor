/**
 * Prometheus Text Format Parser
 */

export interface PrometheusMetric {
    name: string;
    type: 'counter' | 'gauge' | 'histogram' | 'info' | 'unknown';
    help: string;
    values: PrometheusValue[];
}

export interface PrometheusValue {
    labels: Record<string, string>;
    value: number;
    timestamp?: number;
}

export interface ParsedPrometheusMetrics {
    metrics: Record<string, PrometheusMetric>;
    timestamp: number;
}

export function parsePrometheusMetrics(text: string): ParsedPrometheusMetrics {
    const lines = text.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    const metrics: Record<string, PrometheusMetric> = {};
    const metadataMap: Record<string, { type?: string; help?: string }> = {};

    const metadataLines = text.split('\n').filter(line => line.startsWith('#'));
    for (const line of metadataLines) {
        const typeMatch = line.match(/^# TYPE\s+(\S+)\s+(\S+)/);
        const helpMatch = line.match(/^# HELP\s+(\S+)\s+(.+)/);

        if (typeMatch) {
            const [, name, type] = typeMatch;
            metadataMap[name] = { ...metadataMap[name], type };
        } else if (helpMatch) {
            const [, name, help] = helpMatch;
            metadataMap[name] = { ...metadataMap[name], help };
        }
    }

    for (const line of lines) {
        const parsed = parseMetricLine(line);
        if (!parsed) continue;

        const { name, labels, value, timestamp } = parsed;
        const baseName = name.replace(/_bucket$/, '').replace(/_count$/, '').replace(/_sum$/, '').replace(/_total$/, '');

        if (!metrics[baseName]) {
            const metadata = metadataMap[baseName] || metadataMap[name] || {};
            metrics[baseName] = {
                name: baseName,
                type: normalizeMetricType(metadata.type || 'unknown'),
                help: metadata.help || '',
                values: [],
            };
        }

        metrics[baseName].values.push({ labels, value, timestamp });
    }

    return { metrics, timestamp: Date.now() };
}

function parseMetricLine(line: string): { name: string; labels: Record<string, string>; value: number; timestamp?: number; } | null {
    const match = line.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*)\s*(\{[^}]*\})?\s+([\d.eE+-]+)(\s+\d+)?/);
    if (!match) return null;

    const [, name, labelsStr, valueStr, timestampStr] = match;
    const value = parseFloat(valueStr);
    const timestamp = timestampStr ? parseInt(timestampStr.trim(), 10) : undefined;
    const labels: Record<string, string> = {};

    if (labelsStr) {
        const labelPairs = labelsStr.slice(1, -1).match(/(\w+)="([^"]*)"/g) || [];
        for (const pair of labelPairs) {
            const [key, val] = pair.split('=');
            labels[key] = val.replace(/^"|"$/g, '');
        }
    }

    return { name, labels, value, timestamp };
}

function normalizeMetricType(type: string): 'counter' | 'gauge' | 'histogram' | 'info' | 'unknown' {
    const normalized = type.toLowerCase();
    if (['counter', 'gauge', 'histogram', 'info'].includes(normalized)) {
        return normalized as 'counter' | 'gauge' | 'histogram' | 'info';
    }
    return 'unknown';
}

export function getMetricValue(metrics: Record<string, PrometheusMetric>, metricName: string, labelFilter?: Record<string, string>): number | null {
    const metric = metrics[metricName];
    if (!metric || metric.values.length === 0) return null;

    if (!labelFilter) {
        return metric.values[0].value;
    }

    const matching = metric.values.find(v => {
        return Object.entries(labelFilter).every(([key, val]) => v.labels[key] === val);
    });

    return matching ? matching.value : null;
}
