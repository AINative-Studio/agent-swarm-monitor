'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAgentList } from '@/hooks/useOpenClawAgents';
import { MOCK_INTEGRATIONS } from '@/lib/openclaw-mock-data';
import { fadeUp } from '@/lib/openclaw-utils';
import AgentPicker from '@/components/openclaw/AgentPicker';
import IntegrationRow from '@/components/openclaw/IntegrationRow';

export default function OpenClawIntegrationsClient() {
  const { data } = useAgentList();
  const agents = data?.agents ?? [];
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>(
    agents[0]?.id
  );

  // Update selection when agents load
  useEffect(() => {
    if (agents.length > 0 && !selectedAgentId) {
      setSelectedAgentId(agents[0].id);
    }
  }, [agents, selectedAgentId]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        custom={0}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
        <p className="text-sm text-gray-500 mt-1">
          Connect external services like LinkedIn, Email, and more
        </p>
      </motion.div>

      {/* Agent picker */}
      <motion.div
        custom={1}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <AgentPicker
          agents={agents}
          selectedId={selectedAgentId}
          onSelect={setSelectedAgentId}
        />
      </motion.div>

      {/* Integrations card */}
      <motion.div
        custom={2}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="rounded-lg border border-gray-200 bg-white"
      >
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            Integrations
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Connect external services
          </p>
        </div>

        <div className="px-5">
          {MOCK_INTEGRATIONS.map((integration) => (
            <IntegrationRow
              key={integration.id}
              integration={integration}
              onConnect={() => {
                // Connection logic would go here
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
