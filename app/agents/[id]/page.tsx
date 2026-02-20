import { Metadata } from 'next';
import OpenClawAgentDetailClient from './OpenClawAgentDetailClient';

export const metadata: Metadata = {
  title: 'Agent Detail - OpenClaw',
  description: 'View and configure your AI agent settings, chat, channels, and skills',
};

interface AgentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OpenClawAgentDetailPage({ params }: AgentDetailPageProps) {
  const { id } = await params;
  return <OpenClawAgentDetailClient agentId={id} />;
}
