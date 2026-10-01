import type { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-line bg-surface shadow-card ${className}`}>{children}</section>;
}

export function SectionLabel({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-1.5 flex items-center justify-between px-1">
      <h2 className="text-[11px] font-semibold tracking-[0.06em] text-subtle uppercase">{children}</h2>
      {action}
    </div>
  );
}

interface SettingRowProps {
  title: string;
  description?: string;
  control: ReactNode;
  badge?: string;
}

export function SettingRow({ title, description, control, badge }: SettingRowProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[13.5px] font-medium text-fg">
          {title}
          {badge && (
            <span className="rounded-full bg-inset px-1.5 py-px text-[10px] font-semibold tracking-wide text-subtle uppercase">
              {badge}
            </span>
          )}
        </div>
        {description && <p className="mt-0.5 text-[12px] leading-snug text-muted">{description}</p>}
      </div>
      {control}
    </div>
  );
}

export function Divider() {
  return <div className="mx-4 h-px bg-line" />;
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-[20px] min-w-[20px] items-center justify-center rounded-md border border-line bg-inset px-1.5 font-sans text-[11px] font-semibold text-muted shadow-[inset_0_-1px_0_var(--line)]">
      {children}
    </kbd>
  );
}

/** "Alt+Shift+C" (Windows/Linux) or "⌥⇧C" (macOS) → individual keys. */
export function Shortcut({ value }: { value: string }) {
  const keys = value.includes('+') ? value.split('+') : Array.from(value);
  return (
    <span className="inline-flex items-center gap-1">
      {keys.map((key) => (
        <Kbd key={key}>{key}</Kbd>
      ))}
    </span>
  );
}
