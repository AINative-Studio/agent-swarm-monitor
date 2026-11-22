'use client';

import { useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { NetworkTopology, NetworkNode, NetworkEdge } from '@/types/network';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

interface NetworkGraphProps {
    topology: NetworkTopology;
    width?: number;
    height?: number;
}

interface GraphNode {
    id: string;
    label: string;
    type: 'hub' | 'peer';
    status: 'online' | 'offline' | 'degraded';
    val: number;
    color: string;
}

interface GraphLink {
    source: string;
    target: string;
    latency: number;
    status: 'healthy' | 'degraded' | 'offline';
    color: string;
    width: number;
}

const NODE_COLORS = {
    hub_online: '#10b981',
    hub_offline: '#6b7280',
    hub_degraded: '#f59e0b',
    peer_online: '#3b82f6',
    peer_offline: '#9ca3af',
    peer_degraded: '#eab308',
} as const;

const EDGE_COLORS = {
    healthy: '#10b981',
    degraded: '#f59e0b',
    offline: '#ef4444',
} as const;

export default function NetworkGraph({ topology, width = 800, height = 600 }: NetworkGraphProps) {
    const fgRef = useRef<any>();

    const graphData = useMemo(() => {
        const nodes: GraphNode[] = topology.nodes.map((node) => {
            const colorKey = `${node.type}_${node.status}` as keyof typeof NODE_COLORS;
            return {
                id: node.id,
                label: node.label,
                type: node.type,
                status: node.status,
                val: node.type === 'hub' ? 20 : 10,
                color: NODE_COLORS[colorKey] || NODE_COLORS.peer_offline,
            };
        });

        const links: GraphLink[] = topology.edges.map((edge) => ({
            source: edge.source,
            target: edge.target,
            latency: edge.latency,
            status: edge.status,
            color: EDGE_COLORS[edge.status] || EDGE_COLORS.offline,
            width: edge.status === 'healthy' ? 2 : edge.status === 'degraded' ? 1.5 : 1,
        }));

        return { nodes, links };
    }, [topology]);

    useEffect(() => {
        if (fgRef.current) {
            fgRef.current.zoomToFit(400, 50);
        }
    }, []);

    return (
        <div className="relative border border-[#E8E6E1] rounded-lg overflow-hidden bg-white">
            <div className="absolute top-4 right-4 z-10 bg-white/95 backdrop-blur-sm border border-[#E8E6E1] rounded-lg p-3 shadow-sm">
                <div className="text-xs font-semibold text-gray-900 mb-2">Legend</div>
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: NODE_COLORS.hub_online }}></div>
                        <span className="text-xs text-gray-700">Hub</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: NODE_COLORS.peer_online }}></div>
                        <span className="text-xs text-gray-700">Peer (Online)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: NODE_COLORS.peer_degraded }}></div>
                        <span className="text-xs text-gray-700">Peer (Degraded)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: NODE_COLORS.peer_offline }}></div>
                        <span className="text-xs text-gray-700">Peer (Offline)</span>
                    </div>
                </div>
            </div>

            <ForceGraph2D
                ref={fgRef}
                graphData={graphData}
                width={width}
                height={height}
                nodeLabel={(node: any) => `
                    <div style="background: white; padding: 8px; border-radius: 6px; border: 1px solid #E8E6E1; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <div style="font-weight: 600; font-size: 13px; color: #111827; margin-bottom: 4px;">${node.label}</div>
                        <div style="font-size: 11px; color: #6b7280;">Type: ${node.type}</div>
                        <div style="font-size: 11px; color: #6b7280;">Status: ${node.status}</div>
                    </div>
                `}
                linkLabel={(link: any) => `
                    <div style="background: white; padding: 6px; border-radius: 4px; border: 1px solid #E8E6E1; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <div style="font-size: 11px; color: #111827;">Latency: ${link.latency.toFixed(1)}ms</div>
                        <div style="font-size: 11px; color: #6b7280;">Status: ${link.status}</div>
                    </div>
                `}
                nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
                    const label = node.label;
                    const fontSize = 12 / globalScale;
                    ctx.font = `${fontSize}px Sans-Serif`;
                    const textWidth = ctx.measureText(label).width;
                    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.4);

                    ctx.beginPath();
                    ctx.arc(node.x, node.y, node.val / globalScale, 0, 2 * Math.PI);
                    ctx.fillStyle = node.color;
                    ctx.fill();

                    ctx.strokeStyle = 'white';
                    ctx.lineWidth = 2 / globalScale;
                    ctx.stroke();

                    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                    ctx.fillRect(
                        node.x - bckgDimensions[0] / 2,
                        node.y + node.val / globalScale + 5 / globalScale,
                        bckgDimensions[0],
                        bckgDimensions[1]
                    );

                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#111827';
                    ctx.fillText(
                        label,
                        node.x,
                        node.y + node.val / globalScale + 5 / globalScale + bckgDimensions[1] / 2
                    );
                }}
                linkColor={(link: any) => link.color}
                linkWidth={(link: any) => link.width}
                linkDirectionalParticles={2}
                linkDirectionalParticleWidth={(link: any) => link.status === 'healthy' ? 2 : 0}
                linkDirectionalParticleSpeed={0.005}
                nodeRelSize={6}
                enableNodeDrag={true}
                cooldownTicks={100}
                onNodeClick={(node: any) => {
                    console.log('Clicked node:', node);
                }}
                d3AlphaDecay={0.02}
                d3VelocityDecay={0.3}
            />

            <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm border border-[#E8E6E1] rounded-lg px-3 py-2 shadow-sm">
                <div className="text-xs text-gray-600">
                    <span className="font-semibold">{graphData.nodes.length}</span> nodes •{' '}
                    <span className="font-semibold">{graphData.links.length}</span> connections
                </div>
            </div>
        </div>
    );
}
