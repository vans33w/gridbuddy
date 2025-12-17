"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../../lib/supabase/browser";

export default function MarkButtons({
  trackId,
  initialStatus,
}: {
  trackId: number;
  initialStatus: "want" | "been" | null;
}) {
  const supabase = supabaseBrowser();
  const router = useRouter();

  const [status, setStatus] = useState<"want" | "been" | null>(initialStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function ensureUserId(): Promise<string | null> {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      setError(error.message);
      return null;
    }
    return data.user?.id ?? null;
  }

  async function setTrackStatus(next: "want" | "been") {
    setError("");
    setLoading(true);

    const userId = await ensureUserId();
    if (!userId) {
      setLoading(false);
      window.location.href = "/login";
      return;
    }

    // upsert into user_tracks
    const { data: existing } = await supabase
      .from("user_tracks")
      .select("id")
      .eq("user_id", userId)
      .eq("track_id", trackId)
      .maybeSingle();

    if (existing?.id) {
      const { error } = await supabase.from("user_tracks").update({ status: next }).eq("id", existing.id);
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.from("user_tracks").insert({
        user_id: userId,
        track_id: trackId,
        status: next,
      });
      if (error) setError(error.message);
    }

    setStatus(next);
    setLoading(false);

    // refresh server-rendered popularity numbers
    router.refresh();
  }

  async function clearStatus() {
    setError("");
    setLoading(true);

    const userId = await ensureUserId();
    if (!userId) {
      setLoading(false);
      window.location.href = "/login";
      return;
    }

    const { error } = await supabase
      .from("user_tracks")
      .delete()
      .eq("user_id", userId)
      .eq("track_id", trackId);

    if (error) setError(error.message);

    setStatus(null);
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-3">
        <button
          className={`btn-secondary px-3 py-1.5 ${status === "want" ? "is-active" : ""}`}
          onClick={() => setTrackStatus("want")}
          disabled={loading}
        >
          {loading && status !== "want" ? "..." : "Want"}
        </button>

        <button
          className={`btn-secondary px-3 py-1.5 ${status === "been" ? "is-active" : ""}`}
          onClick={() => setTrackStatus("been")}
          disabled={loading}
        >
          {loading && status !== "been" ? "..." : "Been"}
        </button>

        <button className="btn-text text-sm" onClick={clearStatus} disabled={loading || !status}>
          Clear
        </button>
      </div>

      {status && <div className="text-xs opacity-70">Your status: {status}</div>}
      {error && <div className="text-xs text-red-600">{error}</div>}
    </div>
  );
}
