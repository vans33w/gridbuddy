"use client";

export function StarRatingDisplay({ rating }: { rating: number }) {
  const r = Math.round(Math.min(5, Math.max(1, rating)));
  return (
    <div className="flex gap-0.5" aria-label={`${r} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= r ? "text-[var(--primary)]" : "text-[var(--secondary)]/25"}>
          ★
        </span>
      ))}
    </div>
  );
}

export function StarRatingInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-1" role="group" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={disabled}
          onClick={() => onChange(i)}
          className={`text-xl leading-none p-0.5 rounded transition-colors ${
            i <= value ? "text-[var(--primary)]" : "text-[var(--secondary)]/25 hover:text-[var(--primary)]/50"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          aria-label={`${i} stars`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
