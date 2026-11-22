'use client';
import { motion } from 'framer-motion';

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

interface HealthIndicatorProps {
    status: HealthStatus;
    label: string;
    description?: string;
    showPulse?: boolean;
}

export default function HealthIndicator({ status, label, description, showPulse = true }: HealthIndicatorProps) {
    const config = getStatusConfig(status);
    return (
        <div className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 ${config.bgClass}`}>
            <div className="relative">
                <div className={`w-2.5 h-2.5 rounded-full ${config.dotClass}`} />
                {showPulse && status === 'healthy' && (
                    <motion.div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-400" animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0, 0.8] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className={`text-sm font-semibold ${config.textClass}`}>{label}</div>
                {description && <div className={`text-xs mt-0.5 ${config.descClass}`}>{description}</div>}
            </div>
        </div>
    );
}

interface HealthBadgeProps {
    status: HealthStatus;
    size?: 'sm' | 'md' | 'lg';
}

export function HealthBadge({ status, size = 'md' }: HealthBadgeProps) {
    const config = getStatusConfig(status);
    const sizeClasses = { sm: 'px-2 py-0.5 text-xs', md: 'px-2.5 py-1 text-sm', lg: 'px-3 py-1.5 text-base' };
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold uppercase tracking-wider ${sizeClasses[size]} ${config.badgeClass}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
            {status}
        </span>
    );
}

function getStatusConfig(status: HealthStatus) {
    switch (status) {
        case 'healthy': return { bgClass: 'bg-green-50 border-green-200', textClass: 'text-green-900', descClass: 'text-green-700 opacity-80', dotClass: 'bg-green-500', badgeClass: 'bg-green-100 text-green-700 border border-green-200' };
        case 'degraded': return { bgClass: 'bg-yellow-50 border-yellow-200', textClass: 'text-yellow-900', descClass: 'text-yellow-700 opacity-80', dotClass: 'bg-yellow-500', badgeClass: 'bg-yellow-100 text-yellow-700 border border-yellow-200' };
        case 'unhealthy': return { bgClass: 'bg-red-50 border-red-200', textClass: 'text-red-900', descClass: 'text-red-700 opacity-80', dotClass: 'bg-red-500', badgeClass: 'bg-red-100 text-red-700 border border-red-200' };
        default: return { bgClass: 'bg-gray-50 border-gray-200', textClass: 'text-gray-900', descClass: 'text-gray-700 opacity-80', dotClass: 'bg-gray-400', badgeClass: 'bg-gray-100 text-gray-700 border border-gray-200' };
    }
}
