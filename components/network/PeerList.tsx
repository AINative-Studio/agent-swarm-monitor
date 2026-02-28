'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Wifi, WifiOff, AlertTriangle, QrCode, Eye } from 'lucide-react';
import type { PeerInfo } from '@/types/network';
import { usePeerQuality } from '@/hooks/useNetwork';
import { Button } from '@/components/ui/button';

interface PeerListProps {
    peers: PeerInfo[];
    onProvisionQR: (peerId: string) => void;
    onViewDetails?: (peer: PeerInfo) => void;
}

const STATUS_CONFIG = {
    online: {
        icon: Wifi,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        label: 'Online',
    },
    offline: {
        icon: WifiOff,
        color: 'text-gray-500',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        label: 'Offline',
    },
    degraded: {
        icon: AlertTriangle,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        label: 'Degraded',
    },
} as const;

function PeerQualityIndicator({ peerId }: { peerId: string }) {
    const { data: quality, isLoading } = usePeerQuality(peerId);

    if (isLoading) return <div className="text-xs text-gray-400">Loading...</div>;
    if (!quality) return <div className="text-xs text-gray-400">N/A</div>;

    const qualityColors = {
        excellent: 'text-green-600',
        good: 'text-blue-600',
        fair: 'text-yellow-600',
        poor: 'text-red-600',
    };

    return (
        <div className="flex flex-col gap-0.5">
            <div className={`text-xs font-medium ${qualityColors[quality.status]}`}>
                {quality.status.toUpperCase()}
            </div>
            <div className="text-xs text-gray-500">
                {quality.latency.toFixed(0)}ms • {quality.packetLoss.toFixed(1)}% loss
            </div>
        </div>
    );
}

export default function PeerList({ peers, onProvisionQR, onViewDetails }: PeerListProps) {
    return (
        <div className="border border-[#E8E6E1] rounded-lg overflow-hidden">
            <table className="w-full">
                <thead className="bg-gray-50 border-b border-[#E8E6E1]">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Node ID</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">IP Address</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Capabilities</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Quality</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Last Seen</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E6E1]">
                    {peers.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">No peers connected</td>
                        </tr>
                    ) : (
                        peers.map((peer, index) => {
                            const config = STATUS_CONFIG[peer.status];
                            const StatusIcon = config.icon;

                            return (
                                <motion.tr
                                    key={peer.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="hover:bg-gray-50 transition-colors"
                                >
                                    <td className="px-4 py-3">
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${config.bgColor} ${config.borderColor}`}>
                                            <StatusIcon className={`w-3.5 h-3.5 ${config.color}`} />
                                            <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-900">{peer.nodeId}</span>
                                            <span className="text-xs text-gray-500">v{peer.version}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-sm text-gray-700 font-mono">{peer.ipAddress}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1.5">
                                            {peer.capabilities.gpu && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-xs font-medium border border-purple-200">GPU</span>
                                            )}
                                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200">{peer.capabilities.cpu} CPU</span>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-50 text-green-700 text-xs font-medium border border-green-200">{(peer.capabilities.memory / 1024).toFixed(0)}GB</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {peer.status === 'online' ? (
                                            <PeerQualityIndicator peerId={peer.id} />
                                        ) : (
                                            <span className="text-xs text-gray-400">Offline</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-xs text-gray-600">{new Date(peer.lastSeen).toLocaleString()}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Button size="sm" variant="outline" onClick={() => onProvisionQR(peer.id)} className="h-7 px-2">
                                                <QrCode className="w-3.5 h-3.5" />
                                            </Button>
                                            {onViewDetails && (
                                                <Button size="sm" variant="outline" onClick={() => onViewDetails(peer)} className="h-7 px-2">
                                                    <Eye className="w-3.5 h-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </motion.tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}
