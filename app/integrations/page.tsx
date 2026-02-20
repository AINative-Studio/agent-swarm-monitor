'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { AIKitButton } from '../../components/aikit/AIKitButton';
import AvailableIntegrations from '../components/integrations/AvailableIntegrations';
import APIKeysManagement from '../components/integrations/APIKeysManagement';
import { Plug, Key, Plus } from 'lucide-react';
import type { APIKey } from '../lib/mockIntegrations';

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState('integrations');

  const handleCreateKey = () => {
    console.log('Create key initiated');
  };

  const handleCopyKey = (key: APIKey) => {
    console.log('Key copied:', key.id);
  };

  const handleRegenerateKey = (key: APIKey) => {
    console.log('Key regenerated:', key.id);
  };

  const handleDeleteKey = (key: APIKey) => {
    console.log('Key deleted:', key.id);
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-[#4B6FED] to-[#8A63F4] bg-clip-text text-transparent">
          Integrations & API Keys
        </h1>
        <p className="text-gray-400">
          Connect your agents to external platforms and manage API access
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-[#161B22]">
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Plug className="w-4 h-4" />
              Available Integrations
            </TabsTrigger>
            <TabsTrigger value="api-keys" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              API Keys
            </TabsTrigger>
          </TabsList>

          {activeTab === 'integrations' && (
            <AIKitButton
              variant="default"
              size="sm"
              className="flex items-center gap-2 bg-[#4B6FED] hover:bg-[#4B6FED]/90"
            >
              <Plus className="w-4 h-4" />
              Add Integration
            </AIKitButton>
          )}
        </div>

        {/* Available Integrations Tab */}
        <TabsContent value="integrations" className="mt-0">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-white mb-2">Connect Your Platforms</h2>
            <p className="text-sm text-gray-400">
              Configure integrations to deploy your agents across different communication channels
            </p>
          </div>
          <AvailableIntegrations />
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api-keys" className="mt-0">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-white mb-2">Manage API Keys</h2>
            <p className="text-sm text-gray-400">
              Create and manage API keys to authenticate your applications with the AgentClaw API
            </p>
          </div>
          <APIKeysManagement
            onCreateKey={handleCreateKey}
            onCopyKey={handleCopyKey}
            onRegenerateKey={handleRegenerateKey}
            onDeleteKey={handleDeleteKey}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}