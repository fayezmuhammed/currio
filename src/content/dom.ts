/**
 * Tiny DOM builder for the content script. All text goes through text nodes,
 * never innerHTML, so page-derived strings can't inject markup.
 */
type Child = Node | string | number | null | undefined | false;

interface Props {
  class?: string;
  attrs?: Record<string, string>;
  on?: { [K in keyof HTMLElementEventMap]?: (event: HTMLElementEventMap[K]) => void };
}

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props | null,
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (props?.class) el.className = props.class;
  for (const [name, value] of Object.entries(props?.attrs ?? {})) el.setAttribute(name, value);
  for (const [type, listener] of Object.entries(props?.on ?? {})) {
    el.addEventListener(type, listener as EventListener);
  }
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    el.append(typeof child === 'number' ? String(child) : child);
  }
  return el;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Build an icon from static path data (never page-derived). */
export function svgIcon(paths: readonly string[], options: { size?: number; className?: string; viewBox?: string } = {}): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  const size = String(options.size ?? 14);
  svg.setAttribute('viewBox', options.viewBox ?? '0 0 24 24');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  if (options.className) svg.setAttribute('class', options.className);
  for (const d of paths) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  return svg;
}

export const ICONS = {
  copy: ['M8 8h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2z', 'M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2'],
  check: ['M5 12.5l4.5 4.5L19 7.5'],
  chevronDown: ['M7 10l5 5 5-5'],
  alert: ['M12 8v5', 'M12 16.5v.01', 'M10.3 3.9 2.6 17.3A2 2 0 0 0 4.3 20.3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z'],
  info: ['M12 11v5', 'M12 7.5v.01', 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z'],
  close: ['M7 7l10 10', 'M17 7 7 17'],
} as const;

/** Currio's mark: a "C" drawn as a conversion arc. */
export function brandMark(size = 16): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 32 32');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'brand');
  const rect = document.createElementNS(SVG_NS, 'rect');
  rect.setAttribute('width', '32');
  rect.setAttribute('height', '32');
  rect.setAttribute('rx', '9');
  rect.setAttribute('class', 'brand-bg');
  const arc = document.createElementNS(SVG_NS, 'path');
  arc.setAttribute('d', 'M21.5 11.2A7.5 7.5 0 1 0 21.5 20.8');
  arc.setAttribute('fill', 'none');
  arc.setAttribute('stroke', '#fff');
  arc.setAttribute('stroke-width', '3.4');
  arc.setAttribute('stroke-linecap', 'round');
  const dot = document.createElementNS(SVG_NS, 'circle');
  dot.setAttribute('cx', '23.2');
  dot.setAttribute('cy', '16');
  dot.setAttribute('r', '1.9');
  dot.setAttribute('fill', '#fff');
  svg.append(rect, arc, dot);
  return svg;
}
