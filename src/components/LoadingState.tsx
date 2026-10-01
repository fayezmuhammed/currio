/** Shimmering placeholder lines, sized like the content they stand in for. */
export function LoadingState({ lines = 2, label = 'Loading' }: { lines?: number; label?: string }) {
  return (
    <div className="space-y-2.5" role="status" aria-label={label}>
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className="h-3 animate-pulse rounded-md bg-inset"
          style={{ width: `${i === 0 ? 45 : 70 - i * 10}%` }}
        />
      ))}
    </div>
  );
}

export function Spinner({ size = 14 }: { size?: number }) {
  return (
    <span
      className="inline-block animate-spin-slow rounded-full border-2 border-current border-t-transparent"
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}
