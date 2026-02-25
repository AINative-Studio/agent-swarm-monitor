# Open Control UI Button Implementation

## Overview
Issue #78: Implemented functional "Open Control UI" button in the Agent Settings tab to access OpenClaw Gateway control interface.

## Implementation Details

### Modified Files
- `/components/openclaw/AgentSettingsTab.tsx`
- `/.env.example`

### Features Implemented

#### 1. Button Click Handler
The button now opens the OpenClaw Control UI in a new window/tab:
```typescript
onClick={() => {
  if (!agent.openclawSessionKey) return;

  const gatewayUrl = process.env.NEXT_PUBLIC_OPENCLAW_GATEWAY_URL || 'http://localhost:18789';
  const controlUrl = `${gatewayUrl}/control/${agent.openclawSessionKey}`;
  window.open(controlUrl, '_blank', 'noopener,noreferrer');
}}
```

#### 2. Disabled State
- Button is **disabled** when `agent.openclawSessionKey` is null
- This occurs when the agent is not yet provisioned
- Visual feedback: grayed out button with reduced opacity

#### 3. Tooltip/Title
- Shows helpful tooltip on hover:
  - **When disabled**: "Agent must be provisioned before accessing Control UI"
  - **When enabled**: "Open OpenClaw Control UI in new window"

#### 4. Helper Text
- Displays italic gray text below the button when disabled:
  - "Control UI will be available once the agent is provisioned."
- Automatically hidden when agent is provisioned

#### 5. Security
- Uses `noopener,noreferrer` flags in `window.open()` to prevent security vulnerabilities
- Prevents the opened page from accessing the `window.opener` object

#### 6. Environment Configuration
Added `NEXT_PUBLIC_OPENCLAW_GATEWAY_URL` environment variable:
- **Default**: `http://localhost:18789`
- **Production**: Override in Railway/deployment environment
- **Prefix**: `NEXT_PUBLIC_` makes it available in browser

## Edge Cases Handled

| Scenario | Behavior |
|----------|----------|
| Agent not provisioned (no session key) | Button disabled with tooltip explanation |
| Gateway URL not configured | Falls back to `http://localhost:18789` |
| Agent provisioned | Button enabled, opens control UI in new tab |
| User clicks disabled button | No action (onClick guard clause) |

## Gateway Endpoint Status

**Note**: As of this implementation, the OpenClaw Gateway **does not yet expose** a `/control/{session_key}` endpoint. The gateway currently only has:
- `GET /health` - Health check
- `GET /workflows/:uuid` - Workflow status
- `POST /messages` - Message submission

The button implementation is **forward-compatible** and ready for when the control UI endpoint is added to the gateway.

## Testing

### Build Test
```bash
cd /Users/aideveloper/agent-swarm-monitor
npm run build
```
Result: **✓ Compiled successfully** (no TypeScript errors)

### Manual Testing Checklist
- [ ] Button is disabled when agent status is "provisioning" or "stopped"
- [ ] Button is enabled when agent status is "running" with valid session key
- [ ] Clicking enabled button opens new tab/window
- [ ] URL format is correct: `{gatewayUrl}/control/{sessionKey}`
- [ ] Tooltip shows correct message based on state
- [ ] Helper text appears/disappears based on provisioning state

## Environment Variables

### Local Development (.env.example)
```bash
API_URL=http://localhost:8000
NEXT_PUBLIC_OPENCLAW_GATEWAY_URL=http://localhost:18789
```

### Production (Railway/Deployment)
Set in deployment environment:
```bash
NEXT_PUBLIC_OPENCLAW_GATEWAY_URL=https://gateway.openclaw.production.url
```

## Future Enhancements

When the OpenClaw Gateway implements the control UI:

1. **Error Handling**: Add check to verify the endpoint exists before opening
2. **Loading State**: Show loading indicator while verifying URL
3. **Embedded UI**: Consider iframe/modal option instead of new window
4. **Authentication**: Pass session token or API key to control UI
5. **Deep Linking**: Support direct links to specific control pages

## Related Files
- `/Users/aideveloper/openclaw-backend/openclaw-gateway/dist/server.js` - Gateway endpoints
- `/Users/aideveloper/agent-swarm-monitor/types/openclaw.ts` - TypeScript types
- `/Users/aideveloper/agent-swarm-monitor/components/openclaw/AgentSettingsTab.tsx` - Component implementation
