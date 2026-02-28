'use client';

import { motion } from 'framer-motion';
import { Server, CheckCircle, Circle } from 'lucide-react';
import type { IPPoolStats } from '@/types/network';

interface IPPoolChartProps {
    stats: IPPoolStats;
}

export default function IPPoolChart({ stats }: IPPoolChartProps) {
    const utilizationColor =
        stats.utilizationPercent >= 90
            ? 'bg-red-500'
            : stats.utilizationPercent >= 70
              ? 'bg-yellow-500'
              : 'bg-green-500';

    const textColor =
        stats.utilizationPercent >= 90
            ? 'text-red-700'
            : stats.utilizationPercent >= 70
              ? 'text-yellow-700'
              : 'text-green-700';

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="border border-[#E8E6E1] rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-xs text-gray-500 mb-1">Total IPs</div>
                            <div className="text-2xl font-bold text-gray-900">{stats.totalIps}</div>
                        </div>
                        <Server className="w-8 h-8 text-gray-400" />
                    </div>
                </div>

                <div className="border border-[#E8E6E1] rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-xs text-gray-500 mb-1">Allocated</div>
                            <div className="text-2xl font-bold text-blue-600">{stats.allocatedIps}</div>
                        </div>
                        <CheckCircle className="w-8 h-8 text-blue-400" />
                    </div>
                </div>

                <div className="border border-[#E8E6E1] rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-xs text-gray-500 mb-1">Available</div>
                            <div className="text-2xl font-bold text-green-600">{stats.availableIps}</div>
                        </div>
                        <Circle className="w-8 h-8 text-green-400" />
                    </div>
                </div>

                <div className="border border-[#E8E6E1] rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-xs text-gray-500 mb-1">Utilization</div>
                            <div className={`text-2xl font-bold ${textColor}`}>
                                {stats.utilizationPercent.toFixed(1)}%
                            </div>
                        </div>
                        <div className={`w-8 h-8 rounded-full ${utilizationColor} opacity-20`}></div>
                    </div>
                </div>
            </div>

            <div className="border border-[#E8E6E1] rounded-lg p-6 bg-white">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">Pool Range</h3>
                    <span className="text-xs font-mono text-gray-600">{stats.poolRange}</span>
                </div>

                <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stats.utilizationPercent}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`h-full ${utilizationColor} flex items-center justify-end pr-3`}
                    >
                        {stats.utilizationPercent > 10 && (
                            <span className="text-xs font-semibold text-white">
                                {stats.allocatedIps} / {stats.totalIps}
                            </span>
                        )}
                    </motion.div>
                </div>

                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>0%</span>
                    <span>100%</span>
                </div>
            </div>

            <div className="border border-[#E8E6E1] rounded-lg overflow-hidden bg-white">
                <div className="px-4 py-3 bg-gray-50 border-b border-[#E8E6E1]">
                    <h3 className="text-sm font-semibold text-gray-900">Recent Allocations</h3>
                </div>

                <div className="max-h-64 overflow-y-auto">
                    {stats.allocations.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-gray-500">No IP allocations yet</div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">IP Address</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Peer ID</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Allocated At</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E8E6E1]">
                                {stats.allocations.slice(0, 10).map((allocation, index) => (
                                    <motion.tr
                                        key={allocation.ipAddress}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-4 py-2">
                                            <span className="text-sm font-mono text-gray-900">{allocation.ipAddress}</span>
                                        </td>
                                        <td className="px-4 py-2">
                                            <span className="text-sm text-gray-700">{allocation.peerId}</span>
                                        </td>
                                        <td className="px-4 py-2">
                                            <span className="text-xs text-gray-600">{new Date(allocation.allocatedAt).toLocaleString()}</span>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
