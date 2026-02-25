# Channels Feature Guide

## Overview

The Channels page allows users to connect messaging platforms to their OpenClaw agents. Each agent can have independent channel configurations, enabling multi-platform communication.

## Supported Channels

| Channel | Status | Connection Method | Notes |
|---------|--------|-------------------|-------|
| WhatsApp | MVP | QR Code | QR code placeholder (full implementation pending) |
| Telegram | Full | Bot Token | Fastest setup via @BotFather |
| Slack | Full | Bot Token | OAuth coming in future release |
| Discord | Full | Bot Token | Discord Developer Portal |
| Microsoft Teams | Planned | - | Coming soon placeholder |

## User Flow

### 1. Select Agent
- User lands on `/channels` page
- Agent picker shows all available agents
- Select the agent to configure channels for
- Each agent maintains independent channel connections

### 2. View Channel Status
Channel cards display:
- Channel icon and name
- Description of the channel
- Connection status: "Connected" or "Not connected"
- "Connect" or "Manage" button

### 3. Connect a Channel

#### WhatsApp (QR Code)
1. Click "Connect" on WhatsApp card
2. Modal opens with QR code placeholder
3. Follow 4-step instructions:
   - Open WhatsApp on phone
   - Tap Menu → "Linked Devices"
   - Tap "Link a Device"
   - Scan QR code
4. Click "Connect (Demo)" to save
5. Channel status updates to "Connected"

#### Telegram/Discord/Slack (Bot Token)
1. Click "Connect" on channel card
2. Modal opens with token input form
3. Follow platform-specific instructions:
   - **Telegram**: Create bot via @BotFather
   - **Discord**: Create app in Developer Portal
   - **Slack**: Create app and install to workspace
4. Paste bot token (password-masked)
5. Optionally enter bot username/workspace name
6. Click "Connect"
7. Configuration saved to backend
8. Channel status updates to "Connected"

#### Microsoft Teams
1. Click "Connect" on Teams card
2. "Coming Soon" modal appears
3. Informational message about development status
4. Click "Got it" to dismiss

### 4. Disconnect a Channel
1. Click "Manage" on connected channel
2. Disconnect confirmation dialog appears
3. Warning message explains consequences
4. Click "Disconnect" to confirm or "Cancel" to abort
5. Channel status updates to "Not connected"

## Technical Implementation

### Data Flow

```
User Action
    ↓
Modal Component (WhatsApp/Token/ComingSoon)
    ↓
Parent Component Handler (handleWhatsAppConnect/handleTokenConnect)
    ↓
Update Agent Configuration
    ↓
API Call: PATCH /agents/:id/settings
    ↓
Backend Updates PostgreSQL
    ↓
React Query Invalidates Cache
    ↓
UI Refreshes with New Status
```

### Configuration Schema

Channels are stored in `agent.configuration.channels`:

```typescript
interface ChannelConfiguration {
  whatsapp?: {
    enabled: boolean;
    phoneNumber?: string;
    connectedAt?: string;
  };
  telegram?: {
    enabled: boolean;
    botToken?: string;
    botUsername?: string;
    connectedAt?: string;
  };
  slack?: {
    enabled: boolean;
    botToken?: string;
    workspace?: string;
    connectedAt?: string;
  };
  discord?: {
    enabled: boolean;
    botToken?: string;
    botUsername?: string;
    connectedAt?: string;
  };
  'microsoft-teams'?: {
    enabled: boolean;
    comingSoon?: boolean;
    connectedAt?: string;
  };
}
```

### Component Architecture

```
OpenClawChannelsClient (Main Container)
│
├── AgentPicker (Agent Selection)
│
├── ChannelRow × 5 (Display Channel Cards)
│
└── Modals (Lazy-rendered based on state)
    ├── WhatsAppConnectionModal
    ├── TokenConnectionModal (Telegram/Discord/Slack)
    ├── ComingSoonModal (Teams)
    └── DisconnectChannelDialog
```

## API Integration

### Read Configuration
```typescript
GET /agents
→ Returns agents with configuration.channels
```

### Update Configuration
```typescript
PATCH /agents/:id/settings
Body: {
  configuration: {
    channels: {
      telegram: {
        enabled: true,
        botToken: "1234567890:ABC...",
        botUsername: "@mybot",
        connectedAt: "2026-02-24T10:30:00Z"
      }
    }
  }
}
→ Returns updated agent
```

### Hooks Used
- `useAgentList()` - Fetch agents with React Query
- `useUpdateAgentSettings(agentId)` - Mutation for settings update
- Auto-refetch on mutation success via `invalidateQueries`

## Security Considerations

### Bot Token Storage
- Tokens stored in `agent.configuration.channels.<platform>.botToken`
- Masked in UI with `type="password"` input
- Transmitted via HTTPS to backend
- Backend should encrypt at rest

### Best Practices
1. Never log bot tokens
2. Use environment-specific tokens (dev/prod)
3. Rotate tokens periodically
4. Validate token format before saving
5. Handle token expiration gracefully

## Error Handling

### Connection Errors
```typescript
try {
  await handleTokenConnect('telegram', { botToken, botUsername });
} catch (error) {
  // Display error message in modal
  setError(error.message);
}
```

### Network Errors
- React Query automatic retry on failure
- Loading states during async operations
- User-friendly error messages

### Validation Errors
- Empty token → "Please enter a bot token"
- Invalid format → "Invalid token format"
- Backend validation → Display API error message

## User Experience Details

### Visual Feedback
- **Loading States**: Spinner during API calls
- **Success**: Modal closes, status updates
- **Error**: Red error banner in modal
- **Disabled State**: Buttons disabled during loading

### Accessibility
- Keyboard navigation support
- Screen reader labels
- Focus management in modals
- Clear error messages

### Responsive Design
- Mobile-friendly modals
- Touch-friendly buttons
- Proper spacing on small screens

## Testing Scenarios

### Happy Path
1. Select agent
2. Click "Connect" on Telegram
3. Enter valid bot token
4. Click "Connect"
5. ✓ Status shows "Connected"
6. ✓ "Manage" button appears

### Error Scenarios
1. Empty token → Validation error
2. Network failure → Retry with error message
3. Invalid agent ID → 404 error
4. Concurrent updates → Latest wins

### Edge Cases
1. No agents → Show empty state
2. All channels connected → Show all "Manage" buttons
3. Disconnect during API call → Loading state prevents race
4. Switch agents mid-flow → Modal closes, state resets

## Future Enhancements

### Phase 2
- [ ] WhatsApp real QR code via backend API
- [ ] WhatsApp WebSocket for scan confirmation
- [ ] Slack OAuth flow (replace token input)
- [ ] Microsoft Teams full implementation
- [ ] Connection health validation
- [ ] "Test Connection" button

### Phase 3
- [ ] Channel usage analytics
- [ ] Message volume charts
- [ ] Last message timestamp
- [ ] Auto-reconnect on token refresh
- [ ] Bulk channel operations
- [ ] Channel templates

### Phase 4
- [ ] Advanced routing rules
- [ ] Multi-channel broadcast
- [ ] Channel-specific personas
- [ ] Response time SLAs
- [ ] Channel performance metrics

## Troubleshooting

### "Connect" button doesn't work
- Check browser console for errors
- Verify agent is selected
- Ensure backend API is running

### Changes don't persist
- Check network tab for 200 response
- Verify React Query cache invalidation
- Refresh page to re-fetch from backend

### Modal doesn't open
- Check modal state in React DevTools
- Verify click handler is attached
- Look for JavaScript errors

## Related Documentation

- [Agent Configuration Schema](./AGENT_CONFIGURATION.md)
- [API Reference](./API_REFERENCE.md)
- [Component Library](./COMPONENTS.md)
- [Backend Integration](./BACKEND_INTEGRATION.md)
