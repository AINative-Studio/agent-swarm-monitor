# Channels Feature - Quick Reference

## File Locations

```
app/channels/
  └── OpenClawChannelsClient.tsx       # Main container (304 lines)

components/openclaw/
  ├── WhatsAppConnectionModal.tsx      # QR code flow (122 lines)
  ├── TokenConnectionModal.tsx         # Token input (177 lines)
  ├── ComingSoonModal.tsx              # Placeholder (46 lines)
  ├── DisconnectChannelDialog.tsx      # Confirmation (39 lines)
  └── ChannelRow.tsx                   # Channel display (existing)

types/
  └── openclaw.ts                      # +46 lines for channel types
```

## Type Definitions

```typescript
// Channel display
interface Channel {
  id: string;
  name: string;
  icon: string;
  description: string;
  connected: boolean;
  connectionDetails?: ChannelConnectionDetails;
}

// Per-agent configuration
interface ChannelConfiguration {
  whatsapp?: { enabled: boolean; phoneNumber?: string; connectedAt?: string };
  telegram?: { enabled: boolean; botToken?: string; botUsername?: string; connectedAt?: string };
  slack?: { enabled: boolean; botToken?: string; workspace?: string; connectedAt?: string };
  discord?: { enabled: boolean; botToken?: string; botUsername?: string; connectedAt?: string };
  'microsoft-teams'?: { enabled: boolean; comingSoon?: boolean; connectedAt?: string };
}
```

## Component Usage

### WhatsAppConnectionModal
```tsx
<WhatsAppConnectionModal
  open={modalOpen}
  onOpenChange={setModalOpen}
  onConnect={async (data) => {
    // data: { phoneNumber: string }
    await saveToBackend(data);
  }}
/>
```

### TokenConnectionModal
```tsx
<TokenConnectionModal
  open={modalOpen}
  onOpenChange={setModalOpen}
  onConnect={async (data) => {
    // data: { botToken: string; botUsername?: string }
    await saveToBackend(data);
  }}
  channelType="telegram" // or "discord" | "slack"
  channelName="Telegram"
/>
```

### ComingSoonModal
```tsx
<ComingSoonModal
  open={modalOpen}
  onOpenChange={setModalOpen}
  channelName="Microsoft Teams"
/>
```

### DisconnectChannelDialog
```tsx
<DisconnectChannelDialog
  open={dialogOpen}
  onOpenChange={setDialogOpen}
  onConfirm={async () => {
    await disconnectChannel();
  }}
  channelName="Slack"
/>
```

## API Calls

### Read Channels
```typescript
const { data } = useAgentList();
const agent = data.agents.find(a => a.id === selectedId);
const channels = agent.configuration?.channels;
```

### Update Channels
```typescript
const updateSettings = useUpdateAgentSettings(agentId);

await updateSettings.mutateAsync({
  configuration: {
    ...agent.configuration,
    channels: {
      ...agent.configuration?.channels,
      telegram: {
        enabled: true,
        botToken: "...",
        botUsername: "@mybot",
        connectedAt: new Date().toISOString(),
      }
    }
  }
});
```

### Disconnect Channel
```typescript
await updateSettings.mutateAsync({
  configuration: {
    ...agent.configuration,
    channels: {
      ...agent.configuration?.channels,
      telegram: { enabled: false }
    }
  }
});
```

## State Management

```typescript
// Modal states
const [connectionModal, setConnectionModal] = useState<{
  type: 'whatsapp' | 'telegram' | 'slack' | 'discord' | 'microsoft-teams';
  channelName: string;
} | null>(null);

const [disconnectDialog, setDisconnectDialog] = useState<{
  type: string;
  channelName: string;
} | null>(null);

// Open connection modal
setConnectionModal({ type: 'telegram', channelName: 'Telegram' });

// Open disconnect dialog
setDisconnectDialog({ type: 'telegram', channelName: 'Telegram' });

// Close modals
setConnectionModal(null);
setDisconnectDialog(null);
```

## Channel Status Logic

```typescript
// Generate channel list
const channels = AVAILABLE_CHANNELS.map((channel) => {
  const config = channelConfig[channel.id];
  return {
    ...channel,
    connected: config?.enabled || false,
    connectionDetails: config?.enabled ? {
      workspace: config.workspace,
      username: config.botUsername,
      phoneNumber: config.phoneNumber,
      connectedAt: config.connectedAt,
    } : undefined,
  };
});
```

## Button Behavior

```typescript
const handleConnect = (channel: Channel) => {
  if (channel.connected) {
    // Show disconnect dialog
    setDisconnectDialog({
      type: channel.id,
      channelName: channel.name
    });
  } else {
    // Show connection modal
    setConnectionModal({
      type: channel.id,
      channelName: channel.name
    });
  }
};
```

## Testing Commands

```bash
# TypeScript check
npx tsc --noEmit

# Lint channel files
npx next lint --file "app/channels/**" --file "components/openclaw/*Connection*"

# Build (full)
npm run build

# Start dev server
npm run dev
```

## Common Tasks

### Add New Channel
1. Add to `AVAILABLE_CHANNELS` array
2. Add to `ChannelConfiguration` interface
3. Create connection modal (or reuse TokenConnectionModal)
4. Add modal to OpenClawChannelsClient render
5. Add handler for connect/disconnect

### Modify Connection Flow
1. Edit relevant modal component
2. Update handler in OpenClawChannelsClient
3. Update ChannelConfiguration type if needed

### Change Configuration Schema
1. Update `ChannelConfiguration` interface
2. Update backend schema (if needed)
3. Run database migrations
4. Update save/load logic

## Debugging Tips

### Modal Not Opening
- Check `connectionModal` state in React DevTools
- Verify `handleConnect` is called
- Check for TypeScript errors

### Configuration Not Saving
- Check Network tab for PATCH request
- Verify 200 response
- Check payload structure
- Look for backend errors

### Status Not Updating
- Verify React Query cache invalidation
- Check `queryKey` matches
- Refresh page to force re-fetch
- Check `useMemo` dependencies

## Performance Notes

- **useMemo**: Channel list regenerated only when `channelConfig` changes
- **React Query**: Automatic deduplication and caching
- **Lazy Modals**: Modals only render when open
- **Optimistic Updates**: Not implemented (could be added)

## Accessibility Checklist

- [x] Keyboard navigation
- [x] Focus management
- [x] ARIA labels
- [x] Screen reader support
- [x] Error announcements
- [x] Loading states

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Dependencies

```json
{
  "@radix-ui/react-dialog": "Dialog modals",
  "@radix-ui/react-alert-dialog": "Disconnect confirmation",
  "framer-motion": "Page animations",
  "@tanstack/react-query": "Data fetching",
  "lucide-react": "Icons"
}
```

## Related Issues

- Issue #76: Channels feature implementation
- Issue #78: Open Control UI button (branch context)
