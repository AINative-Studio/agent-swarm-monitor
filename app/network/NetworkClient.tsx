'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Network, Activity, Server, AlertCircle } from 'lucide-react';
import { fadeUp } from '@/lib/openclaw-utils';
import { usePeerList, useProvisionQR, useIPPool, useNetworkTopology } from '@/hooks/useNetwork';
import PeerList from '@/components/network/PeerList';
import NetworkGraph from '@/components/network/NetworkGraph';
import IPPoolChart from '@/components/network/IPPoolChart';
import QRCodeModal from '@/components/network/QRCodeModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { QRCodeData } from '@/types/network';

export default function NetworkClient() {
    const [activeTab, setActiveTab] = useState('topology');
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [qrData, setQrData] = useState<QRCodeData | null>(null);

    const { data: peerList, isLoading: peersLoading } = usePeerList();
    const { data: ipPoolStats, isLoading: ipPoolLoading } = useIPPool();
    const { data: topology, isLoading: topologyLoading } = useNetworkTopology();
    const provisionQR = useProvisionQR();

    const handleProvisionQR = async (peerId: string) => {
        try {
            const data = await provisionQR.mutateAsync(peerId);
            setQrData(data);
            setQrModalOpen(true);
        } catch (error) {
            console.error('Failed to generate QR code:', error);
        }
    };

    const onlinePeers = peerList?.peers.filter((p) => p.status === 'online').length ?? 0;
    const totalPeers = peerList?.totalCount ?? 0;

    return (
        <div className="space-y-8">
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
                <h1 className="text-2xl font-bold text-gray-900">Network Management</h1>
                <p className="text-sm text-gray-500 mt-1">P2P network topology, peer monitoring, and IP pool management</p>
            </motion.div>

            <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border border-[#E8E6E1] rounded-lg p-5 bg-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs text-gray-500 mb-1">Active Peers</div>
                                <div className="text-2xl font-bold text-gray-900">{onlinePeers} / {totalPeers}</div>
                            </div>
                            <Network className="w-10 h-10 text-green-500" />
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${totalPeers > 0 ? (onlinePeers / totalPeers) * 100 : 0}%` }} />
                            </div>
                            <span className="text-xs text-gray-600">{totalPeers > 0 ? Math.round((onlinePeers / totalPeers) * 100) : 0}%</span>
                        </div>
                    </div>

                    <div className="border border-[#E8E6E1] rounded-lg p-5 bg-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs text-gray-500 mb-1">Network Health</div>
                                <div className="text-2xl font-bold text-green-600">
                                    {onlinePeers >= totalPeers * 0.9 ? 'Excellent' : onlinePeers >= totalPeers * 0.7 ? 'Good' : onlinePeers >= totalPeers * 0.5 ? 'Fair' : 'Poor'}
                                </div>
                            </div>
                            <Activity className="w-10 h-10 text-blue-500" />
                        </div>
                        <div className="mt-3 text-xs text-gray-600">Based on peer connectivity</div>
                    </div>

                    <div className="border border-[#E8E6E1] rounded-lg p-5 bg-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs text-gray-500 mb-1">IP Pool Usage</div>
                                <div className="text-2xl font-bold text-purple-600">{ipPoolStats?.utilizationPercent.toFixed(0) ?? 0}%</div>
                            </div>
                            <Server className="w-10 h-10 text-purple-500" />
                        </div>
                        <div className="mt-3 text-xs text-gray-600">{ipPoolStats?.allocatedIps ?? 0} of {ipPoolStats?.totalIps ?? 0} IPs allocated</div>
                    </div>
                </div>
            </motion.div>

            <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
                        <TabsTrigger value="topology" className="gap-2"><Network className="w-4 h-4" />Topology</TabsTrigger>
                        <TabsTrigger value="peers" className="gap-2"><Activity className="w-4 h-4" />Peers</TabsTrigger>
                        <TabsTrigger value="ip-pool" className="gap-2"><Server className="w-4 h-4" />IP Pool</TabsTrigger>
                    </TabsList>

                    <TabsContent value="topology" className="space-y-4">
                        <div className="border border-[#E8E6E1] rounded-lg p-4 bg-white">
                            <div className="mb-4">
                                <h2 className="text-sm font-semibold text-gray-900">Network Topology Graph</h2>
                                <p className="text-xs text-gray-500 mt-1">Real-time visualization of P2P connections and node health</p>
                            </div>

                            {topologyLoading ? (
                                <div className="flex items-center justify-center h-[600px] bg-gray-50 rounded-lg">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                                        <p className="text-sm text-gray-500">Loading topology...</p>
                                    </div>
                                </div>
                            ) : topology ? (
                                <NetworkGraph topology={topology} width={1200} height={600} />
                            ) : (
                                <div className="flex items-center justify-center h-[600px] bg-gray-50 rounded-lg">
                                    <div className="text-center">
                                        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">Unable to load network topology</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="peers" className="space-y-4">
                        <div>
                            <h2 className="text-sm font-semibold text-gray-900 mb-3">Connected Peers</h2>
                            {peersLoading ? (
                                <div className="h-64 rounded-lg bg-gray-50 animate-pulse" />
                            ) : peerList?.peers ? (
                                <PeerList peers={peerList.peers} onProvisionQR={handleProvisionQR} />
                            ) : (
                                <div className="border border-[#E8E6E1] rounded-lg p-8 text-center text-gray-500">
                                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm">No peers found</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="ip-pool" className="space-y-4">
                        <div>
                            <h2 className="text-sm font-semibold text-gray-900 mb-3">IP Address Pool Management</h2>
                            {ipPoolLoading ? (
                                <div className="h-96 rounded-lg bg-gray-50 animate-pulse" />
                            ) : ipPoolStats ? (
                                <IPPoolChart stats={ipPoolStats} />
                            ) : (
                                <div className="border border-[#E8E6E1] rounded-lg p-8 text-center text-gray-500">
                                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm">Unable to load IP pool statistics</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </motion.div>

            <QRCodeModal isOpen={qrModalOpen} onClose={() => setQrModalOpen(false)} qrData={qrData} isLoading={provisionQR.isPending} />
        </div>
    );
}
