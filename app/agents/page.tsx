import { Metadata } from 'next';
import { Suspense } from 'react';
import OpenClawAgentsClient from './OpenClawAgentsClient';

export const metadata: Metadata = {
  title: 'Agents - OpenClaw',
  description: 'View, search, and manage your AI agents',
};

export default function OpenClawAgentsPage() {
  return (
    <Suspense>
      <OpenClawAgentsClient />
    </Suspense>
  );
}
