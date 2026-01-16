"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabase/browser";

type AddToMomentProps = {
  trackId?: number;
  raceId?: number;
  trackName?: string;
  raceName?: string;
};

export default function AddToMoment({
  trackId,
  raceId,
  trackName,
  raceName,
}: AddToMomentProps) {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAddToMoment() {
    if (loading) return;
    setError("");
    setLoading(true);

    try {
      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (authError || !userData.user) {
        window.location.href = "/login";
        return;
      }

      // Create a moment with the track/race reference
      const momentData: any = {
        user_id: userData.user.id,
        title: trackName ? `Visit to ${trackName}` : raceName ? `Attended ${raceName}` : null,
        body: null,
        folder_id: null,
        entry_date: new Date().toISOString().split("T")[0],
      };

      if (trackId) {
        momentData.track_id = trackId;
      }
      if (raceId) {
        momentData.race_id = raceId;
      }

      const { data: created, error: insertError } = await supabase
        .from("moments")
        .insert(momentData)
        .select("id")
        .single();

      if (insertError) {
        // If track_id/race_id columns don't exist, try without them
        if (insertError.message.includes("column") && insertError.message.includes("does not exist")) {
          const { data: createdWithoutRef, error: insertError2 } = await supabase
            .from("moments")
            .insert({
              user_id: userData.user.id,
              title: trackName ? `Visit to ${trackName}` : raceName ? `Attended ${raceName}` : null,
              body: null,
              folder_id: null,
              entry_date: new Date().toISOString().split("T")[0],
            })
            .select("id")
            .single();

          if (insertError2) throw new Error(insertError2.message);
          
          // Navigate to moments page
          router.push("/moments");
          return;
        }
        throw new Error(insertError.message);
      }

      // Navigate to moments page where user can edit the moment
      router.push("/moments");
    } catch (e: any) {
      setError(e?.message ?? "Failed to add to moments");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        className="btn-primary px-4 py-2 text-sm font-medium"
        onClick={handleAddToMoment}
        disabled={loading}
      >
        {loading ? "Adding..." : "Add to Moments"}
      </button>
      {error && <div className="text-xs text-[var(--primary)]">{error}</div>}
    </div>
  );
}
