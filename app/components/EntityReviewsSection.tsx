"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "../../lib/supabase/browser";
import UpvoteHeart from "./UpvoteHeart";
import { StarRatingDisplay, StarRatingInput } from "./StarRating";

type EntityKind = "track" | "race";

function basePath(k: EntityKind) {
  return k === "track" ? "tracks" : "races";
}

type ReviewRow = {
  id: number;
  user_id: string;
  rating: number;
  body: string;
  created_at: string;
};

export default function EntityReviewsSection({
  entityType,
  entityId,
  entitySlug,
  variant,
}: {
  entityType: EntityKind;
  entityId: number;
  entitySlug: string;
  variant: "preview" | "full";
}) {
  const supabase = supabaseBrowser();
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [usernames, setUsernames] = useState<Record<string, string>>({});
  const [upvoteCounts, setUpvoteCounts] = useState<Record<number, number>>({});
  const [userUpvotes, setUserUpvotes] = useState<Set<number>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [upBusy, setUpBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");

  const loadUser = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    const uid = data.user?.id ?? null;
    setUserId(uid);
    return uid;
  }, [supabase]);

  const loadProfiles = useCallback(
    async (ids: string[]) => {
      const uniq = [...new Set(ids)].filter(Boolean);
      if (uniq.length === 0) {
        setUsernames({});
        return;
      }
      const { data, error: pErr } = await supabase.from("profiles").select("id,username").in("id", uniq);
      if (pErr) return;
      const map: Record<string, string> = {};
      for (const p of data ?? []) {
        map[p.id as string] = (p.username as string) ?? "User";
      }
      setUsernames(map);
    },
    [supabase]
  );

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const { data: revData, error: revErr } = await supabase
        .from("entity_reviews")
        .select("id,user_id,rating,body,created_at")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .order("created_at", { ascending: false });

      if (revErr) throw new Error(revErr.message);
      const rows = (revData as ReviewRow[]) ?? [];
      setReviews(rows);
      await loadProfiles(rows.map((r) => r.user_id));

      const ids = rows.map((r) => r.id);
      if (ids.length === 0) {
        setUpvoteCounts({});
        setUserUpvotes(new Set());
        setLoading(false);
        return;
      }

      const { data: likes } = await supabase.from("entity_review_upvotes").select("review_id,user_id").in("review_id", ids);

      const counts: Record<number, number> = {};
      const mine = new Set<number>();
      const uid = await loadUser();
      for (const l of likes ?? []) {
        counts[l.review_id] = (counts[l.review_id] ?? 0) + 1;
        if (uid && l.user_id === uid) mine.add(l.review_id);
      }
      setUpvoteCounts(counts);
      setUserUpvotes(mine);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [entityId, entityType, loadProfiles, loadUser, supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  const sorted = useMemo(() => {
    const list = [...reviews];
    list.sort((a, b) => {
      const ca = upvoteCounts[a.id] ?? 0;
      const cb = upvoteCounts[b.id] ?? 0;
      if (cb !== ca) return cb - ca;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return list;
  }, [reviews, upvoteCounts]);

  const visible = variant === "preview" ? sorted.slice(0, 3) : sorted;

  const seeAllHref = `/${basePath(entityType)}/${entitySlug}/reviews`;

  async function toggleUpvote(reviewId: number) {
    if (!userId || upBusy) return;
    setUpBusy(true);
    setError("");
    try {
      const has = userUpvotes.has(reviewId);
      if (has) {
        await supabase
          .from("entity_review_upvotes")
          .delete()
          .eq("user_id", userId)
          .eq("review_id", reviewId);
        setUserUpvotes((prev) => {
          const n = new Set(prev);
          n.delete(reviewId);
          return n;
        });
        setUpvoteCounts((prev) => ({
          ...prev,
          [reviewId]: Math.max(0, (prev[reviewId] ?? 1) - 1),
        }));
      } else {
        await supabase.from("entity_review_upvotes").insert({ user_id: userId, review_id: reviewId });
        setUserUpvotes((prev) => new Set(prev).add(reviewId));
        setUpvoteCounts((prev) => ({
          ...prev,
          [reviewId]: (prev[reviewId] ?? 0) + 1,
        }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upvote failed");
    } finally {
      setUpBusy(false);
    }
  }

  async function submitReview() {
    if (!userId) {
      window.location.href = "/login";
      return;
    }
    const t = body.trim();
    if (!t) {
      setError("Please write a short review.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const { error: upErr } = await supabase.from("entity_reviews").upsert(
        {
          user_id: userId,
          entity_type: entityType,
          entity_id: entityId,
          rating,
          body: t,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,entity_type,entity_id" }
      );
      if (upErr) throw new Error(upErr.message);
      setBody("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save review");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-semibold text-lg text-[var(--secondary)]" style={{ fontFamily: "var(--font-space-grotesk)" }}>
          Reviews
        </h2>
        {variant === "preview" && (
          <Link href={seeAllHref} className="btn-text text-sm">
            See all
          </Link>
        )}
      </div>

      <div className="border border-[var(--border)] rounded-lg p-3 space-y-3">
        <div className="text-sm font-medium text-[var(--secondary)]/80">Write a review</div>
        <StarRatingInput value={rating} onChange={setRating} disabled={!userId || submitting} />
        <textarea
          className="border border-[var(--border)] rounded-lg p-2 w-full min-h-[80px] text-sm"
          placeholder={userId ? "Share your experience…" : "Log in to review"}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={!userId || submitting}
        />
        <button
          type="button"
          className="btn-primary px-4 py-2 text-sm"
          disabled={!userId || submitting || !body.trim()}
          onClick={() => void submitReview()}
        >
          {submitting ? "Saving…" : "Post review"}
        </button>
        {!userId && (
          <p className="text-xs text-[var(--secondary)]/60">
            <a href="/login" className="btn-text">
              Log in
            </a>{" "}
            to post.
          </p>
        )}
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {loading ? (
        <p className="text-sm opacity-70">Loading reviews…</p>
      ) : visible.length === 0 ? (
        <p className="text-sm opacity-70">No reviews yet. Be the first.</p>
      ) : (
        <ul className="space-y-3">
          {visible.map((r) => (
            <li
              key={r.id}
              className="border border-[var(--border)] rounded-lg p-3 flex flex-col sm:flex-row sm:items-start gap-3"
            >
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium">{usernames[r.user_id] ?? "User"}</span>
                  <StarRatingDisplay rating={r.rating} />
                  <span className="text-xs opacity-50">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-[var(--secondary)]/90 whitespace-pre-wrap">{r.body}</p>
              </div>
              <UpvoteHeart
                count={upvoteCounts[r.id] ?? 0}
                active={userUpvotes.has(r.id)}
                disabled={!userId}
                busy={upBusy}
                onToggle={() => void toggleUpvote(r.id)}
                label={userUpvotes.has(r.id) ? "Remove upvote" : "Upvote review"}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
