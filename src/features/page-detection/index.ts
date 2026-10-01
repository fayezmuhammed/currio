/**
 * V2 — automatic price detection (not active in V1).
 *
 * The plan, so V1 code stays compatible with it:
 *   • A detector walks text nodes lazily (IntersectionObserver + idle
 *     callbacks), never the whole page up front.
 *   • Each candidate string goes through the same `parseCurrency()` used for
 *     selections, so parsing rules and tests are shared.
 *   • Conversions batch through one `currio/convert` round-trip per rate
 *     snapshot; the service worker already cross-converts locally.
 *   • Annotations render in shadow roots next to the price (like the card),
 *     and `stop()` removes every one of them, so the page is never
 *     permanently modified.
 *   • Gated by `settings.pageDetection`, off by default and forced off by
 *     `sanitizeSettings()` until the feature ships.
 */
import type { ParsedAmount } from '@/types/currency';

export interface PriceMatch {
  /** Text node containing the price. */
  node: Text;
  parsed: ParsedAmount;
}

export interface PageDetector {
  start(): void;
  stop(): void;
}

/** Placeholder until V2: does nothing, so it's safe to wire up early. */
export function createPageDetector(): PageDetector {
  return { start: () => undefined, stop: () => undefined };
}
