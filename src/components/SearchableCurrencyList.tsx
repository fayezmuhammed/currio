import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { CURRENCY_LIST } from '@/constants/currencies';
import type { CurrencyCode } from '@/types/currency';
import { CurrencyIcon } from './CurrencyIcon';
import { Icon } from './Icon';

interface SearchableCurrencyListProps {
  value: CurrencyCode;
  onSelect: (code: CurrencyCode) => void;
  autoFocus?: boolean;
  /** Max height of the scrolling list, in px. */
  maxHeight?: number;
}

/** Search box + keyboard-navigable list (↑/↓, Enter) of every supported currency. */
export function SearchableCurrencyList({ value, onSelect, autoFocus = false, maxHeight = 340 }: SearchableCurrencyListProps) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CURRENCY_LIST;
    return CURRENCY_LIST.filter(
      (c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.symbol.toLowerCase() === q,
    ).sort((a, b) => Number(b.code.toLowerCase().startsWith(q)) - Number(a.code.toLowerCase().startsWith(q)));
  }, [query]);

  const activeIndex = Math.min(active, Math.max(0, results.length - 1));

  function move(delta: number): void {
    const next = (activeIndex + delta + results.length) % results.length;
    setActive(next);
    listRef.current?.children[next]?.scrollIntoView({ block: 'nearest' });
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (results.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      move(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      move(-1);
    } else if (event.key === 'Enter') {
      const pick = results[activeIndex];
      if (pick) onSelect(pick.code);
    }
  }

  return (
    <div>
      <label className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5 shadow-card focus-within:border-brand focus-within:ring-3 focus-within:ring-brand-soft">
        <Icon name="search" size={15} className="text-subtle" />
        <input
          type="search"
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Search currencies"
          aria-label="Search currencies"
          aria-controls={listId}
          aria-activedescendant={results[activeIndex] ? `${listId}-${results[activeIndex].code}` : undefined}
          className="w-full bg-transparent text-[13.5px] text-fg outline-none placeholder:text-subtle [&::-webkit-search-cancel-button]:hidden"
        />
      </label>

      <ul
        ref={listRef}
        id={listId}
        role="listbox"
        aria-label="Currencies"
        className="mt-2 overflow-y-auto overscroll-contain rounded-xl [scrollbar-width:thin]"
        style={{ maxHeight }}
      >
        {results.map((currency, index) => {
          const selected = currency.code === value;
          return (
            <li
              key={currency.code}
              id={`${listId}-${currency.code}`}
              role="option"
              aria-selected={selected}
              onMouseEnter={() => setActive(index)}
              onClick={() => onSelect(currency.code)}
              className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                index === activeIndex ? 'bg-inset' : ''
              }`}
            >
              <CurrencyIcon code={currency.code} size="sm" />
              <span className="w-10 text-[13.5px] font-semibold text-fg">{currency.code}</span>
              <span className="flex-1 truncate text-[13px] text-muted">{currency.name}</span>
              {selected && <Icon name="check" size={16} strokeWidth={2.4} className="text-brand" />}
            </li>
          );
        })}
        {results.length === 0 && (
          <li className="px-3 py-8 text-center text-[13px] text-muted">
            No currency matches “{query}”.
            <div className="mt-1 text-[12px] text-subtle">More currencies are coming soon.</div>
          </li>
        )}
      </ul>
    </div>
  );
}
