/**
 * Styles for the floating card. Lives inside a closed shadow root, so page
 * CSS can't reach in and these rules can't leak out. Applied via a
 * constructable stylesheet, which page CSP style-src rules don't block.
 */
export const CARD_CSS = /* css */ `
:host { all: initial; }

.card {
  --bg: #ffffff;
  --fg: #0d1117;
  --muted: #5b6573;
  --subtle: #8b94a1;
  --line: rgba(13, 17, 23, 0.08);
  --hover: rgba(13, 17, 23, 0.05);
  --accent: #0b8a63;
  --accent-soft: rgba(11, 138, 99, 0.1);
  --warn: #b7791f;
  --shadow: 0 1px 2px rgba(13, 17, 23, 0.06), 0 12px 32px -8px rgba(13, 17, 23, 0.22);
  --shimmer: rgba(13, 17, 23, 0.07);

  position: absolute;
  box-sizing: border-box;
  width: max-content;
  min-width: 216px;
  max-width: min(320px, calc(100vw - 16px));
  padding: 12px 12px 10px 14px;
  border-radius: 14px;
  border: 1px solid var(--line);
  background: var(--bg);
  color: var(--fg);
  box-shadow: var(--shadow);
  font: 400 13px/1.35 ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI Variable Text", "Segoe UI", Inter, Roboto, "Helvetica Neue", Arial, sans-serif;
  font-variant-numeric: tabular-nums;
  -webkit-font-smoothing: antialiased;
  letter-spacing: -0.005em;
  text-align: left;
  direction: ltr;
  cursor: default;
  user-select: none;
  opacity: 0;
  transform: translateY(var(--enter-y, 4px)) scale(0.985);
  transition: opacity 140ms ease-out, transform 160ms cubic-bezier(0.2, 0.8, 0.2, 1);
}
.card[data-placement="above"] { --enter-y: -4px; }
.card[data-visible="true"] { opacity: 1; transform: none; }

.card[data-theme="dark"] {
  --bg: #17191e;
  --fg: #f3f4f6;
  --muted: #a3abb7;
  --subtle: #7c8592;
  --line: rgba(255, 255, 255, 0.09);
  --hover: rgba(255, 255, 255, 0.07);
  --accent: #3ed6a4;
  --accent-soft: rgba(62, 214, 164, 0.13);
  --warn: #f2b84b;
  --shadow: 0 1px 2px rgba(0, 0, 0, 0.4), 0 14px 36px -8px rgba(0, 0, 0, 0.6);
  --shimmer: rgba(255, 255, 255, 0.08);
}

.row { display: flex; align-items: center; gap: 8px; min-width: 0; }
.source { color: var(--muted); font-size: 12.5px; }
.source-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.spacer { flex: 1 1 auto; }
.brand { flex: none; opacity: 0.9; }
.brand-bg { fill: var(--accent); }

.flag { flex: none; width: 18px; text-align: center; font-size: 14px; line-height: 1; }
.badge {
  flex: none; display: inline-grid; place-items: center;
  width: 18px; height: 18px; border-radius: 50%;
  background: var(--accent-soft); color: var(--accent);
  font-size: 9.5px; font-weight: 700; letter-spacing: -0.02em;
}

.result { margin-top: 6px; }
.approx { color: var(--subtle); font-size: 16px; font-weight: 500; margin-right: -3px; }
.value {
  font-size: 21px; font-weight: 650; letter-spacing: -0.02em; line-height: 1.15;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.code { color: var(--muted); font-size: 12px; font-weight: 600; letter-spacing: 0.02em; margin-top: 4px; }

.icon-btn {
  all: unset; box-sizing: border-box; flex: none;
  display: inline-grid; place-items: center;
  width: 26px; height: 26px; border-radius: 8px;
  color: var(--subtle); cursor: pointer;
  transition: background 120ms, color 120ms;
}
.icon-btn:hover { background: var(--hover); color: var(--fg); }
.icon-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
.icon-btn[data-done="true"] { color: var(--accent); }

.code-btn {
  all: unset; box-sizing: border-box;
  display: inline-flex; align-items: center; gap: 2px;
  padding: 1px 4px 1px 6px; margin-left: -2px; border-radius: 6px;
  color: var(--muted); font-weight: 600; font-size: 11.5px; cursor: pointer;
  background: var(--hover);
}
.code-btn:hover { color: var(--fg); }
.code-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
.code-btn[aria-expanded="true"] svg { transform: rotate(180deg); }

.alternatives { margin-top: 8px; flex-wrap: wrap; gap: 4px; }
.alt-label { color: var(--subtle); font-size: 11.5px; margin-right: 2px; }
.chip {
  all: unset; box-sizing: border-box; cursor: pointer;
  padding: 3px 7px; border-radius: 999px;
  border: 1px solid var(--line); color: var(--muted);
  font-size: 11.5px; font-weight: 600;
}
.chip:hover { color: var(--fg); background: var(--hover); }
.chip:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }

.meta {
  margin-top: 9px; padding-top: 8px; border-top: 1px solid var(--line);
  color: var(--subtle); font-size: 11.5px; line-height: 1.45;
}
.meta-line { gap: 6px; }
.meta-rate { color: var(--muted); font-weight: 500; }
.dot { width: 6px; height: 6px; border-radius: 50%; background: var(--warn); flex: none; }
.cached { color: var(--warn); font-weight: 500; }

.loading-text { color: var(--muted); font-size: 15px; font-weight: 500; }
.shimmer {
  height: 8px; width: 120px; margin-top: 10px; border-radius: 4px;
  background: linear-gradient(90deg, var(--shimmer) 0%, var(--hover) 50%, var(--shimmer) 100%);
  background-size: 200% 100%;
  animation: shimmer 1.1s ease-in-out infinite;
}
@keyframes shimmer { from { background-position: 100% 0; } to { background-position: -100% 0; } }

.message { gap: 8px; color: var(--muted); font-size: 12.5px; margin-top: 6px; align-items: flex-start; }
.message svg { flex: none; margin-top: 1px; }
.message[data-tone="error"] svg { color: var(--warn); }

@media (prefers-reduced-motion: reduce) {
  .card { transition: opacity 80ms linear; transform: none; }
  .shimmer { animation: none; }
}
`;
