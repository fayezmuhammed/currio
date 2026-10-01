import type { CurrencyCode } from './currency';
import type { Conversion, ExchangeRate, RateErrorCode, RateStatus } from './exchange-rate';

/** How a conversion was started. Passive selections fail quietly; explicit triggers explain errors. */
export type ConversionTrigger = 'selection' | 'context-menu' | 'shortcut';

// ── Messages sent to the background service worker ─────────────────────────

export interface ConvertRequest {
  type: 'currio/convert';
  amount: number;
  from: CurrencyCode;
  /** Defaults to the user's preferred currency. */
  to?: CurrencyCode | undefined;
}

/** Look up a rate without recording a conversion (used by the popup). */
export interface RateRequest {
  type: 'currio/rate';
  from: CurrencyCode;
  to: CurrencyCode;
}

export interface RateStatusRequest {
  type: 'currio/rate-status';
}

export interface RefreshRatesRequest {
  type: 'currio/refresh-rates';
}

export type BackgroundRequest = ConvertRequest | RateRequest | RateStatusRequest | RefreshRatesRequest;

export type Result<T> = { ok: true; value: T } | { ok: false; error: RateErrorCode };

export interface BackgroundResponses {
  'currio/convert': Result<Conversion>;
  'currio/rate': Result<ExchangeRate>;
  'currio/rate-status': Result<RateStatus | null>;
  'currio/refresh-rates': Result<RateStatus>;
}

// ── Messages sent to content scripts ───────────────────────────────────────

export interface ConvertSelectionCommand {
  type: 'currio/convert-selection';
  trigger: Exclude<ConversionTrigger, 'selection'>;
  /** Selection text reported by the context menu, used when the live selection is gone. */
  text?: string | undefined;
}

export type ContentCommand = ConvertSelectionCommand;
