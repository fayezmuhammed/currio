import type { ParseHints } from '@/types/currency';

/**
 * Hints for resolving ambiguous symbols ("$", "¥") and decimal separators.
 * Read locally from the page and passed to the parser; never sent anywhere.
 */
export function getPageHints(): ParseHints {
  const lang = document.documentElement.lang || document.querySelector('meta[http-equiv="content-language" i]')?.getAttribute('content') || undefined;
  return { locale: lang, hostname: location.hostname };
}

export type CardTheme = 'light' | 'dark';

/** Match the card to the page around the selection, so it reads well on dark and light sites. */
export function detectTheme(element: Element | null): CardTheme {
  let node: Element | null = element;
  while (node) {
    const rgba = parseColor(getComputedStyle(node).backgroundColor);
    if (rgba && rgba[3] > 0.5) return luminance(rgba) < 0.4 ? 'dark' : 'light';
    node = node.parentElement;
  }
  // document.body is null in SVG/XML documents.
  const root = parseColor(getComputedStyle(document.querySelector('body') ?? document.documentElement).backgroundColor);
  if (root && root[3] > 0.5) return luminance(root) < 0.4 ? 'dark' : 'light';
  // Transparent all the way up: the canvas follows the page's color-scheme.
  const scheme = getComputedStyle(document.documentElement).colorScheme;
  if (scheme.includes('dark') && !scheme.includes('light')) return 'dark';
  return 'light';
}

function parseColor(value: string): [number, number, number, number] | null {
  const match = /rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)/.exec(value);
  if (!match) return null;
  const alphaRaw = match[4];
  const alpha = alphaRaw === undefined ? 1 : alphaRaw.endsWith('%') ? parseFloat(alphaRaw) / 100 : parseFloat(alphaRaw);
  return [Number(match[1]), Number(match[2]), Number(match[3]), alpha];
}

function luminance([r, g, b]: readonly number[]): number {
  const channel = (c: number | undefined): number => {
    const s = (c ?? 0) / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}
