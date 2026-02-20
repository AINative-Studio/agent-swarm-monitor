'use client';

import { Card, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { AIKitButton } from '../../../components/aikit/AIKitButton';
import type { Integration } from '../../lib/mockIntegrations';
import { Plug, Settings, XCircle } from 'lucide-react';

interface IntegrationCardProps {
  integration: Integration;
  onConnect: (integration: Integration) => void;
  onDisconnect: (integration: Integration) => void;
  onConfigure: (integration: Integration) => void;
}

export default function IntegrationCard({
  integration,
  onConnect,
  onDisconnect,
  onConfigure,
}: IntegrationCardProps) {
  return (
    <Card className="bg-[#161B22] border-gray-700 hover:border-[#4B6FED]/40 transition-all">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#4B6FED]/20 to-[#8A63F4]/20 border border-[#4B6FED]/40 flex items-center justify-center">
              <Plug className="w-6 h-6 text-[#4B6FED]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{integration.name}</h3>
              <Badge
                variant={integration.isConnected ? 'default' : 'outline'}
                className={
                  integration.isConnected
                    ? 'bg-green-500/20 text-green-400 border-green-500/40'
                    : 'bg-gray-500/20 text-gray-400 border-gray-500/40'
                }
              >
                {integration.isConnected ? 'Connected' : 'Not Connected'}
              </Badge>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-400 mb-4">{integration.description}</p>

        <div className="flex gap-2">
          {!integration.isConnected ? (
            <AIKitButton
              variant="default"
              size="sm"
              onClick={() => onConnect(integration)}
              className="flex items-center gap-2 bg-[#4B6FED] hover:bg-[#4B6FED]/90"
            >
              <Plug className="w-4 h-4" />
              Connect
            </AIKitButton>
          ) : (
            <>
              <AIKitButton
                variant="outline"
                size="sm"
                onClick={() => onConfigure(integration)}
                className="flex items-center gap-2 border-gray-600 hover:bg-gray-800"
              >
                <Settings className="w-4 h-4" />
                Configure
              </AIKitButton>
              <AIKitButton
                variant="outline"
                size="sm"
                onClick={() => onDisconnect(integration)}
                className="flex items-center gap-2 border-red-600/40 text-red-400 hover:bg-red-500/10"
              >
                <XCircle className="w-4 h-4" />
                Disconnect
              </AIKitButton>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
