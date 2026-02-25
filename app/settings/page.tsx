import { Metadata } from 'next';
import SettingsClient from './SettingsClient';

export const metadata: Metadata = {
  title: 'Settings - OpenClaw',
  description: 'Manage workspace settings, API keys, and preferences',
};

export default function SettingsPage() {
  return <SettingsClient />;
}
