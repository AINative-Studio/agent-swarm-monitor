import { Metadata } from 'next';
import OpenClawSwarmsClient from './OpenClawSwarmsClient';

export const metadata: Metadata = {
    title: 'Agent Swarms - OpenClaw',
    description: 'View, search, and manage your AI agent swarms',
};

export default function OpenClawSwarmsPage() {
    return <OpenClawSwarmsClient />;
}
