import { Metadata } from 'next';
import OpenClawChannelsClient from './OpenClawChannelsClient';

export const metadata: Metadata = {
  title: 'Channels - OpenClaw',
  description: 'Connect messaging platforms like Slack, Telegram, and more to your agents',
};

export default function OpenClawChannelsPage() {
  return <OpenClawChannelsClient />;
}
