export interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

export type Placement = 'below' | 'above';

export interface CardPosition {
  top: number;
  left: number;
  placement: Placement;
}

export interface PositionOptions {
  /** Distance between the selection and the card. */
  gap?: number;
  /** Minimum distance from the viewport edge. */
  margin?: number;
  /** Keep the previous placement while it still fits, so the card doesn't flip while scrolling. */
  preferred?: Placement | undefined;
}

/**
 * Place a card next to an anchor rectangle (viewport coordinates), preferring
 * below the selection, flipping above when there is not enough room, and
 * clamping so the card never leaves the viewport.
 */
export function computeCardPosition(
  anchor: Rect,
  card: Size,
  viewport: Size,
  { gap = 10, margin = 8, preferred = 'below' }: PositionOptions = {},
): CardPosition {
  const spaceBelow = viewport.height - (anchor.top + anchor.height) - gap - margin;
  const spaceAbove = anchor.top - gap - margin;
  const fitsBelow = spaceBelow >= card.height;
  const fitsAbove = spaceAbove >= card.height;

  let placement: Placement;
  if (preferred === 'above' ? fitsAbove : !fitsBelow && fitsAbove) placement = 'above';
  else if (fitsBelow) placement = 'below';
  else placement = spaceAbove > spaceBelow ? 'above' : 'below';

  const rawTop = placement === 'below' ? anchor.top + anchor.height + gap : anchor.top - gap - card.height;
  const top = clamp(rawTop, margin, Math.max(margin, viewport.height - card.height - margin));

  const anchorCenter = anchor.left + anchor.width / 2;
  const left = clamp(anchorCenter - card.width / 2, margin, Math.max(margin, viewport.width - card.width - margin));

  return { top: Math.round(top), left: Math.round(left), placement };
}

/** True when the anchor is entirely outside the viewport (scrolled away). */
export function isOutOfView(anchor: Rect, viewport: Size): boolean {
  return (
    anchor.top + anchor.height < 0 ||
    anchor.top > viewport.height ||
    anchor.left + anchor.width < 0 ||
    anchor.left > viewport.width
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
