'use client';

import { MOCK_CHANNELS } from '@/lib/openclaw-mock-data';
import ChannelRow from './ChannelRow';

export default function AgentChannelsTab() {
  return (
    <div className="max-w-3xl">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900">Channels</h3>
        <p className="text-sm text-gray-500 mt-0.5">Connect messaging platforms</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white px-4">
        {MOCK_CHANNELS.map((channel) => (
          <ChannelRow
            key={channel.id}
            channel={channel}
            onConnect={() => {
              // Connection logic would go here
            }}
          />
        ))}
      </div>
    </div>
  );
}
