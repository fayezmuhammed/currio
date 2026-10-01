import type { ReactNode } from 'react';
import { Icon } from '@/components/Icon';

/** Header for sub-pages: back button + title. */
export function PageHeader({ title, onBack, action }: { title: string; onBack: () => void; action?: ReactNode }) {
  return (
    <header className="flex items-center gap-1 px-2 pt-3 pb-2">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-inset hover:text-fg"
      >
        <Icon name="chevronLeft" size={18} />
      </button>
      <h1 className="flex-1 text-[15px] font-semibold tracking-[-0.015em] text-fg">{title}</h1>
      {action}
    </header>
  );
}
