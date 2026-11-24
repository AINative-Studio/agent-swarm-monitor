import { describe, it, expect } from 'vitest';
import { calcClosureScore, type LoopHealth } from '@/hooks/useRecursiveIntelligence';

function makeLoop(status: LoopHealth['status']): LoopHealth {
  return { name: 'Loop', question: 'Q?', status, value: 'v', raw: null };
}

describe('calcClosureScore (issue #148)', () => {
  it('scores all 5 healthy loops at 100 (top legend band)', () => {
    const loops = Array.from({ length: 5 }, () => makeLoop('healthy'));
    expect(calcClosureScore(loops)).toBe(100);
  });

  it('gives a degraded loop partial credit, distinct from a fully down loop', () => {
    const allHealthyScore = calcClosureScore([
      makeLoop('healthy'),
      makeLoop('healthy'),
      makeLoop('healthy'),
      makeLoop('healthy'),
      makeLoop('healthy'),
    ]);
    const oneDegradedScore = calcClosureScore([
      makeLoop('healthy'),
      makeLoop('healthy'),
      makeLoop('healthy'),
      makeLoop('healthy'),
      makeLoop('degraded'),
    ]);
    const oneDownScore = calcClosureScore([
      makeLoop('healthy'),
      makeLoop('healthy'),
      makeLoop('healthy'),
      makeLoop('healthy'),
      makeLoop('down'),
    ]);

    // A degraded loop must score strictly between a healthy and a down loop,
    // not identically to down (the pre-fix bug: both scored 0 extra points).
    expect(oneDegradedScore).toBeLessThan(allHealthyScore);
    expect(oneDegradedScore).toBeGreaterThan(oneDownScore);
  });

  it('lands "most loops active, one or two degraded" in the legend\'s 60-80 band', () => {
    // 3 healthy + 2 degraded: legend says this should read as "most loops
    // active, one or two degraded" -> 60-80, not the old flat healthyCount*20.
    const loops = [
      makeLoop('healthy'),
      makeLoop('healthy'),
      makeLoop('healthy'),
      makeLoop('degraded'),
      makeLoop('degraded'),
    ];
    const score = calcClosureScore(loops);
    expect(score).toBeGreaterThanOrEqual(60);
    expect(score).toBeLessThanOrEqual(80);
  });

  it('matches the issue #148 repro: 1 healthy + 1 degraded + 3 down no longer equals the old flat 20', () => {
    const loops: LoopHealth[] = [
      makeLoop('degraded'), // Sensor Loop
      makeLoop('down'), // Memory Loop
      makeLoop('healthy'), // Agent Loop
      makeLoop('down'), // Tool Loop
      makeLoop('down'), // Learning Loop
    ];
    const score = calcClosureScore(loops);
    // Old formula: healthyCount(1) * 20 = 20, identical to the all-down case.
    // New formula: 1*20 + 1*10 = 30 -- strictly higher, reflecting the
    // degraded loop's partial credit, while still correctly landing in the
    // legend's low "critical loops offline" band since only 1-2 of 5 loops
    // are up in any sense.
    expect(score).toBe(30);
    expect(score).toBeGreaterThan(20);
    expect(score).toBeLessThanOrEqual(40);
  });

  it('scores all down loops at 0', () => {
    const loops = Array.from({ length: 5 }, () => makeLoop('down'));
    expect(calcClosureScore(loops)).toBe(0);
  });
});
