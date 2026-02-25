import { Metadata } from 'next';
import OpenClawSwarmDetailClient from './OpenClawSwarmDetailClient';

export const metadata: Metadata = {
    title: 'Swarm Detail - OpenClaw',
    description: 'View and manage your agent swarm configuration and agents',
};

interface SwarmDetailPageProps {
    params: Promise<{ id: string }>;
}

export default async function OpenClawSwarmDetailPage({ params }: SwarmDetailPageProps) {
    const { id } = await params;
    return <OpenClawSwarmDetailClient swarmId={id} />;
}
