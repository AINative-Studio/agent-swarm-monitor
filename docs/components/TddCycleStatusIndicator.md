# TddCycleStatusIndicator Component

Real-time visual indicator showing the current phase of the Test-Driven Development (TDD) cycle with test execution metrics and coverage tracking.

## Overview

The `TddCycleStatusIndicator` component displays the current TDD workflow phase (Red → Green → Refactor) with visual feedback, test metrics, and code coverage information. It follows the standard TDD methodology of writing tests first, making them pass, and then refactoring.

## Features

- **Phase Visualization**: Color-coded indicators for all TDD cycle phases
- **Real-time Metrics**: Live test pass/fail counts and coverage percentage
- **Visual Feedback**: Animated icons and progress bars
- **Coverage Warnings**: Alerts when coverage falls below 80% target
- **Responsive Design**: Compact and full display modes
- **Accessibility**: Full ARIA labels and keyboard navigation support

## TDD Phases

| Phase | Color | Icon | Description |
|-------|-------|------|-------------|
| `idle` | Gray | Circle | No active TDD cycle |
| `writing_tests` | Yellow | FileEdit | Creating test cases |
| `red` | Red | XCircle | Tests failing (expected) |
| `green` | Green | CheckCircle2 | All tests passing |
| `refactoring` | Blue | Wrench | Improving code quality |

## Usage

### Basic Usage

```tsx
import TddCycleStatusIndicator from '@/components/monitoring/TddCycleStatusIndicator';
import type { TddCycleStatus } from '@/types/monitoring';

const status: TddCycleStatus = {
    phase: 'green',
    label: 'Tests Passing',
    description: 'All tests passing',
    testsPassing: 28,
    testsFailing: 0,
    testsTotal: 28,
    coveragePercent: 100,
    timestamp: '2026-03-08T12:00:00Z',
};

<TddCycleStatusIndicator status={status} />
```

### Compact Mode

```tsx
<TddCycleStatusIndicator status={status} compact />
```

### Custom Styling

```tsx
<TddCycleStatusIndicator
    status={status}
    className="shadow-lg"
/>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `status` | `TddCycleStatus` | Yes | - | Current TDD cycle status data |
| `compact` | `boolean` | No | `false` | Enable compact display mode (hides description, metrics, progress bar) |
| `className` | `string` | No | - | Additional CSS classes |

## TddCycleStatus Type

```typescript
export type TddCyclePhase = 'idle' | 'writing_tests' | 'red' | 'green' | 'refactoring';

export interface TddCycleStatus {
    phase: TddCyclePhase;           // Current TDD phase
    label: string;                   // Human-readable label
    description: string;             // Phase description
    testsPassing: number;            // Number of passing tests
    testsFailing: number;            // Number of failing tests
    testsTotal: number;              // Total number of tests
    coveragePercent: number;         // Code coverage percentage (0-100)
    timestamp: string;               // ISO 8601 timestamp
}
```

## Examples

### Red Phase (Tests Failing)

```tsx
const redStatus: TddCycleStatus = {
    phase: 'red',
    label: 'Tests Failing',
    description: 'Tests are failing as expected',
    testsPassing: 0,
    testsFailing: 5,
    testsTotal: 5,
    coveragePercent: 45,
    timestamp: '2026-03-08T12:01:00Z',
};

<TddCycleStatusIndicator status={redStatus} />
```

### Green Phase (Tests Passing)

```tsx
const greenStatus: TddCycleStatus = {
    phase: 'green',
    label: 'Tests Passing',
    description: 'All tests passing',
    testsPassing: 28,
    testsFailing: 0,
    testsTotal: 28,
    coveragePercent: 100,
    timestamp: '2026-03-08T12:02:00Z',
};

<TddCycleStatusIndicator status={greenStatus} />
```

### Refactoring Phase

```tsx
const refactoringStatus: TddCycleStatus = {
    phase: 'refactoring',
    label: 'Refactoring',
    description: 'Improving code quality',
    testsPassing: 28,
    testsFailing: 0,
    testsTotal: 28,
    coveragePercent: 100,
    timestamp: '2026-03-08T12:03:00Z',
};

<TddCycleStatusIndicator status={refactoringStatus} />
```

## Visual Elements

### Full Mode (compact=false)

- **Header**: Phase icon (animated), label, and description
- **Test Badge**: Pass/fail ratio (e.g., "28/28 passing")
- **Metrics Row**: Coverage percentage with warning if below 80%
- **Test Breakdown**: Individual pass/fail counts with icons
- **Progress Bar**: Animated visual representation of test success rate

### Compact Mode (compact=true)

- **Header**: Phase icon (animated) and label only
- **Test Badge**: Pass/fail ratio
- Hidden: Description, metrics, test breakdown, progress bar

## Coverage Warnings

The component displays a warning when coverage is below the 80% target:

- Coverage text turns amber
- Small alert text shows "(target: 80%)"
- `data-warning="true"` attribute added for styling

## Animations

### Entrance Animation
- Fade in with slide up effect
- Duration: 300ms

### Icon Animation (Active Phases)
- Pulsing scale animation (1 → 1.1 → 1)
- Duration: 2s infinite loop
- Applied to: `writing_tests`, `red`, `green`, `refactoring` phases
- Not applied to: `idle` phase

### Progress Bar
- Smooth width transition
- Duration: 500ms
- Easing: easeOut

## Accessibility

### ARIA Attributes
- `role="status"` on container
- `aria-label="TDD cycle status: {label}"` on container
- `aria-hidden="true"` on decorative icons
- `role="alert"` on coverage warning

### Semantic HTML
- Proper heading levels (h3)
- Descriptive text for screen readers
- Color-independent information (text + icons)

### Keyboard Navigation
- Component is focusable
- Screen reader compatible

## Styling

### Color Scheme

**Idle (Gray)**
- Background: `bg-gray-50`
- Border: `border-gray-200`
- Text: `text-gray-600`
- Icon: `text-gray-400`

**Writing Tests (Yellow)**
- Background: `bg-yellow-50`
- Border: `border-yellow-200`
- Text: `text-yellow-700`
- Icon: `text-yellow-500`

**Red Phase (Red)**
- Background: `bg-red-50`
- Border: `border-red-200`
- Text: `text-red-700`
- Icon: `text-red-500`

**Green Phase (Green)**
- Background: `bg-emerald-50`
- Border: `border-emerald-200`
- Text: `text-emerald-700`
- Icon: `text-emerald-500`

**Refactoring (Blue)**
- Background: `bg-blue-50`
- Border: `border-blue-200`
- Text: `text-blue-700`
- Icon: `text-blue-500`

## Integration with Monitoring System

The component integrates with the existing agent monitoring system and can be used to display TDD cycle status for individual agents or the overall system.

### Example Integration

```tsx
import { useTddCycleStatus } from '@/hooks/useMonitoring';
import TddCycleStatusIndicator from '@/components/monitoring/TddCycleStatusIndicator';

export function AgentTddMonitor({ agentId }: { agentId: string }) {
    const { data: status, isLoading } = useTddCycleStatus(agentId);

    if (isLoading) return <div>Loading...</div>;
    if (!status) return null;

    return <TddCycleStatusIndicator status={status} />;
}
```

## Testing

The component has **100% test coverage** with 28 comprehensive tests covering:

- ✅ Rendering in all TDD phases
- ✅ Color coding for each phase
- ✅ Test metrics display
- ✅ Coverage percentage and warnings
- ✅ Accessibility (ARIA labels, keyboard navigation)
- ✅ Compact mode
- ✅ Animations
- ✅ Icons for each phase
- ✅ Responsive design
- ✅ Edge cases (zero tests, 100% coverage, partial passing)
- ✅ Custom className prop

### Running Tests

```bash
# Run tests
npm test -- __tests__/components/monitoring/TddCycleStatusIndicator.test.tsx

# Run with coverage
npm run test:coverage -- __tests__/components/monitoring/TddCycleStatusIndicator.test.tsx
```

## Dependencies

- `@/lib/utils` - `cn()` utility for className merging
- `@/types/monitoring` - Type definitions
- `@/components/ui/badge` - Badge component
- `framer-motion` - Animation library
- `lucide-react` - Icon library (FileEdit, XCircle, CheckCircle2, Wrench, Circle)

## File Locations

- Component: `/components/monitoring/TddCycleStatusIndicator.tsx`
- Types: `/types/monitoring.ts`
- Tests: `/__tests__/components/monitoring/TddCycleStatusIndicator.test.tsx`
- Documentation: `/docs/components/TddCycleStatusIndicator.md`

## Performance Considerations

- Component uses `motion.div` for animations (may impact performance with many instances)
- Recommend limiting to 5-10 visible instances per page
- Use `compact` mode for list views to reduce DOM complexity
- Icons are SVGs loaded from lucide-react (tree-shaken)

## Browser Support

- Modern browsers with CSS Grid and Flexbox support
- Framer Motion requires browsers with Web Animations API support
- Fallbacks provided for browsers without animation support

## Related Components

- `HealthIndicator` - System health status
- `MetricsChart` - Performance metrics visualization
- `TimelineView` - Event timeline display
- `AgentStatusBadge` - Agent status indicator

## License

Part of the AgentClaw monitoring dashboard. See project LICENSE for details.
