'use client';

import { useState } from 'react';
import IntegrationCard from './IntegrationCard';
import { availableIntegrations } from '../../lib/mockIntegrations';
import type { Integration } from '../../lib/mockIntegrations';

export default function AvailableIntegrations() {
  const [integrations, setIntegrations] = useState<Integration[]>(availableIntegrations);

  const handleConnect = (integration: Integration) => {
    console.log('Connect:', integration.id);
  };

  const handleDisconnect = (integration: Integration) => {
    setIntegrations((prev) =>
      prev.map((int) =>
        int.id === integration.id ? { ...int, isConnected: false, config: undefined } : int
      )
    );
  };

  const handleConfigure = (integration: Integration) => {
    console.log('Configure:', integration.id);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {integrations.map((integration) => (
        <IntegrationCard
          key={integration.id}
          integration={integration}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          onConfigure={handleConfigure}
        />
      ))}
    </div>
  );
}
