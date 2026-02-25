# Testing Guide: Open Control UI Button (Issue #78)

## Overview
This guide provides step-by-step instructions for testing the "Open Control UI" button functionality.

## Prerequisites
- Agent Swarm Monitor running locally
- OpenClaw Gateway running at http://localhost:18789

## Test Scenarios

### Scenario 1: Unprovisioned Agent
**Expected Behavior:**
- Button is DISABLED
- Tooltip shows: "Agent must be provisioned first"
- Helper text shows: "Control UI will be available once the agent is provisioned."

**Steps:**
1. Create a new agent
2. Navigate to agent detail page
3. Click Settings tab
4. Locate "Control" section
5. Verify button state

### Scenario 2: Provisioned but Not Running
**Expected Behavior:**
- Button is DISABLED
- Tooltip shows: "Agent must be running or paused"
- Helper text shows: "Control UI is only accessible when the agent is running or paused."

**Steps:**
1. Create and provision an agent
2. Ensure agent status is PROVISIONING, STOPPED, or FAILED
3. Navigate to agent detail page → Settings tab
4. Verify button state

### Scenario 3: Agent Running
**Expected Behavior:**
- Button is ENABLED
- Tooltip shows: "Open OpenClaw Control UI in new window"
- Clicking opens http://localhost:18789/ in new tab
- OpenClaw Gateway dashboard loads

**Steps:**
1. Create and provision an agent
2. Start the agent (status: RUNNING)
3. Navigate to agent detail page → Settings tab
4. Click "Open Control UI" button
5. Verify new tab opens with gateway dashboard

### Scenario 4: Agent Paused
**Expected Behavior:**
- Same as Scenario 3 (button should work when paused)

**Steps:**
1. Create and provision an agent
2. Start the agent, then pause it
3. Navigate to agent detail page → Settings tab
4. Click "Open Control UI" button
5. Verify new tab opens with gateway dashboard

### Scenario 5: WebSocket URL Conversion
**Expected Behavior:**
- If NEXT_PUBLIC_OPENCLAW_GATEWAY_URL is set to ws://localhost:18789
- Button should convert it to http://localhost:18789 before opening

**Steps:**
1. Update .env.local: NEXT_PUBLIC_OPENCLAW_GATEWAY_URL=ws://localhost:18789
2. Restart dev server
3. Test button with running agent
4. Verify correct HTTP URL opens (not WS)

## Environment Variable Testing

### Default Configuration
The button uses this default if env var is not set:
```
http://localhost:18789
```

### Custom Configuration
Add to `.env.local`:
```
NEXT_PUBLIC_OPENCLAW_GATEWAY_URL=http://localhost:18789
```

Or for WebSocket (will auto-convert):
```
NEXT_PUBLIC_OPENCLAW_GATEWAY_URL=ws://localhost:18789
```

## Expected Results Summary

| Agent State | openclawSessionKey | Status | Button Enabled? |
|-------------|-------------------|--------|-----------------|
| Just created | null | - | ❌ |
| Provisioning | present | provisioning | ❌ |
| Stopped | present | stopped | ❌ |
| Failed | present | failed | ❌ |
| Running | present | running | ✅ |
| Paused | present | paused | ✅ |

## Notes

- The Control UI is NOT session-specific
- It opens the gateway root dashboard showing ALL sessions
- There is NO `/control/{sessionKey}` endpoint
- The gateway URL at root (/) provides the management interface

## Troubleshooting

### Button does nothing when clicked
- Check browser console for errors
- Verify popup blocker isn't blocking the window
- Confirm NEXT_PUBLIC_OPENCLAW_GATEWAY_URL is accessible

### Gateway dashboard doesn't load
- Verify OpenClaw Gateway is running
- Check http://localhost:18789 directly in browser
- Ensure gateway health endpoint responds

### Alert: "OpenClaw Gateway URL not configured"
- This should never happen with default fallback
- Check that environment variable is properly formatted
- Restart dev server after changing .env.local
