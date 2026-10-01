/**
 * Currency parser: turns text such as "AED 850", "€1.299,99", "₹5,00,000" or
 * "$1.2M" into `{ amount, currency }`.
 *
 * Pure and dependency-free (no DOM, no Chrome APIs) so it can be unit tested
 * and reused for V2 page-wide price detection.
 */
import {
  AMBIGUOUS_NAMES,
  AMBIGUOUS_SYMBOLS,
  CURRENCIES,
  CURRENCY_CODES,
} from '@/constants/currencies';
import { MAX_SELECTION_LENGTH } from '@/constants/config';
import type {
  AmbiguousToken,
  CurrencyCode,
  ParseHints,
  ParsedAmount,
} from '@/types/currency';

// ── Token table ─────────────────────────────────────────────────────────────

/** Higher wins when a number has a currency token on both sides ("$100 CAD"). */
const Specificity = { Ambiguous: 1, Unique: 2, IsoCode: 3 } as const;
type Specificity = (typeof Specificity)[keyof typeof Specificity];

interface CurrencyToken {
  text: string;
  /** Lower-cased for case-insensitive tokens. */
  match: string;
  caseSensitive: boolean;
  specificity: Specificity;
  currency?: CurrencyCode;
  ambiguous?: AmbiguousToken;
}

function buildTokenTable(): CurrencyToken[] {
  const tokens: CurrencyToken[] = [];
  const add = (
    text: string,
    caseSensitive: boolean,
    specificity: Specificity,
    target: { currency: CurrencyCode } | { ambiguous: AmbiguousToken },
  ): void => {
    tokens.push({ text, match: caseSensitive ? text : text.toLowerCase(), caseSensitive, specificity, ...target });
  };

  for (const code of CURRENCY_CODES) {
    const def = CURRENCIES[code];
    add(code, false, Specificity.IsoCode, { currency: code });
    for (const symbol of def.symbols) add(symbol, true, Specificity.Unique, { currency: code });
    for (const name of def.names) add(name, false, Specificity.Unique, { currency: code });
  }
  for (const [symbol, ambiguous] of Object.entries(AMBIGUOUS_SYMBOLS)) {
    add(symbol, true, Specificity.Ambiguous, { ambiguous });
  }
  for (const [name, ambiguous] of Object.entries(AMBIGUOUS_NAMES)) {
    add(name, false, Specificity.Ambiguous, { ambiguous });
  }
  // Longest first, so "US$" beats "$" and "Rs." beats "Rs" beats "R".
  return tokens.sort((a, b) => b.text.length - a.text.length);
}

const TOKENS = buildTokenTable();

// ── Magnitude suffixes ("$5k", "AED 1.2M", "₹2 crore") ──────────────────────

interface Multiplier {
  text: string;
  value: number;
  /** Single letters must touch the number ("5k"); words may be spaced ("5 lakh"). */
  attachedOnly: boolean;
}

const MULTIPLIERS: readonly Multiplier[] = [
  { text: 'thousand', value: 1e3, attachedOnly: false },
  { text: 'million', value: 1e6, attachedOnly: false },
  { text: 'billion', value: 1e9, attachedOnly: false },
  { text: 'crores', value: 1e7, attachedOnly: false },
  { text: 'crore', value: 1e7, attachedOnly: false },
  { text: 'lakhs', value: 1e5, attachedOnly: false },
  { text: 'lakh', value: 1e5, attachedOnly: false },
  { text: 'lacs', value: 1e5, attachedOnly: false },
  { text: 'lac', value: 1e5, attachedOnly: false },
  { text: 'mn', value: 1e6, attachedOnly: false },
  { text: 'bn', value: 1e9, attachedOnly: false },
  { text: 'cr', value: 1e7, attachedOnly: false },
  { text: 'k', value: 1e3, attachedOnly: true },
  { text: 'm', value: 1e6, attachedOnly: true },
  { text: 'b', value: 1e9, attachedOnly: true },
];

const MAX_AMOUNT = 1e15;

// ── Normalisation ───────────────────────────────────────────────────────────

const INVISIBLE_CHARS = /[\u200B-\u200F\u2060\uFEFF\u061C\u202A-\u202E\u2066-\u2069\u00AD]/g;
const SPACE_CHARS = /[\s\u00A0\u2000-\u200A\u202F\u205F\u3000]+/g;

/** Map look-alike characters onto the ASCII/standard forms the parser understands. */
export function normalizeText(input: string): string {
  let out = '';
  for (const ch of input.replace(INVISIBLE_CHARS, '')) {
    const cp = ch.codePointAt(0) ?? 0;
    if (cp >= 0x0660 && cp <= 0x0669) out += String(cp - 0x0660); // Arabic-Indic digits
    else if (cp >= 0x06f0 && cp <= 0x06f9) out += String(cp - 0x06f0); // Extended Arabic-Indic
    else if (cp >= 0xff10 && cp <= 0xff19) out += String(cp - 0xff10); // Full-width digits
    else if (ch === '\u066B') out += '.'; // Arabic decimal separator
    else if (ch === '\u066C') out += ','; // Arabic thousands separator
    else if (ch === '\uFFE5') out += '¥';
    else if (ch === '\uFF04') out += '$';
    else if (ch === '\uFFE1') out += '£';
    else if (ch === '\u2212' || ch === '\uFE63' || ch === '\uFF0D') out += '-';
    else out += ch;
  }
  return out.replace(SPACE_CHARS, ' ').trim();
}

// ── Token matching ──────────────────────────────────────────────────────────

const LETTER = /\p{L}/u;
const isLetter = (ch: string | undefined): boolean => ch !== undefined && LETTER.test(ch);

interface TokenMatch {
  token: CurrencyToken;
  length: number;
}

function tokenMatches(token: CurrencyToken, candidate: string): boolean {
  return token.caseSensitive ? candidate === token.match : candidate.toLowerCase() === token.match;
}

/** Find the longest currency token that ends exactly at the end of `text`. */
function matchTokenBefore(text: string): TokenMatch | null {
  for (const token of TOKENS) {
    const start = text.length - token.text.length;
    if (start < 0 || !tokenMatches(token, text.slice(start))) continue;
    const before = text[start - 1];
    // Alphabetic tokens need a word boundary: "EUR" must not match inside "MEUR".
    if (isLetter(token.text[0]) && isLetter(before)) continue;
    // A symbol glued to letters belongs to another currency: "R$" is the real, "MX$" the peso.
    if (!isLetter(token.text[0]) && before !== undefined && /[A-Za-z]/.test(before)) return null;
    return { token, length: token.text.length };
  }
  return null;
}

/** Find the longest currency token that starts exactly at the start of `text`. */
function matchTokenAfter(text: string): TokenMatch | null {
  for (const token of TOKENS) {
    if (!tokenMatches(token, text.slice(0, token.text.length))) continue;
    const after = text[token.text.length];
    if (isLetter(token.text.at(-1)) && isLetter(after)) continue;
    return { token, length: token.text.length };
  }
  return null;
}

function matchMultiplier(text: string, attached: boolean): Multiplier | null {
  const lower = text.toLowerCase();
  for (const m of MULTIPLIERS) {
    if (m.attachedOnly && !attached) continue;
    if (!lower.startsWith(m.text) || isLetter(text[m.text.length])) continue;
    return m;
  }
  return null;
}

// ── Ambiguity resolution ────────────────────────────────────────────────────

/** Languages that point strongly at one region when the page gives no region. */
const LANGUAGE_REGIONS: Readonly<Record<string, string>> = { ja: 'JP', zh: 'CN' };

function hintRegions(hints: ParseHints | undefined): string[] {
  const regions: string[] = [];
  const parts = hints?.locale?.split(/[-_]/) ?? [];
  const regionPart = parts.slice(1).find((p) => /^[A-Za-z]{2}$/.test(p));
  if (regionPart) regions.push(regionPart.toUpperCase());
  const tld = hints?.hostname?.split('.').at(-1);
  if (tld && /^[a-z]{2}$/i.test(tld)) regions.push(tld.toUpperCase());
  const language = parts[0]?.toLowerCase();
  if (language && LANGUAGE_REGIONS[language]) regions.push(LANGUAGE_REGIONS[language]);
  return regions;
}

function resolveAmbiguous(token: AmbiguousToken, hints: ParseHints | undefined): CurrencyCode {
  for (const region of hintRegions(hints)) {
    const match = token.candidates.find((code) => CURRENCIES[code].regions.includes(region));
    if (match) return match;
  }
  return token.fallback;
}

// ── Number parsing ──────────────────────────────────────────────────────────

/**
 * A number with optional grouping. Space/apostrophe grouping ("1 299,99",
 * "1'299.99") is only accepted in strict groups of three.
 */
const NUMBER_PATTERN = /(?<![\d.,])(?:\d{1,3}(?:[ '’]\d{3})+(?:[.,]\d+)?|\d+(?:[.,]\d+)*)/g;

const COMMA_DECIMAL_LANGUAGES = new Set([
  'de', 'fr', 'es', 'it', 'nl', 'pt', 'tr', 'id', 'ru', 'pl', 'sv', 'da', 'nb', 'no', 'fi', 'cs', 'el', 'ro', 'hu', 'vi', 'uk',
]);

function usesCommaDecimal(locale: string | undefined): boolean | null {
  if (!locale) return null;
  const language = locale.split(/[-_]/)[0]?.toLowerCase() ?? '';
  return COMMA_DECIMAL_LANGUAGES.has(language);
}

function isValidGrouping(groups: readonly string[]): boolean {
  const [first, ...rest] = groups;
  if (!first || rest.length === 0) return false;
  const western = /^\d{1,3}$/.test(first) && rest.every((g) => g.length === 3);
  // Indian grouping: 5,00,000 / 1,23,45,678
  const last = rest.at(-1) ?? '';
  const indian =
    /^\d{1,2}$/.test(first) && last.length === 3 && rest.slice(0, -1).every((g) => g.length === 2);
  return western || indian;
}

/**
 * Parse a raw numeric string. The separator rules:
 *  • both "." and "," present → the last one is the decimal separator
 *  • one separator repeated   → grouping ("1,000,000", "5,00,000")
 *  • one separator, not 3 digits after → decimal ("12,50", "1299.99")
 *  • one separator, exactly 3 digits after → decided by the currency's minor
 *    units (KWD 1.250 = 1.25), the page language and, failing that, convention.
 */
export function parseNumber(
  raw: string,
  currency: CurrencyCode,
  locale?: string,
): number | null {
  const compact = raw.replace(/[ '’]/g, '');
  const dots = compact.split('.').length - 1;
  const commas = compact.split(',').length - 1;
  let normalized: string;

  if (dots > 0 && commas > 0) {
    const decimalSep = compact.lastIndexOf('.') > compact.lastIndexOf(',') ? '.' : ',';
    const groupSep = decimalSep === '.' ? ',' : '.';
    const [intPart = '', fracPart, ...extra] = compact.split(decimalSep);
    if (extra.length > 0 || !fracPart || fracPart.includes(groupSep)) return null;
    if (!isValidGrouping(intPart.split(groupSep))) return null;
    normalized = `${intPart.split(groupSep).join('')}.${fracPart}`;
  } else if (dots + commas > 1) {
    const sep = dots > 0 ? '.' : ',';
    const groups = compact.split(sep);
    if (!isValidGrouping(groups)) return null;
    normalized = groups.join('');
  } else if (dots + commas === 1) {
    const sep = dots > 0 ? '.' : ',';
    const [intPart = '', fracPart = ''] = compact.split(sep);
    if (fracPart.length === 0) return null;
    const decimal =
      fracPart.length !== 3 ||
      intPart.length === 0 ||
      /^0+$/.test(intPart) ||
      intPart.length > 3 ||
      isDecimalWithThreeDigits(sep, currency, locale);
    normalized = decimal ? `${intPart || '0'}.${fracPart}` : `${intPart}${fracPart}`;
  } else {
    normalized = compact;
  }

  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

/** "1.250" or "1,250": is the separator a decimal point? */
function isDecimalWithThreeDigits(sep: '.' | ',', currency: CurrencyCode, locale?: string): boolean {
  const { minorUnits } = CURRENCIES[currency];
  if (minorUnits === 0) return false; // ¥1,250 / ¥1.250 are both 1250
  if (minorUnits >= 3 && sep === '.') return true; // KWD 1.250 = 1.25
  const commaDecimal = usesCommaDecimal(locale);
  if (commaDecimal !== null) return commaDecimal ? sep === ',' : sep === '.';
  // No locale: "," groups thousands everywhere; "." groups thousands for EUR
  // ("1.250 €") and is a decimal elsewhere ("$3.499" per gallon).
  return sep === '.' && currency !== 'EUR';
}

// ── Public API ──────────────────────────────────────────────────────────────

interface Candidate {
  currency: CurrencyCode;
  ambiguous: boolean;
  alternatives: readonly CurrencyCode[];
  specificity: Specificity;
}

function toCandidate(match: TokenMatch | null, hints: ParseHints | undefined): Candidate | null {
  if (!match) return null;
  const { token } = match;
  if (token.currency) {
    return { currency: token.currency, ambiguous: false, alternatives: [], specificity: token.specificity };
  }
  if (token.ambiguous) {
    const currency = resolveAmbiguous(token.ambiguous, hints);
    return {
      currency,
      ambiguous: true,
      alternatives: token.ambiguous.candidates.filter((c) => c !== currency),
      specificity: token.specificity,
    };
  }
  return null;
}

/**
 * Parse the first currency amount in `text`.
 *
 * Returns `null` when the text is empty, too long, has no number next to a
 * supported currency, or the number is malformed. Never throws.
 */
export function parseCurrency(text: string, hints?: ParseHints): ParsedAmount | null {
  if (typeof text !== 'string') return null;
  const originalText = text.trim();
  if (originalText.length === 0 || originalText.length > MAX_SELECTION_LENGTH) return null;

  const normalized = normalizeText(originalText);

  for (const numberMatch of normalized.matchAll(NUMBER_PATTERN)) {
    const raw = numberMatch[0];
    const start = numberMatch.index;
    const end = start + raw.length;

    // Left side: [sign] [currency] [sign] NUMBER
    let left = normalized.slice(0, start).trimEnd();
    let negative = false;
    let beforeMatch = matchTokenBefore(left);
    if (!beforeMatch && left.endsWith('-')) {
      // "$-50" or "Refund -50 USD", but not the dash in "10-20".
      const withoutSign = left.slice(0, -1).trimEnd();
      const signedMatch = matchTokenBefore(withoutSign);
      if (signedMatch || isSignPosition(left, left.length - 1)) {
        negative = true;
        left = withoutSign;
        beforeMatch = signedMatch;
      }
    }
    const before = toCandidate(beforeMatch, hints);
    if (beforeMatch && !negative) {
      const rest = left.slice(0, left.length - beforeMatch.length).trimEnd();
      if (rest.endsWith('-') && isSignPosition(rest, rest.length - 1)) negative = true;
    }

    // Right side: NUMBER [multiplier] [currency]
    let right = normalized.slice(end);
    let multiplier = 1;
    const attached = !right.startsWith(' ');
    const mult = matchMultiplier(right.trimStart(), attached);
    if (mult) {
      multiplier = mult.value;
      right = right.trimStart().slice(mult.text.length);
    }
    const after = toCandidate(matchTokenAfter(right.trimStart()), hints);

    const chosen = pickCandidate(before, after);
    if (!chosen) continue;

    const value = parseNumber(raw, chosen.currency, hints?.locale);
    if (value === null) return null;

    const amount = Number((value * multiplier * (negative ? -1 : 1)).toPrecision(15));
    if (!Number.isFinite(amount) || Math.abs(amount) > MAX_AMOUNT) return null;

    return {
      amount,
      currency: chosen.currency,
      originalText,
      ambiguous: chosen.ambiguous,
      alternatives: chosen.alternatives,
    };
  }
  return null;
}

/** A "-" is a minus sign only at the start or after whitespace/an opening bracket — not in "$10-$20". */
function isSignPosition(text: string, index: number): boolean {
  const prev = text[index - 1];
  return prev === undefined || /[\s([]/.test(prev);
}

function pickCandidate(before: Candidate | null, after: Candidate | null): Candidate | null {
  if (before && after) return after.specificity > before.specificity ? after : before;
  return before ?? after;
}
