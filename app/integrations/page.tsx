import { Metadata } from 'next';
import OpenClawIntegrationsClient from './OpenClawIntegrationsClient';

export const metadata: Metadata = {
  title: 'Integrations - OpenClaw',
  description: 'Connect external services like LinkedIn, Email, and more to your agents',
};

export default function OpenClawIntegrationsPage() {
  return <OpenClawIntegrationsClient />;
}
