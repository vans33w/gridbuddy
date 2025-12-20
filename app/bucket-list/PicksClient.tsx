"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { supabaseBrowser } from "../../lib/supabase/browser";

type TrackJoin = { id: number; slug: string | null; name: string; country: string | null };
type RaceJoin = { id: number; slug: string | null; name: string; country: string | null };

export type TrackRow = { id: number; status: "want" | "been"; track: TrackJoin | null };
export type RaceRow = { id: number; status: "want" | "been"; race: RaceJoin | null };

export default function PicksClient({
  initialTracks,
  initialRaces,
}: {
  initialTracks: TrackRow[];
  initialRaces: RaceRow[];
}) {
  const supabase = supabaseBrowser();

  const [tracks, setTracks] = useState<TrackRow[]>(initialTracks ?? []);
  const [races, setRaces] = useState<RaceRow[]>(initialRaces ?? []);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  function isAuthMissingError(e: any) {
    return String(e?.message ?? "").toLowerCase().includes("auth session missing");
  }

  async function requireUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      if (isAuthMissingError(error)) window.location.href = "/login";
      throw new Error(error.message);
    }
    if (!data.user) {
      window.location.href = "/login";
      throw new Error("Not logged in");
    }
    return data.user;
  }

  async function refresh() {
    setError("");
    const user = await requireUser();

    const { data: tData, error: tErr } = await supabase
      .from("user_tracks")
      .select("id,status,track:tracks_catalog(id,slug,name,country)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (tErr) throw new Error(tErr.message);

    const { data: rData, error: rErr } = await supabase
      .from("user_races")
      .select("id,status,race:races_catalog(id,slug,name,country)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (rErr) throw new Error(rErr.message);

    setTracks(((tData as unknown) as TrackRow[]) ?? []);
    setRaces(((rData as unknown) as RaceRow[]) ?? []);
  }

  async function setTrackStatus(rowId: number, status: "want" | "been") {
    setError("");
    setBusyId(`t-${rowId}`);
    try {
      await requireUser();
      const { error } = await supabase.from("user_tracks").update({ status }).eq("id", rowId);
      if (error) throw new Error(error.message);
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteTrack(rowId: number) {
    setError("");
    setBusyId(`t-del-${rowId}`);
    try {
      await requireUser();
      const { error } = await supabase.from("user_tracks").delete().eq("id", rowId);
      if (error) throw new Error(error.message);
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    } finally {
      setBusyId(null);
    }
  }

  async function setRaceStatus(rowId: number, status: "want" | "been") {
    setError("");
    setBusyId(`r-${rowId}`);
    try {
      await requireUser();
      const { error } = await supabase.from("user_races").update({ status }).eq("id", rowId);
      if (error) throw new Error(error.message);
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteRace(rowId: number) {
    setError("");
    setBusyId(`r-del-${rowId}`);
    try {
      await requireUser();
      const { error } = await supabase.from("user_races").delete().eq("id", rowId);
      if (error) throw new Error(error.message);
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    } finally {
      setBusyId(null);
    }
  }

  const tracksWant = useMemo(() => tracks.filter((t) => t.status === "want"), [tracks]);
  const tracksBeen = useMemo(() => tracks.filter((t) => t.status === "been"), [tracks]);
  const racesWant = useMemo(() => races.filter((r) => r.status === "want"), [races]);
  const racesBeen = useMemo(() => races.filter((r) => r.status === "been"), [races]);

  return (
    <div className="space-y-8">
      {error && !error.toLowerCase().includes("auth session missing") && (
        <p className="text-red-600 text-sm">{error}</p>
      )}

      <section className="card p-4 space-y-3">
        <div className="font-semibold">Tracks</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-[var(--border)] rounded-lg p-3 space-y-2">
            <div className="font-medium">Want to go</div>

            {tracksWant.map((t) => (
              <div key={t.id} className="border border-[var(--border)] rounded-md p-2 flex items-center justify-between gap-3">
                <div className="text-sm min-w-0">
                  {t.track?.slug ? (
                    <Link className="btn-text" href={`/tracks/${t.track.slug}`}>
                      {t.track.name}
                      {t.track.country ? ` — ${t.track.country}` : ""}
                    </Link>
                  ) : (
                    <span className="text-red-600">Missing track</span>
                  )}
                </div>

                <div className="flex gap-3 shrink-0">
                  <button
                    className="btn-text text-sm"
                    onClick={() => setTrackStatus(t.id, "been")}
                    disabled={busyId === `t-${t.id}`}
                  >
                    Mark Been
                  </button>
                  <button
                    className="btn-text text-sm"
                    onClick={() => deleteTrack(t.id)}
                    disabled={busyId === `t-del-${t.id}`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            {tracksWant.length === 0 && <div className="text-sm opacity-70">None yet.</div>}
          </div>

          <div className="border border-[var(--border)] rounded-lg p-3 space-y-2">
            <div className="font-medium">Been</div>

            {tracksBeen.map((t) => (
              <div key={t.id} className="border border-[var(--border)] rounded-md p-2 flex items-center justify-between gap-3">
                <div className="text-sm min-w-0">
                  {t.track?.slug ? (
                    <Link className="btn-text" href={`/tracks/${t.track.slug}`}>
                      {t.track.name}
                      {t.track.country ? ` — ${t.track.country}` : ""}
                    </Link>
                  ) : (
                    <span className="text-red-600">Missing track</span>
                  )}
                </div>

                <div className="flex gap-3 shrink-0">
                  <button
                    className="btn-text text-sm"
                    onClick={() => setTrackStatus(t.id, "want")}
                    disabled={busyId === `t-${t.id}`}
                  >
                    Mark Want
                  </button>
                  <button
                    className="btn-text text-sm"
                    onClick={() => deleteTrack(t.id)}
                    disabled={busyId === `t-del-${t.id}`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            {tracksBeen.length === 0 && <div className="text-sm opacity-70">None yet.</div>}
          </div>
        </div>
      </section>

      <section className="card p-4 space-y-3">
        <div className="font-semibold">Races</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-[var(--border)] rounded-lg p-3 space-y-2">
            <div className="font-medium">Want to go</div>

            {racesWant.map((r) => (
              <div key={r.id} className="border border-[var(--border)] rounded-md p-2 flex items-center justify-between gap-3">
                <div className="text-sm min-w-0">
                  {r.race?.slug ? (
                    <Link className="btn-text" href={`/races/${r.race.slug}`}>
                      {r.race.name}
                      {r.race.country ? ` — ${r.race.country}` : ""}
                    </Link>
                  ) : (
                    <span className="text-red-600">Missing race</span>
                  )}
                </div>

                <div className="flex gap-3 shrink-0">
                  <button
                    className="btn-text text-sm"
                    onClick={() => setRaceStatus(r.id, "been")}
                    disabled={busyId === `r-${r.id}`}
                  >
                    Mark Been
                  </button>
                  <button
                    className="btn-text text-sm"
                    onClick={() => deleteRace(r.id)}
                    disabled={busyId === `r-del-${r.id}`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            {racesWant.length === 0 && <div className="text-sm opacity-70">None yet.</div>}
          </div>

          <div className="border border-[var(--border)] rounded-lg p-3 space-y-2">
            <div className="font-medium">Been</div>

            {racesBeen.map((r) => (
              <div key={r.id} className="border border-[var(--border)] rounded-md p-2 flex items-center justify-between gap-3">
                <div className="text-sm min-w-0">
                  {r.race?.slug ? (
                    <Link className="btn-text" href={`/races/${r.race.slug}`}>
                      {r.race.name}
                      {r.race.country ? ` — ${r.race.country}` : ""}
                    </Link>
                  ) : (
                    <span className="text-red-600">Missing race</span>
                  )}
                </div>

                <div className="flex gap-3 shrink-0">
                  <button
                    className="btn-text text-sm"
                    onClick={() => setRaceStatus(r.id, "want")}
                    disabled={busyId === `r-${r.id}`}
                  >
                    Mark Want
                  </button>
                  <button
                    className="btn-text text-sm"
                    onClick={() => deleteRace(r.id)}
                    disabled={busyId === `r-del-${r.id}`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            {racesBeen.length === 0 && <div className="text-sm opacity-70">None yet.</div>}
          </div>
        </div>
      </section>
    </div>
  );
}
