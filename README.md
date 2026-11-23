# AgentClaw

AI agent management dashboard for the OpenClaw platform, built by AINative Studio. It gives operators a single place to provision, monitor, and configure a swarm of AI agents — their channels, integrations, conversations, and runtime health.

## What's in here

- **Agent lifecycle** — create, pause, resume, delete agents; configure persona, model, heartbeat, and sandbox settings
- **Chat history** — browse conversations grouped by agent, view full message transcripts with markdown/code rendering, semantic + keyword search across history, and real-time streaming of in-flight responses
- **Monitoring** — swarm health, Prometheus metrics, per-agent task/response/resource metrics, task dependency graphs, and TDD-cycle status for code-writing agents
- **Channels & integrations** — connect agents to Slack, Telegram, WhatsApp, Discord, Teams, Gmail, and LinkedIn
- **Team & settings** — manage team members and roles, gateway configuration, agent defaults, tool permissions, and an audit log of security-relevant events

## Tech stack

Next.js 15 (App Router) · React 18 · TypeScript (strict) · Tailwind CSS · TanStack React Query · Radix UI · Framer Motion · Vitest + React Testing Library · Playwright

See [`CLAUDE.md`](./CLAUDE.md) for the full architecture breakdown (directory structure, routes, data layer, and known gaps).

## Getting started

```bash
npm install
cp .env.example .env   # fill in NEXT_PUBLIC_API_URL and the OpenClaw gateway URL/token
npm run dev             # starts on http://localhost:3002
```

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on port 3002 |
| `npm run build` | Production build (standalone output) |
| `npm run start` | Production server on port 3002 |
| `npm run lint` | ESLint |
| `npm run type-check` | TypeScript, no emit |
| `npm test` | Vitest, single run |
| `npm run test:coverage` | Vitest with coverage |
| `npm run test:e2e` | Playwright end-to-end tests |

### Environment variables

```
API_URL=http://localhost:8001                     # OpenClaw backend API (server-side rewrite, next.config.ts)
NEXT_PUBLIC_API_URL=http://localhost:8001/api/v1   # OpenClaw backend API (client-side fetches, lib/api-client.ts)
NEXT_PUBLIC_OPENCLAW_GATEWAY_URL=http://localhost:18789
NEXT_PUBLIC_OPENCLAW_GATEWAY_TOKEN=<your-token>
```

`API_URL` and `NEXT_PUBLIC_API_URL` must point at the same backend — keep them in sync. The OpenClaw backend's standard local dev port is 8001; port 8000 is commonly used by unrelated local services and following the old `API_URL=http://localhost:8000` default here will silently 503/404 every list and detail page.

## Current state

Most of the data layer talks to an in-memory mock service (`lib/openclaw-service.ts` and friends) rather than a live backend — each method is clearly marked `// TODO: Replace with real API call`. This is deliberate: the frontend is built ahead of backend wiring, one endpoint at a time. Check `CLAUDE.md`'s "Known Issues" section for the current list of gaps (missing real auth-service wiring in a couple of places, dark mode not yet implemented, etc.) before assuming a feature is fully backend-connected.

## Contributing

- [`CODE_OF_CONDUCT.md`](./.github/CODE_OF_CONDUCT.md) and [`SUPPORT.md`](./.github/SUPPORT.md) live under `.github/`
- Issue templates are under `.github/ISSUE_TEMPLATE/`
- Scripts belong in `scripts/`; documentation belongs in `docs/` — only `README.md` and `CLAUDE.md` are allowed at the repo root (enforced by a pre-commit hook)

## License

MIT — see [`LICENSE`](./LICENSE).
