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
import openClawService from '@/lib/openclaw-service';
import { useToast } from '@/hooks/use-toast';
import { ApiTimeoutError } from '@/lib/api-client';

interface ChannelAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelId: string;
  channelName: string;
  authType: string;
  instructions: string[];
  onSuccess: () => void;
}

export function ChannelAuthDialog({
  open,
  onOpenChange,
  channelId,
  channelName,
  authType,
  instructions,
  onSuccess,
}: ChannelAuthDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [botToken, setBotToken] = useState('');
  const [slackBotToken, setSlackBotToken] = useState('');
  const [slackAppToken, setSlackAppToken] = useState('');
  const [qrCode, setQrCode] = useState<string | null>(null);

  const handleBotTokenSubmit = async () => {
    if (!botToken.trim()) {
      toast({
        title: 'Token required',
        description: 'Please enter your bot token',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await openClawService.addChannelBotToken({
        channel: channelId,
        token: botToken,
      });

      toast({
        title: 'Channel connected!',
        description: `${channelName} has been successfully configured`,
      });

      setBotToken('');
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      if (err instanceof ApiTimeoutError) {
        toast({
          title: 'Connection Timeout',
          description: 'Request timed out. Please check if the OpenClaw backend is running.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Connection failed',
          description: err.message || 'Failed to connect channel',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSlackSubmit = async () => {
    if (!slackBotToken.trim() || !slackAppToken.trim()) {
      toast({
        title: 'Tokens required',
        description: 'Please enter both bot token and app token',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await openClawService.addChannelSlack({
        bot_token: slackBotToken,
        app_token: slackAppToken,
      });

      toast({
        title: 'Slack connected!',
        description: 'Slack has been successfully configured',
      });

      setSlackBotToken('');
      setSlackAppToken('');
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      if (err instanceof ApiTimeoutError) {
        toast({
          title: 'Connection Timeout',
          description: 'Request timed out. Please check if the OpenClaw backend is running.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Connection failed',
          description: err.message || 'Failed to connect Slack',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQrCodeLogin = async () => {
    setLoading(true);
    try {
      const result = await openClawService.loginChannel({
        channel: channelId,
        verbose: true,
      });

      if (result.output) {
        // Try to extract QR code from output
        setQrCode(result.output);
      }

      if (result.success) {
        toast({
          title: 'Connected!',
          description: `${channelName} has been successfully connected`,
        });
        onSuccess();
        onOpenChange(false);
      }
    } catch (err: any) {
      if (err instanceof ApiTimeoutError) {
        toast({
          title: 'Connection Timeout',
          description: 'Request timed out. This may take up to 60 seconds. Please check if the OpenClaw backend is running.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Connection failed',
          description: err.message || 'Failed to generate QR code',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Connect {channelName}</DialogTitle>
          <DialogDescription>
            {authType === 'bot_token' && 'Enter your bot token to connect this channel'}
            {authType === 'oauth' && 'Configure your Slack workspace integration'}
            {authType === 'qr_code' && 'Scan the QR code with your phone to connect'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Instructions */}
          <div className="rounded-md bg-blue-50 p-4">
            <p className="text-sm font-medium text-blue-900 mb-2">Setup Instructions:</p>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              {instructions.map((instruction, idx) => (
                <li key={idx}>{instruction}</li>
              ))}
            </ol>
          </div>

          {/* Bot Token Input (Telegram, Discord) */}
          {authType === 'bot_token' && (
            <div className="space-y-2">
              <Label htmlFor="bot-token">Bot Token</Label>
              <Input
                id="bot-token"
                placeholder="Enter your bot token..."
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                disabled={loading}
              />
            </div>
          )}

          {/* Slack OAuth Tokens */}
          {authType === 'oauth' && channelId === 'slack' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="slack-bot-token">Bot Token (xoxb-...)</Label>
                <Input
                  id="slack-bot-token"
                  placeholder="xoxb-..."
                  value={slackBotToken}
                  onChange={(e) => setSlackBotToken(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slack-app-token">App Token (xapp-...)</Label>
                <Input
                  id="slack-app-token"
                  placeholder="xapp-..."
                  value={slackAppToken}
                  onChange={(e) => setSlackAppToken(e.target.value)}
                  disabled={loading}
                />
              </div>
            </>
          )}

          {/* WhatsApp QR Code */}
          {authType === 'qr_code' && (
            <div className="space-y-2">
              {qrCode ? (
                <div className="border rounded-lg p-4 bg-white">
                  <pre className="text-xs whitespace-pre-wrap font-mono">{qrCode}</pre>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">
                    Click "Generate QR Code" below to start the connection process
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>

          {authType === 'bot_token' && (
            <Button onClick={handleBotTokenSubmit} disabled={loading}>
              {loading ? 'Connecting...' : 'Connect'}
            </Button>
          )}

          {authType === 'oauth' && channelId === 'slack' && (
            <Button onClick={handleSlackSubmit} disabled={loading}>
              {loading ? 'Connecting...' : 'Connect Slack'}
            </Button>
          )}

          {authType === 'qr_code' && (
            <Button onClick={handleQrCodeLogin} disabled={loading}>
              {loading ? 'Generating...' : qrCode ? 'Refresh QR Code' : 'Generate QR Code'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
