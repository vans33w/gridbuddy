"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../../lib/supabase/browser";

export default function MarkButtons({
  raceId,
  initialStatus,
}: {
  raceId: number;
  initialStatus: "want" | "been" | null;
}) {
  const supabase = supabaseBrowser();
  const router = useRouter();

  const [status, setStatus] = useState<"want" | "been" | null>(initialStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function ensureUserId() {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return data.user.id;
  }

  async function setRaceStatus(next: "want" | "been") {
    setLoading(true);
    setError("");

    const userId = await ensureUserId();
    if (!userId) {
      window.location.href = "/login";
      return;
    }

    const { data: existing } = await supabase
      .from("user_races")
      .select("id")
      .eq("user_id", userId)
      .eq("race_id", raceId)
      .maybeSingle();

    if (existing?.id) {
      await supabase.from("user_races").update({ status: next }).eq("id", existing.id);
    } else {
      await supabase.from("user_races").insert({
        user_id: userId,
        race_id: raceId,
        status: next,
      });
    }

    setStatus(next);
    setLoading(false);
    router.refresh();
  }

  async function clearStatus() {
    setLoading(true);
    setError("");

    const userId = await ensureUserId();
    if (!userId) {
      window.location.href = "/login";
      return;
    }

    await supabase
      .from("user_races")
      .delete()
      .eq("user_id", userId)
      .eq("race_id", raceId);

    setStatus(null);
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-3">
        <button
          className={`btn-secondary px-3 py-1.5 ${status === "want" ? "is-active" : ""}`}
          onClick={() => setRaceStatus("want")}
          disabled={loading}
        >
          Want
        </button>

        <button
          className={`btn-secondary px-3 py-1.5 ${status === "been" ? "is-active" : ""}`}
          onClick={() => setRaceStatus("been")}
          disabled={loading}
        >
          Been
        </button>

        <button
          className="btn-text text-sm"
          onClick={clearStatus}
          disabled={loading || !status}
        >
          Clear
        </button>
      </div>

      {status && <div className="text-xs opacity-70">Your status: {status}</div>}
      {error && <div className="text-xs text-red-600">{error}</div>}
    </div>
  );
}
