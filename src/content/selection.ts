import { MAX_SELECTION_LENGTH } from '@/constants/config';
import type { Rect } from '@/utils/positioning';

export interface SelectionSnapshot {
  text: string;
  /** Live rectangle of the selection in viewport coordinates (updates while scrolling). */
  getRect: () => Rect | null;
  /** Selection inside an input, textarea or contenteditable — where people edit, not read. */
  editable: boolean;
  /** Closest element to the selection, used for theme detection. */
  element: Element | null;
}

const TEXT_INPUT_TYPES = new Set(['text', 'search', 'url', 'tel', '']);

/** Read the user's current selection, or null when nothing (reasonably short) is selected. */
export function readSelection(): SelectionSnapshot | null {
  const fromInput = readInputSelection();
  if (fromInput) return fromInput;

  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0).cloneRange();
  const text = selection.toString();
  if (!isUsableText(text)) return null;

  // The start node, not the common ancestor: a triple-click selection often
  // ends inside the next block, which would make the ancestor <body>.
  const start = range.startContainer;
  const element = start instanceof Element ? start : start.parentElement;
  return {
    text,
    getRect: () => rectFromRange(range),
    editable: Boolean(element?.closest('[contenteditable]:not([contenteditable="false"])')),
    element,
  };
}

function readInputSelection(): SelectionSnapshot | null {
  const active = document.activeElement;
  const isInput = active instanceof HTMLInputElement && TEXT_INPUT_TYPES.has(active.type);
  if (!isInput && !(active instanceof HTMLTextAreaElement)) return null;
  const { selectionStart, selectionEnd, value } = active;
  if (selectionStart === null || selectionEnd === null || selectionEnd <= selectionStart) return null;
  const text = value.slice(selectionStart, selectionEnd);
  if (!isUsableText(text)) return null;
  return { text, getRect: () => toRect(active.getBoundingClientRect()), editable: true, element: active };
}

function isUsableText(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.length > 0 && trimmed.length <= MAX_SELECTION_LENGTH;
}

/**
 * Anchor on the last line of a multi-line selection: that's where the pointer
 * was released. Only selected text counts: a triple-click range ends at
 * offset 0 of the next block, and that block's boxes would pull the card away.
 */
function rectFromRange(range: Range): Rect | null {
  const last = textRects(range).at(-1);
  const rect = last ?? range.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0 && rect.top === 0 && rect.left === 0) return null;
  return toRect(rect);
}

const MAX_TEXT_NODES = 200;

function textRects(range: Range): DOMRect[] {
  const root = range.commonAncestorContainer;
  if (root.nodeType === Node.TEXT_NODE) return visible(range.getClientRects());

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const start = range.startContainer;
  // Start the walk at the selection, not at the top of the common ancestor.
  walker.currentNode = start.nodeType === Node.TEXT_NODE ? start : (start.childNodes[range.startOffset] ?? start);
  let node: Node | null = walker.currentNode.nodeType === Node.TEXT_NODE ? walker.currentNode : walker.nextNode();

  const rects: DOMRect[] = [];
  for (let i = 0; node && i < MAX_TEXT_NODES; i++, node = walker.nextNode()) {
    if (!range.intersectsNode(node)) {
      if (rects.length > 0) break;
      continue;
    }
    const text = node as Text;
    const from = node === range.startContainer ? range.startOffset : 0;
    const to = node === range.endContainer ? range.endOffset : text.length;
    if (!text.data.slice(from, to).trim()) continue;
    const part = document.createRange();
    part.setStart(text, from);
    part.setEnd(text, to);
    rects.push(...visible(part.getClientRects()));
  }
  return rects;
}

function visible(list: DOMRectList): DOMRect[] {
  return Array.from(list).filter((r) => r.width > 1 && r.height > 0);
}

function toRect(rect: DOMRect): Rect {
  return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
}

export function pointRect(x: number, y: number): Rect {
  return { top: y, left: x, width: 0, height: 0 };
}
