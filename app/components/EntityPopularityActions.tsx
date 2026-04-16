"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabase/browser";
import { FAVOURITE_DB_STATUS, isFavouritedStatus, type PickStatus } from "../../lib/favourites";
import { HeartIcon } from "./FavouriteControls";

type CatalogKind = "track" | "race";

function BucketListIcon({ active, className = "w-6 h-6" }: { active: boolean; className?: string }) {
  return (
    <span className="relative inline-flex">
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden
      >
        <circle cx="12" cy="12" r="9" strokeLinecap="round" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 12.5l2 2 5-5" />
      </svg>
      <span
        className={`absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold leading-none ${
          active ? "bg-[var(--primary)] text-white" : "bg-[var(--secondary)] text-white"
        }`}
      >
        +
      </span>
    </span>
  );
}

function LogbookIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function EntityPopularityActions({
  kind,
  entityId,
  initialStatus,
  likesCount,
  averageRating,
}: {
  kind: CatalogKind;
  entityId: number;
  initialStatus: PickStatus | null;
  likesCount: number;
  averageRating: number | null;
}) {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const [status, setStatus] = useState<PickStatus | null>(
    initialStatus === "want" || initialStatus === "been" ? initialStatus : null
  );
  const [busy, setBusy] = useState<"like" | "want" | "been" | null>(null);

  useEffect(() => {
    setStatus(initialStatus === "want" || initialStatus === "been" ? initialStatus : null);
  }, [initialStatus]);

  const table = kind === "track" ? "user_tracks" : "user_races";
  const idCol = kind === "track" ? "track_id" : "race_id";

  async function requireUser() {
    const { data: userData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !userData.user) {
      window.location.href = "/login";
      throw new Error("auth");
    }
    return userData.user;
  }

  async function refreshFromServer() {
    router.refresh();
  }

  const likeActive = isFavouritedStatus(status);
  const wantActive = status === "want";
  const beenActive = status === "been";

  function tileBase(active: boolean) {
    return `flex flex-col items-center gap-2 flex-1 min-w-0 p-3 rounded-xl border text-center transition-colors ${
      active
        ? "border-[var(--primary)]/50 bg-[var(--primary)]/5 text-[var(--primary)]"
        : "border-[var(--border)] text-[var(--secondary)]/80 hover:border-[var(--primary)]/40 hover:bg-[var(--primary)]/[0.03]"
    }`;
  }

  async function handleLike() {
    if (busy) return;
    setBusy("like");
    try {
      const user = await requireUser();
      const { data: existing } = await supabase
        .from(table)
        .select("id,status")
        .eq("user_id", user.id)
        .eq(idCol, entityId)
        .maybeSingle();

      if (existing?.id && isFavouritedStatus(existing.status as string)) {
        const { error: delErr } = await supabase.from(table).delete().eq("id", existing.id);
        if (delErr) throw delErr;
        setStatus(null);
      } else if (existing?.id) {
        const { error: upErr } = await supabase
          .from(table)
          .update({ status: FAVOURITE_DB_STATUS })
          .eq("id", existing.id);
        if (upErr) throw upErr;
        setStatus(FAVOURITE_DB_STATUS);
      } else {
        const { error: insErr } = await supabase.from(table).insert({
          user_id: user.id,
          [idCol]: entityId,
          status: FAVOURITE_DB_STATUS,
        });
        if (insErr) throw insErr;
        setStatus(FAVOURITE_DB_STATUS);
      }
      await refreshFromServer();
    } catch (e) {
      if ((e as Error)?.message !== "auth") console.error(e);
    } finally {
      setBusy(null);
    }
  }

  async function handleBucketList() {
    if (busy) return;
    setBusy("want");
    try {
      const user = await requireUser();
      const { data: existing } = await supabase
        .from(table)
        .select("id,status")
        .eq("user_id", user.id)
        .eq(idCol, entityId)
        .maybeSingle();

      if (existing?.id && existing.status === "want") {
        const { error: delErr } = await supabase.from(table).delete().eq("id", existing.id);
        if (delErr) throw delErr;
        setStatus(null);
      } else if (existing?.id) {
        const { error: upErr } = await supabase
          .from(table)
          .update({ status: "want" })
          .eq("id", existing.id);
        if (upErr) throw upErr;
        setStatus("want");
      } else {
        const { error: insErr } = await supabase.from(table).insert({
          user_id: user.id,
          [idCol]: entityId,
          status: "want",
        });
        if (insErr) throw insErr;
        setStatus("want");
      }
      await refreshFromServer();
    } catch (e) {
      if ((e as Error)?.message !== "auth") console.error(e);
    } finally {
      setBusy(null);
    }
  }

  async function handleLogbook() {
    if (busy) return;
    setBusy("been");
    try {
      const user = await requireUser();
      const { data: existing } = await supabase
        .from(table)
        .select("id,status")
        .eq("user_id", user.id)
        .eq(idCol, entityId)
        .maybeSingle();

      if (existing?.id && existing.status === "been") {
        const { error: delErr } = await supabase.from(table).delete().eq("id", existing.id);
        if (delErr) throw delErr;
        setStatus(null);
      } else if (existing?.id) {
        const { error: upErr } = await supabase
          .from(table)
          .update({ status: "been" })
          .eq("id", existing.id);
        if (upErr) throw upErr;
        setStatus("been");
      } else {
        const { error: insErr } = await supabase.from(table).insert({
          user_id: user.id,
          [idCol]: entityId,
          status: "been",
        });
        if (insErr) throw insErr;
        setStatus("been");
      }
      await refreshFromServer();
    } catch (e) {
      if ((e as Error)?.message !== "auth") console.error(e);
    } finally {
      setBusy(null);
    }
  }

  const ratingLabel =
    averageRating != null ? `${averageRating.toFixed(1)} / 5 rating` : "No rating yet";

  return (
    <div className="card p-6 space-y-5">
      <h3
        className="font-semibold text-lg text-[var(--secondary)]"
        style={{ fontFamily: "var(--font-space-grotesk)" }}
      >
        Popularity
      </h3>

      <div className="flex gap-2 sm:gap-3 justify-between">
        <button
          type="button"
          className={tileBase(likeActive)}
          aria-pressed={likeActive}
          disabled={busy !== null}
          onClick={() => void handleLike()}
        >
          <span
            className={`inline-flex h-11 w-11 items-center justify-center rounded-full border ${
              likeActive ? "border-[var(--primary)]/40 bg-white" : "border-[var(--border)] bg-white"
            }`}
          >
            <HeartIcon filled={likeActive} className="w-6 h-6" />
          </span>
          <span className="text-xs font-medium text-[var(--secondary)]">Like</span>
        </button>

        <button
          type="button"
          className={tileBase(wantActive)}
          aria-pressed={wantActive}
          disabled={busy !== null}
          onClick={() => void handleBucketList()}
        >
          <span
            className={`inline-flex h-11 w-11 items-center justify-center rounded-full border ${
              wantActive ? "border-[var(--primary)]/40 bg-white" : "border-[var(--border)] bg-white"
            }`}
          >
            <BucketListIcon active={wantActive} />
          </span>
          <span className="text-xs font-medium text-[var(--secondary)]">Bucket List</span>
        </button>

        <button
          type="button"
          className={tileBase(beenActive)}
          aria-pressed={beenActive}
          disabled={busy !== null}
          onClick={() => void handleLogbook()}
        >
          <span
            className={`inline-flex h-11 w-11 items-center justify-center rounded-full border ${
              beenActive ? "border-[var(--primary)]/40 bg-white" : "border-[var(--border)] bg-white"
            }`}
          >
            <LogbookIcon />
          </span>
          <span className="text-xs font-medium text-[var(--secondary)]">Logbook</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--secondary)]/80 border-t border-[var(--border)] pt-4">
        <span>
          <span className="font-medium text-[var(--secondary)]/70">Likes: </span>
          {likesCount}
        </span>
        <span className="text-right">{ratingLabel}</span>
      </div>
    </div>
  );
}
