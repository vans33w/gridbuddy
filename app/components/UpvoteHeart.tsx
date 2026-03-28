"use client";

type UpvoteHeartProps = {
  count: number;
  active: boolean;
  disabled?: boolean;
  busy?: boolean;
  onToggle: () => void;
  label?: string;
};

export default function UpvoteHeart({
  count,
  active,
  disabled,
  busy,
  onToggle,
  label = "Upvote",
}: UpvoteHeartProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled || busy}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`flex items-center gap-1 text-sm px-2 py-1 rounded transition-colors shrink-0 ${
        active ? "text-[var(--primary)]" : "text-[var(--secondary)]/70 hover:text-[var(--primary)]"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
        className="w-4 h-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
      <span className="tabular-nums min-w-[1.25rem]">{count}</span>
    </button>
  );
}
