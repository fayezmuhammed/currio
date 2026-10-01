interface BrandMarkProps {
  size?: number;
  className?: string;
}

/** Currio's mark: a "C" drawn as a conversion arc. Matches the toolbar icon and the in-page card. */
export function BrandMark({ size = 28, className }: BrandMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect width="32" height="32" rx="9" className="fill-brand" />
      <path d="M21.5 11.2A7.5 7.5 0 1 0 21.5 20.8" fill="none" className="stroke-on-brand" strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="23.2" cy="16" r="1.9" className="fill-on-brand" />
    </svg>
  );
}

export function Logo({ tagline = true }: { tagline?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <BrandMark size={30} />
      <div className="leading-tight">
        <div className="text-[15px] font-semibold tracking-[-0.02em] text-fg">Currio</div>
        {tagline && <div className="text-[11.5px] text-muted">Instant Currency Conversion</div>}
      </div>
    </div>
  );
}
