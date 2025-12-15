"use client";

import BackHome from "../components/BackHome";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "../../lib/supabase/browser";

type Row = {
  track_id: number;
  slug: string | null;
  name: string;
  country: string | null;
  total_picks: number;
  want_picks: number;
  been_picks: number;
};

export default function PopularTracksPage() {
  const supabase = supabaseBrowser();
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      window.location.href = "/login";
      return;
    }

    const { data, error } = await supabase
      .from("track_popularity")
      .select("track_id,slug,name,country,total_picks,want_picks,been_picks")
      .order("total_picks", { ascending: false })
      .limit(50);

    if (error) {
      setError(error.message);
      return;
    }
    setRows((data as Row[]) ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="p-6 space-y-4 max-w-2xl">
      <BackHome />

      <h1 className="text-2xl font-bold">Most Popular Tracks</h1>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={r.track_id} className="border p-3">
            <div className="font-semibold">
              {r.slug ? (
                <Link className="underline" href={`/tracks/${r.slug}`}>
                  #{i + 1} {r.name} {r.country ? `— ${r.country}` : ""}
                </Link>
              ) : (
                <span className="text-red-600">Missing slug for {r.name}</span>
              )}
            </div>
            <div className="text-sm opacity-80">
              Total: {r.total_picks} • Want: {r.want_picks} • Been: {r.been_picks}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
