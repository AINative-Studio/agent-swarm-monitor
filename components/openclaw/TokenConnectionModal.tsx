'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface TokenConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (data: { botToken: string; botUsername?: string }) => Promise<void>;
  channelType: 'telegram' | 'discord' | 'slack';
  channelName: string;
}

const instructions = {
  telegram: {
    title: 'How to get your Telegram bot token:',
    steps: [
      'Open Telegram and search for @BotFather',
      'Send /newbot and follow the prompts to create a bot',
      'Copy the bot token provided by BotFather',
      'Paste the token below',
    ],
    tokenLabel: 'Bot Token',
    tokenPlaceholder: '1234567890:ABCdefGHIjklMNOpqrsTUVwxyz',
    usernameLabel: 'Bot Username (optional)',
    usernamePlaceholder: '@your_bot_username',
  },
  discord: {
    title: 'How to get your Discord bot token:',
    steps: [
      'Go to Discord Developer Portal (discord.com/developers)',
      'Create a new application or select an existing one',
      'Navigate to the "Bot" section',
      'Copy the bot token',
      'Paste the token below',
    ],
    tokenLabel: 'Bot Token',
    tokenPlaceholder: 'MTk4NjIyNDgzNDcxOTI1MjQ4.Gh65s3.iOXo83qwGkdQrY0Dn7s',
    usernameLabel: 'Bot Username (optional)',
    usernamePlaceholder: 'MyDiscordBot#1234',
  },
  slack: {
    title: 'How to get your Slack bot token:',
    steps: [
      'Go to api.slack.com/apps and create a new app',
      'Navigate to "OAuth & Permissions"',
      'Add required bot token scopes',
      'Install the app to your workspace',
      'Copy the "Bot User OAuth Token"',
      'Paste the token below',
    ],
    tokenLabel: 'Bot User OAuth Token',
    tokenPlaceholder: 'xoxb-your-bot-token-here',
    usernameLabel: 'Workspace Name (optional)',
    usernamePlaceholder: 'My Workspace',
  },
};

export default function TokenConnectionModal({
  open,
  onOpenChange,
  onConnect,
  channelType,
  channelName,
}: TokenConnectionModalProps) {
  const [botToken, setBotToken] = useState('');
  const [botUsername, setBotUsername] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const config = instructions[channelType];

  const handleConnect = async () => {
    if (!botToken.trim()) {
      setError('Please enter a bot token');
      return;
    }

    setIsConnecting(true);
    setError(null);
    try {
      await onConnect({
        botToken: botToken.trim(),
        botUsername: botUsername.trim() || undefined,
      });
      onOpenChange(false);
      // Reset form
      setBotToken('');
      setBotUsername('');
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to connect ${channelName}`);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Connect {channelName}</DialogTitle>
          <DialogDescription>
            Enter your bot token to connect {channelName} to this agent
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="botToken">{config.tokenLabel}</Label>
            <Input
              id="botToken"
              type="password"
              placeholder={config.tokenPlaceholder}
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              disabled={isConnecting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="botUsername">{config.usernameLabel}</Label>
            <Input
              id="botUsername"
              type="text"
              placeholder={config.usernamePlaceholder}
              value={botUsername}
              onChange={(e) => setBotUsername(e.target.value)}
              disabled={isConnecting}
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded">
              {error}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">
              {config.title}
            </h4>
            <ol className="text-sm text-blue-800 space-y-1">
              {config.steps.map((step, index) => (
                <li key={index}>{index + 1}. {step}</li>
              ))}
            </ol>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isConnecting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
