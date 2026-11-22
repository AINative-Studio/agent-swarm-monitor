import { Metadata } from 'next';
import OpenClawConversationsClient from './OpenClawConversationsClient';

export const metadata: Metadata = {
  title: 'Conversations - OpenClaw',
  description: 'Browse conversation history across your agents, search by meaning or keyword, and jump straight to the matching message.',
};

export default function OpenClawConversationsPage() {
  return <OpenClawConversationsClient />;
}
