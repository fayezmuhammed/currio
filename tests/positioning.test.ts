import { describe, expect, it } from 'vitest';
import { computeCardPosition, isOutOfView } from '@/utils/positioning';

const viewport = { width: 1280, height: 800 };
const card = { width: 260, height: 110 };

describe('computeCardPosition', () => {
  it('places the card centred below the selection', () => {
    const pos = computeCardPosition({ top: 100, left: 500, width: 80, height: 20 }, card, viewport);
    expect(pos.placement).toBe('below');
    expect(pos.top).toBe(130);
    expect(pos.left).toBe(410);
  });

  it('flips above when there is no room below', () => {
    const pos = computeCardPosition({ top: 740, left: 500, width: 80, height: 20 }, card, viewport);
    expect(pos.placement).toBe('above');
    expect(pos.top).toBe(740 - 10 - 110);
  });

  it('clamps horizontally to the viewport', () => {
    expect(computeCardPosition({ top: 100, left: 2, width: 30, height: 20 }, card, viewport).left).toBe(8);
    expect(computeCardPosition({ top: 100, left: 1260, width: 20, height: 20 }, card, viewport).left).toBe(1280 - 260 - 8);
  });

  it('keeps the previous placement while it fits, so the card does not jump on scroll', () => {
    const anchor = { top: 300, left: 500, width: 80, height: 20 };
    expect(computeCardPosition(anchor, card, viewport, { preferred: 'above' }).placement).toBe('above');
  });

  it('stays inside a tiny viewport', () => {
    const pos = computeCardPosition({ top: 50, left: 50, width: 10, height: 10 }, card, { width: 200, height: 120 });
    expect(pos.left).toBeGreaterThanOrEqual(8);
    expect(pos.top).toBeGreaterThanOrEqual(8);
  });
});

describe('isOutOfView', () => {
  it('detects anchors scrolled out of view', () => {
    expect(isOutOfView({ top: -50, left: 0, width: 10, height: 20 }, viewport)).toBe(true);
    expect(isOutOfView({ top: 900, left: 0, width: 10, height: 20 }, viewport)).toBe(true);
    expect(isOutOfView({ top: 400, left: 100, width: 10, height: 20 }, viewport)).toBe(false);
  });
});
