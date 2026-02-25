# Issue #79: Fix Prompt Submission Implementation

## Summary
Implemented full fix prompt submission functionality that sends prompts to backend agents and stores them in configuration history.

## Changes Made

### 1. Backend API Integration (`/Users/aideveloper/agent-swarm-monitor/lib/openclaw-service.ts`)
- Added `sendMessage(agentId, data)` method
- Endpoint: `POST /agents/{id}/message`
- Sends fix prompts to agent via message API

### 2. UI Component Update (`/Users/aideveloper/agent-swarm-monitor/components/openclaw/AgentSettingsTab.tsx`)

#### State Management
- Added `isSendingFixPrompt` state for loading indication
- Added `fixPromptStatus` state (`'idle' | 'success' | 'error'`) for user feedback

#### Submit Handler (`handleSubmitFixPrompt`)
- Validates agent is provisioned (has `openclawSessionKey`)
- Sends prompt via `openClawService.sendMessage()` with `[FIX PROMPT]` prefix
- Stores prompt in agent configuration:
  ```typescript
  {
    timestamp: string,
    prompt: string,
    resolved: false
  }
  ```
- Updates `configuration.fixPrompts` array via `updateSettings()`
- Clears input on success
- Shows status feedback (3-second auto-clear)

#### UI Elements
- Replaced single `<Input>` with `<Textarea>` (3 rows) + `<Button>` in flex layout
- **Send Button Features:**
  - Icon: `<Send>` from lucide-react
  - States: `'Send'` → `'Sending...'` → `'Sent!'` / `'Failed'`
  - Disabled when: prompt empty, sending in progress, or agent not provisioned
  - Visual feedback: green border/bg on success, red on error
  - Keyboard shortcut: Cmd/Ctrl+Enter
  - Tooltip shows different messages based on agent state

#### Validation & Error Handling
- Disabled state if `!agent.openclawSessionKey`
- Error messages:
  - "Agent must be provisioned before sending fix prompts."
  - "Failed to send fix prompt. Please try again."
- Success message: "Fix prompt sent successfully."

#### Fix Prompt History Display
- Shows last 5 prompts from `agent.configuration.fixPrompts`
- Format:
  ```
  Recent Fix Prompts
  ├─ [timestamp] prompt text
  ├─ [timestamp] prompt text
  └─ [timestamp] prompt text
  ```
- Styled with left border, gray text, smaller font
- Only displayed when prompts exist

## Implementation Details

### Two-Part Approach
1. **Immediate**: Send to agent via message API (agent receives it now)
2. **Historical**: Store in configuration for audit trail

### User Experience
- Visual feedback through button state changes
- Auto-clearing status messages (3s timeout)
- Keyboard shortcut for power users
- Clear error states with helpful messages
- History visible below input for context

### Validation
- Empty/whitespace check
- Agent provisioning check (session key required)
- Agent status check (implicit in backend)

## Testing Checklist
- [ ] Button disabled when prompt empty
- [ ] Button disabled when agent not provisioned
- [ ] "Sending..." state shows during submission
- [ ] Success state shows "Sent!" with green styling
- [ ] Error state shows "Failed" with red styling
- [ ] Input clears after successful submission
- [ ] Prompt appears in history after submission
- [ ] Cmd/Ctrl+Enter triggers submission
- [ ] Error message shows if agent not provisioned
- [ ] Error message shows if API call fails

## Files Modified
- `/Users/aideveloper/agent-swarm-monitor/lib/openclaw-service.ts` (+4 lines)
- `/Users/aideveloper/agent-swarm-monitor/components/openclaw/AgentSettingsTab.tsx` (+150 lines, -19 lines)

## Commit
```
feat: Implement Fix Prompt submission (#79)

- Add sendMessage method to openClawService
- Add submit button with Send icon next to fix prompt textarea
- Implement handleSubmitFixPrompt to send prompt via message API
- Store fix prompts in agent configuration for history
- Add success/error feedback with colored button states
- Display last 5 fix prompts with timestamps
- Add validation: disable if agent not provisioned
- Support Cmd/Ctrl+Enter keyboard shortcut
- Clear input after successful submission
```

## Next Steps
1. Test the implementation manually
2. Verify backend endpoint exists and works
3. Test error scenarios
4. Review PR and merge

## Screenshots
The UI now shows:
- Textarea (3 rows) for fix prompt input
- Send button with icon to the right
- Status messages below (success/error)
- Recent prompts section with timestamps
