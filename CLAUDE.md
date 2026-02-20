# AgentClaw — AI Agent Management Dashboard

Next.js 15 (App Router) dashboard for managing AI agent swarms via the OpenClaw platform. Built by AINative Studio.

## Tech Stack

- **Next.js 15.1** — App Router, `output: 'standalone'` (Docker-ready)
- **React 18.3 / TypeScript 5.6** — Strict mode, bundler module resolution
- **Tailwind CSS 3.4** — HSL CSS variable theme system (shadcn/ui pattern)
- **TanStack React Query v5** — Server state management with polling (5-10s intervals)
- **Radix UI** — Headless primitives (alert-dialog, dialog, label, select, separator, slot, switch, tabs)
- **Framer Motion 11** — Page entrance animations (fadeUp stagger pattern)
- **Lucide React** — Icon library
- **Vitest 2.1 / React Testing Library 16 / jsdom 25** — Testing stack
- **class-variance-authority (CVA)** — Component variant system for Button/Badge

## Directory Structure

```
app/
  globals.css                   # Tailwind directives + HSL CSS custom properties (light theme only)
  layout.tsx                    # Root layout: Inter font → QueryProvider → OpenClawLayoutShell
  page.tsx                      # Home route (server component)
  OpenClawHomeClient.tsx        # Home dashboard: greeting, stat cards, agent list, templates
  OpenClawLayoutShell.tsx       # Responsive sidebar + main content wrapper (md breakpoint)
  agents/page.tsx               # /agents (server component)
  agents/OpenClawAgentsClient.tsx  # Agent list: search, table, create dialog
  agents/[id]/page.tsx          # /agents/[id] (server component, async params)
  agents/[id]/OpenClawAgentDetailClient.tsx  # Agent detail: 4 tabs, actions (pause/resume/delete/heartbeat)
  channels/page.tsx             # /channels
  channels/OpenClawChannelsClient.tsx  # Channel management with agent picker
  integrations/page.tsx         # /integrations
  integrations/OpenClawIntegrationsClient.tsx  # Integration management with agent picker
  team/page.tsx                 # /team
  team/OpenClawTeamClient.tsx   # Team management: add member form, role management
  templates/page.tsx            # /templates
  templates/OpenClawTemplatesClient.tsx  # Template browser with category filter pills

components/
  openclaw/                     # Domain-specific components
    AgentChannelsTab.tsx        # Channels list for agent detail
    AgentChatTab.tsx            # Simulated chat interface (1s delay mock responses)
    AgentPicker.tsx             # Radix Select dropdown for agent selection
    AgentSettingsTab.tsx        # Full settings form (350 lines): name, model, persona, heartbeat, integrations, API keys, danger zone
    AgentSkillsTab.tsx          # Placeholder "Skills coming soon"
    AgentStatusBadge.tsx        # Color-coded status dot + label (running/paused/stopped/failed/provisioning)
    ChannelRow.tsx              # Channel row with inline SVG brand icons (Slack/Telegram/WhatsApp/Discord/Teams)
    CreateAgentDialog.tsx       # Modal form: name, model, persona
    IntegrationRow.tsx          # Integration row with inline SVG icons (Gmail/LinkedIn)
    OpenClawSidebar.tsx         # 8 nav items + user profile footer + AINative Studio branding
    TemplateCard.tsx            # Template card with icon color badges
    TemplateGrid.tsx            # Responsive grid container for template cards
  providers/
    query-provider.tsx          # React Query provider (staleTime 60s, refetchOnWindowFocus false)
  ui/                           # shadcn/ui primitives (11 components)
    alert-dialog.tsx, badge.tsx, button.tsx, dialog.tsx, input.tsx,
    label.tsx, select.tsx, separator.tsx, switch.tsx, tabs.tsx, textarea.tsx

hooks/
  useOpenClawAgents.ts          # 7 React Query hooks wrapping OpenClawService

lib/
  openclaw-mock-data.ts         # 5 mock agents, 9 templates, 2 integrations, 5 channels, 1 team member, 11 API key providers
  openclaw-service.ts           # Singleton service class (ALL methods are mock — TODO: replace with fetch)
  openclaw-utils.ts             # formatRelativeTime, formatHeartbeatInterval, formatModelShort, MODEL_OPTIONS, fadeUp animation variants
  utils.ts                      # cn() — clsx + tailwind-merge

types/
  openclaw.ts                   # All type definitions (OpenClawAgent, CreateAgentRequest, etc.)
```

## Routes

| Route | Server Page | Client Component | Description |
|-------|-------------|------------------|-------------|
| `/` | `app/page.tsx` | `OpenClawHomeClient` | Dashboard home — greeting, stat cards, agent list, templates |
| `/agents` | `app/agents/page.tsx` | `OpenClawAgentsClient` | Agent list with search, create dialog, template section |
| `/agents/[id]` | `app/agents/[id]/page.tsx` | `OpenClawAgentDetailClient` | Agent detail — Settings/Chat/Channels/Skills tabs |
| `/channels` | `app/channels/page.tsx` | `OpenClawChannelsClient` | Channel management (Slack, Telegram, WhatsApp, Discord, Teams) |
| `/integrations` | `app/integrations/page.tsx` | `OpenClawIntegrationsClient` | Integration management (Gmail, LinkedIn) |
| `/team` | `app/team/page.tsx` | `OpenClawTeamClient` | Team member management with roles |
| `/templates` | `app/templates/page.tsx` | `OpenClawTemplatesClient` | Template browser with category filter |
| `/audit-log` | **MISSING** | — | Referenced in sidebar, no page exists |
| `/settings` | **MISSING** | — | Referenced in sidebar, no page exists |

## Commands

```bash
npm run dev          # Dev server on port 3002
npm run build        # Production build (standalone output)
npm run start        # Production server on port 3002
npm run lint         # ESLint (next/core-web-vitals)
npm run type-check   # TypeScript type checking (tsc --noEmit)
npm test             # Vitest single run (NEVER use watch mode)
npm run test:coverage # Vitest with V8 coverage
```

## Environment Variables

```
API_URL=http://localhost:8000    # OpenClaw backend API (default in next.config.ts)
```

## Architecture Patterns

- **Server Component + Client Component**: Every route has a thin server `page.tsx` (metadata + render) and a `'use client'` component with all interactivity. Server pages use Next.js 15 async params pattern.
- **Service Singleton**: `OpenClawService` class in `lib/openclaw-service.ts` — single instance, all data access goes through it. Currently mock, ready for real API replacement.
- **React Query Hooks**: `hooks/useOpenClawAgents.ts` — 7 hooks (4 queries, 4 mutations) wrapping the service singleton. Queries auto-poll at 5-10s intervals. Mutations invalidate relevant query keys.
- **shadcn/ui Components**: `components/ui/` contains 11 Radix UI-based primitives with Tailwind styling and CVA variants. Imported via `@/components/ui/*`.
- **HSL CSS Variable Theme**: Colors defined as HSL values in `app/globals.css` `:root`, consumed via Tailwind config's `hsl(var(--*))` pattern.
- **Framer Motion Animations**: `fadeUp` variant in `openclaw-utils.ts` provides staggered entrance animations across all pages.
- **Path Alias**: `@/*` maps to project root (configured in tsconfig.json and vitest.config.ts).

## Key Data Types (types/openclaw.ts)

| Type | Key Fields |
|------|-----------|
| `AgentStatus` | `'provisioning' \| 'running' \| 'paused' \| 'stopped' \| 'failed'` |
| `OpenClawAgent` | id, name, persona, model, status, heartbeatEnabled, heartbeatInterval, heartbeatChecklist, configuration, errorMessage, timestamps |
| `CreateAgentRequest` | name, persona?, model, heartbeat?, configuration? |
| `UpdateAgentSettingsRequest` | persona?, model?, heartbeat?, configuration? |
| `OpenClawTemplate` | id, name, description, category, icons, defaultModel, defaultPersona |
| `Integration` | id, name, icon, description, connected, comingSoon? |
| `Channel` | id, name, icon, description, connected |
| `TeamMember` | id, name, email, role ('owner'\|'editor'\|'viewer'), avatarInitials |
| `ApiKeyProvider` | id, name, configured |

## React Query Hooks (hooks/useOpenClawAgents.ts)

| Hook | Type | Query Key | Polling |
|------|------|-----------|---------|
| `useAgentList(status?)` | Query | `['openclaw-agents', status]` | 10s |
| `useAgent(agentId)` | Query | `['openclaw-agent', agentId]` | 5s |
| `useCreateAgent()` | Mutation | invalidates agents list | — |
| `usePauseAgent()` | Mutation | invalidates list + agent | — |
| `useResumeAgent()` | Mutation | invalidates list + agent | — |
| `useUpdateAgentSettings(agentId)` | Mutation | invalidates list + agent | — |
| `useDeleteAgent()` | Mutation | invalidates agents list | — |
| `useExecuteHeartbeat()` | Mutation | invalidates agent | — |

## Service Layer — Backend Integration Status

`lib/openclaw-service.ts` is 100% mock. Every method has `// TODO: Replace with real API call`. The `baseUrl` property (`/v1/agent-swarm/agents`) is declared but unused.

| Service Method | Mock Behavior | Future API Call |
|---------------|---------------|-----------------|
| `listAgents(status?, limit, offset)` | Filters/paginates in-memory array | `GET /v1/agent-swarm/agents?status=&limit=&offset=` |
| `getAgent(agentId)` | Finds in array | `GET /v1/agent-swarm/agents/{id}` |
| `createAgent(data)` | Pushes to array | `POST /v1/agent-swarm/agents` |
| `provisionAgent(agentId)` | Sets status='running' | `POST /v1/agent-swarm/agents/{id}/provision` |
| `pauseAgent(agentId)` | Sets status='paused' | `POST /v1/agent-swarm/agents/{id}/pause` |
| `resumeAgent(agentId)` | Sets status='running' | `POST /v1/agent-swarm/agents/{id}/resume` |
| `updateSettings(agentId, data)` | Updates fields in-memory | `PATCH /v1/agent-swarm/agents/{id}/settings` |
| `deleteAgent(agentId)` | Splices from array | `DELETE /v1/agent-swarm/agents/{id}` |
| `executeHeartbeat(agentId)` | Returns static success | `POST /v1/agent-swarm/agents/{id}/heartbeat` |

Backend monitoring endpoints (already built in openclaw-backend):
- `GET /metrics` — Prometheus metrics
- `GET /swarm/health` — Swarm health snapshot
- `GET /swarm/timeline` — Task timeline events
- `GET/PUT /swarm/alerts/thresholds` — Alert thresholds
- `GET /swarm/monitoring/status` — Monitoring infrastructure health

## Known Issues

1. **100% Mock Data** — Zero real HTTP calls. Service layer uses in-memory arrays that reset on module re-initialization.
2. **Missing Pages** — `/audit-log`, `/settings` referenced in sidebar but have no page implementations.
3. **Missing CLI Binary** — `package.json` declares `bin` entries pointing to `./bin/cli.js` which does not exist.
4. **No Tests** — Despite Vitest config, zero test files exist.
5. **Hardcoded User** — "Toby Morning" / "toby@ainative.studio" hardcoded in sidebar and home greeting. No auth layer.
6. **No Dark Mode** — Tailwind config has `darkMode: ["class"]` but only light-theme CSS variables defined.
7. **Simulated Chat** — `AgentChatTab` returns canned response after 1s delay. No WebSocket/streaming.
8. **No Error Boundaries** — No React error boundaries or global error handling.
9. **Duplicated fadeUp** — Framer Motion variant defined in `openclaw-utils.ts` but duplicated locally in `OpenClawTeamClient.tsx` and `OpenClawTemplatesClient.tsx`.
10. **Hardcoded Stats** — "Requests Today" and "Spend Today" on home page hardcoded to 0.
