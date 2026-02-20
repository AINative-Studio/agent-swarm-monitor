# Agent Swarm Monitor

Real-time monitoring dashboard for AI agent swarms with OpenClaw integration.

## Overview

A Next.js 14 dashboard for monitoring and managing AI agent swarms in real-time. Features live status updates, log streaming, metrics tracking, and OpenClaw Gateway integration.

## Features

- **Real-time Monitoring:** Live agent status updates every 5 seconds
- **Project Management:** Multi-project support with CRUD operations
- **Agent Details:** Individual agent progress, logs, and metrics
- **Log Streaming:** Real-time log viewer with filtering and scrolling
- **OpenClaw Integration:** Gateway connectivity and status display
- **Authentication:** JWT-based auth with AINative login
- **Responsive Design:** Mobile, tablet, and desktop support
- **Dark Theme:** Professional dark mode UI with glassmorphism effects

## Technology Stack

- **Framework:** Next.js 14, React 18, TypeScript 5.3
- **UI:** Tailwind CSS, Radix UI, Framer Motion
- **Charts:** Recharts 2.12
- **Icons:** Lucide React
- **Testing:** Jest 30, React Testing Library

## Quick Start

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Dashboard runs on `http://localhost:3002`

### Production Build

```bash
npm run build
npm start
```

### Testing

```bash
npm test
npm run test:watch
npm run test:coverage
```

## Configuration

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_OPENCLAW_WS_URL=ws://127.0.0.1:18789
NEXT_PUBLIC_AUTH_ENABLED=true
```

### API Integration

The dashboard connects to the OpenClaw backend API:

```typescript
// lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Endpoints
GET    /api/v1/admin/agent-swarm/projects              - List projects
GET    /api/v1/admin/agent-swarm/projects/{id}/status  - Project status
GET    /api/v1/admin/agent-swarm/projects/{id}/agents  - List agents
GET    /api/v1/admin/agent-swarm/projects/{id}/logs    - Get logs
GET    /api/v1/openclaw/status                         - OpenClaw status
POST   /api/v1/admin/agent-swarm/projects              - Create project
PUT    /api/v1/admin/agent-swarm/projects/{id}         - Update project
DELETE /api/v1/admin/agent-swarm/projects/{id}         - Delete project
```

## Project Structure

```
agent-swarm-monitor/
├── app/
│   ├── components/
│   │   ├── AgentSwarmMonitor.tsx        - Main dashboard component
│   │   ├── AppLayout.tsx                - Layout with sidebar
│   │   ├── agent/                       - Agent-specific components
│   │   ├── integrations/                - Integration components
│   │   ├── marketing/                   - Marketing features
│   │   └── aikit/                       - Reusable UI components
│   ├── lib/
│   │   ├── api.ts                       - API client
│   │   ├── mockData.ts                  - Mock data for development
│   │   └── utils.ts                     - Utility functions
│   ├── page.tsx                         - Home page
│   ├── templates/page.tsx               - Templates page
│   ├── team/page.tsx                    - Team page
│   └── integrations/page.tsx            - Integrations page
├── components/
│   └── aikit/                           - Shared UI kit
├── public/                              - Static assets
├── package.json
└── next.config.js
```

## Main Components

### AgentSwarmMonitor

The core dashboard component providing real-time monitoring:

```tsx
import AgentSwarmMonitor from './components/AgentSwarmMonitor';

<AgentSwarmMonitor />
```

**Features:**
- Project overview with status cards
- Active agents list with progress bars
- Real-time log streaming
- Metrics dashboard (tokens, cost, success rate)
- OpenClaw Gateway status indicator

### AppLayout

Navigation and layout wrapper:

```tsx
import AppLayout from './components/AppLayout';

<AppLayout>
  {/* Your content */}
</AppLayout>
```

## Authentication

Default test credentials:
```
Email: test_dashboard@test.com
Password: testpass123
```

For production, configure JWT authentication via environment variables.

## Performance

- **Initial Load:** ~1.5s
- **Data Refresh:** 5 second intervals
- **API Response:** ~200ms average
- **UI Responsiveness:** 60 FPS
- **Optimal Agents:** 3 concurrent (M3 hardware)
- **Max Tested:** 5 agents with 100% success rate

## Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel --prod
```

### Docker

```bash
docker build -t agent-swarm-monitor .
docker run -p 3002:3002 agent-swarm-monitor
```

### Railway

Connect your GitHub repo and deploy with auto-build detection.

## CLI Support

Install globally as a CLI tool:

```bash
npm install -g @ainative/agent-swarm-monitor

# Run
agent-swarm-monitor
# or
asm-monitor
```

## Development

### Adding New Features

1. Create component in `app/components/`
2. Add route in `app/[feature]/page.tsx`
3. Update navigation in `AppLayout.tsx`
4. Add tests in `__tests__/`

### Mock Data

For development without backend:

```typescript
import { mockProjects, mockAgents } from './lib/mockData';
```

## Testing

Run the test suite:

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

Current coverage: Comprehensive component and integration tests

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Accessibility

- WCAG 2.1 AA compliant
- Keyboard navigation support
- Screen reader friendly
- High contrast mode support

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## Related Repositories

- **Backend:** [openclaw-backend](https://github.com/AINative-Studio/openclaw-backend)
- **Core AINative:** [core](https://github.com/AINative-Studio/core)

## License

MIT

## Issues & Support

Report issues at: https://github.com/AINative-Studio/agent-swarm-monitor/issues

## Documentation

- **User Guide:** `docs/USER_GUIDE.md`
- **API Documentation:** `docs/API.md`
- **Component Library:** `docs/COMPONENTS.md`
- **Deployment Guide:** `docs/DEPLOYMENT.md`
