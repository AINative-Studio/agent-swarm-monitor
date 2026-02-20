import { Metadata } from 'next';
import OpenClawHomeClient from './OpenClawHomeClient';

export const metadata: Metadata = {
  title: 'Home - OpenClaw',
  description: 'Manage your AI agents, view activity, and explore templates',
};

export default function OpenClawHomePage() {
  return <OpenClawHomeClient />;
}
