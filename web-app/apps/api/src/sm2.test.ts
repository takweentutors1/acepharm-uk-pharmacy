import { describe, it, expect } from 'vitest';
import { calculateSM2NextReview } from './lib/sm2-engine';

describe('SuperMemo-2 (SM-2) Spaced Repetition Engine', () => {
  it('handles "again" grade correctly (resets interval, increments lapses, reduces ease)', () => {
    const result = calculateSM2NextReview(6, 250, 2, 0, 'again');
    expect(result.nextIntervalDays).toBe(1);
    expect(result.nextEase).toBe(230); // 250 - 20
    expect(result.nextLapses).toBe(1);
  });

  it('handles "hard" grade correctly (moderate increase, slight ease penalty)', () => {
    const result = calculateSM2NextReview(10, 250, 3, 0, 'hard');
    expect(result.nextIntervalDays).toBe(12); // 10 * 1.2
    expect(result.nextEase).toBe(235); // 250 - 15
    expect(result.nextReviews).toBe(4);
  });

  it('handles "good" grade correctly (standard SM-2 multiplier)', () => {
    const result = calculateSM2NextReview(6, 250, 2, 0, 'good');
    expect(result.nextIntervalDays).toBe(15); // 6 * 2.5
    expect(result.nextEase).toBe(250);
    expect(result.nextReviews).toBe(3);
  });

  it('handles "easy" grade correctly (bonus multiplier, increases ease)', () => {
    const result = calculateSM2NextReview(6, 250, 2, 0, 'easy');
    expect(result.nextIntervalDays).toBe(20); // 6 * 2.5 * 1.3 = 19.5 -> 20
    expect(result.nextEase).toBe(265); // 250 + 15
    expect(result.nextReviews).toBe(3);
  });

  it('enforces minimum ease floor of 130', () => {
    let ease = 140;
    const result = calculateSM2NextReview(1, ease, 1, 3, 'again');
    expect(result.nextEase).toBe(130);
  });
});
