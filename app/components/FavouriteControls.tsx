"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabase/browser";
import { FAVOURITE_DB_STATUS, isFavouritedStatus } from "../../lib/favourites";

export function HeartIcon({ filled, className = "w-5 h-5" }: { filled: boolean; className?: string }) {
  if (filled) {
    return (
      <svg className={className} viewBox="0 0 24 24" aria-hidden fill="currentColor">
        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.002-.003.001a.751.751 0 01-.673 0z" />
      </svg>
    );
  }
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
      />
    </svg>
  );
}

export function FavouriteHeartIconButton({
  active,
  loading,
  disabled,
  onPress,
  className = "",
  label,
  overlay = false,
  iconClassName,
}: {
  active: boolean;
  loading?: boolean;
  disabled?: boolean;
  onPress: (e: React.MouseEvent) => void;
  className?: string;
  label: string;
  /** Top-right on image-style cards (wireframe). */
  overlay?: boolean;
  iconClassName?: string;
}) {
  const base = overlay
    ? `absolute top-2 right-2 z-20 inline-flex items-center justify-center rounded-full p-2 shadow-md ring-1 ring-[var(--border)] bg-white/95 backdrop-blur-sm transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)] ${
        active ? "text-[var(--primary)] ring-[var(--primary)]/30" : "text-[var(--secondary)]/70"
      }`
    : `inline-flex items-center justify-center rounded-full p-2 transition-colors border border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)] ${
        active ? "text-[var(--primary)] border-[var(--primary)]/40 bg-[var(--primary)]/5" : "text-[var(--secondary)]/70"
      }`;

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled || loading}
      onClick={onPress}
      className={`${base} ${className}`}
    >
      <HeartIcon filled={active} className={iconClassName ?? "w-5 h-5"} />
    </button>
  );
}

function useEntityFavouriteToggle(
  kind: "track" | "race",
  entityId: number,
  initialFavourited: boolean,
  onAfterToggle?: () => void
) {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const [favourited, setFavourited] = useState(initialFavourited);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setFavourited(initialFavourited);
  }, [initialFavourited]);

  const table = kind === "track" ? "user_tracks" : "user_races";
  const idCol = kind === "track" ? "track_id" : "race_id";

  async function toggle() {
    setError("");
    setLoading(true);
    try {
      const { data: userData, error: authErr } = await supabase.auth.getUser();
      if (authErr || !userData.user) {
        window.location.href = "/login";
        return;
      }
      const userId = userData.user.id;

      const { data: existing } = await supabase
        .from(table)
        .select("id,status")
        .eq("user_id", userId)
        .eq(idCol, entityId)
        .maybeSingle();

      if (existing?.id && isFavouritedStatus(existing.status as string)) {
        const { error: delErr } = await supabase.from(table).delete().eq("id", existing.id);
        if (delErr) setError(delErr.message);
        else setFavourited(false);
      } else if (existing?.id) {
        const { error: upErr } = await supabase
          .from(table)
          .update({ status: FAVOURITE_DB_STATUS })
          .eq("id", existing.id);
        if (upErr) setError(upErr.message);
        else setFavourited(true);
      } else {
        const { error: insErr } = await supabase.from(table).insert({
          user_id: userId,
          [idCol]: entityId,
          status: FAVOURITE_DB_STATUS,
        });
        if (insErr) setError(insErr.message);
        else setFavourited(true);
      }

      router.refresh();
      onAfterToggle?.();
    } finally {
      setLoading(false);
    }
  }

  return { favourited, loading, error, toggle };
}

export function FavouriteMarkButton({
  kind,
  entityId,
  initialFavourited,
}: {
  kind: "track" | "race";
  entityId: number;
  initialFavourited: boolean;
}) {
  const { favourited, loading, error, toggle } = useEntityFavouriteToggle(
    kind,
    entityId,
    initialFavourited
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={loading}
        aria-pressed={favourited}
        className={`btn-secondary inline-flex items-center gap-2 px-3 py-2 ${favourited ? "is-active" : ""}`}
      >
        <HeartIcon filled={favourited} className="w-4 h-4" />
        {loading ? "…" : favourited ? "On Your List" : "Add To Want"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

/** Heart on hero / image (top-right). */
export function FavouriteOverlayHeart({
  kind,
  entityId,
  initialFavourited,
  onAfterToggle,
  className = "",
}: {
  kind: "track" | "race";
  entityId: number;
  initialFavourited: boolean;
  onAfterToggle?: () => void;
  className?: string;
}) {
  const { favourited, loading, error, toggle } = useEntityFavouriteToggle(
    kind,
    entityId,
    initialFavourited,
    onAfterToggle
  );
  const label =
    kind === "track"
      ? favourited
        ? "Remove track from your lists"
        : "Add track to Want"
      : favourited
        ? "Remove race from your lists"
        : "Add race to Want";

  return (
    <div className={className}>
      <FavouriteHeartIconButton
        overlay
        active={favourited}
        loading={loading}
        label={label}
        onPress={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void toggle();
        }}
      />
      {error && (
        <span className="sr-only" role="status">
          {error}
        </span>
      )}
    </div>
  );
}

type CatalogKind = "track" | "race";

function trackPlaceholder() {
  return (
    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
      />
    </svg>
  );
}

function racePlaceholder() {
  return (
    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

/** Track/race grid tile with top-right favourite heart (homepage & shared patterns). */
export function FavouriteCatalogTile({
  kind,
  entityId,
  slug,
  name,
  country,
  heroImageUrl,
  initialFavourited,
  aspectClassName,
  rank,
  onAfterToggle,
}: {
  kind: CatalogKind;
  entityId: number;
  slug: string | null;
  name: string;
  country: string | null;
  heroImageUrl: string | null;
  initialFavourited: boolean;
  aspectClassName: string;
  rank?: number;
  onAfterToggle?: () => void;
}) {
  const href = slug ? `/${kind}s/${slug}` : "#";
  const { favourited, loading, toggle } = useEntityFavouriteToggle(
    kind,
    entityId,
    initialFavourited,
    onAfterToggle
  );
  const label =
    kind === "track"
      ? favourited
        ? "Remove track from your lists"
        : "Add track to Want"
      : favourited
        ? "Remove race from your lists"
        : "Add race to Want";

  return (
    <div className="group card overflow-hidden hover:shadow-lg transition-shadow relative">
      {rank != null && (
        <div className="absolute top-3 left-3 z-10 w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold text-sm">
          {rank}
        </div>
      )}

      <div className={`${aspectClassName} relative bg-[var(--secondary)]/5 overflow-hidden`}>
        <Link href={href} className="block h-full">
          {heroImageUrl ? (
            <img
              src={heroImageUrl}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--secondary)]/30">
              {kind === "track" ? trackPlaceholder() : racePlaceholder()}
            </div>
          )}
        </Link>
        <FavouriteHeartIconButton
          overlay
          active={favourited}
          loading={loading}
          label={label}
          onPress={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void toggle();
          }}
        />
      </div>

      <div className="p-4 border-t border-[var(--border)]">
        <Link href={href}>
          <h3 className="font-semibold text-[var(--secondary)] group-hover:text-[var(--primary)] transition-colors line-clamp-2">
            {name}
          </h3>
          {country && (
            <p className="text-sm text-[var(--secondary)]/60 mt-1">{country}</p>
          )}
        </Link>
      </div>
    </div>
  );
}
