"use client";

import BackHome from "../components/BackHome";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "../../lib/supabase/browser";

type CatalogRace = {
  id: number;
  slug: string | null;
  name: string;
  country: string | null;
  season: number | null;
  round: number | null;
  race_date: string | null; // YYYY-MM-DD
};

type UserRace = {
  id: number;
  race_id: number;
  status: "been" | "want";
  created_at: string;
};

type PopularRow = {
  race_id: number;
  slug: string | null;
  name: string;
  country: string | null;
  season: number | null;
  round: number | null;
  total_picks: number;
  want_picks: number;
  been_picks: number;
};

export default function RacesPage() {
  const supabase = supabaseBrowser();

  const [catalog, setCatalog] = useState<CatalogRace[]>([]);
  const [userRaces, setUserRaces] = useState<UserRace[]>([]);
  const [top5, setTop5] = useState<PopularRow[]>([]);
  const [isAuthed, setIsAuthed] = useState(false);

  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  function isAuthMissingError(e: any) {
    const msg = String(e?.message ?? "").toLowerCase();
    return msg.includes("auth session missing");
  }

  async function getUserId(): Promise<string | null> {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      if (isAuthMissingError(error)) {
        setIsAuthed(false);
        return null;
      }
      setError(error.message);
      setIsAuthed(false);
      return null;
    }

    const uid = data.user?.id ?? null;
    setIsAuthed(Boolean(uid));
    return uid;
  }

  async function loadCatalog() {
    setError("");
    const { data, error } = await supabase
      .from("races_catalog")
      .select("id,slug,name,country,season,round,race_date")
      .order("season", { ascending: false })
      .order("round", { ascending: true });

    if (error) {
      setError(error.message);
      return;
    }
    setCatalog((data as CatalogRace[]) ?? []);
  }

  async function loadTop5() {
    const { data, error } = await supabase
      .from("race_popularity")
      .select("race_id,slug,name,country,season,round,total_picks,want_picks,been_picks")
      .order("total_picks", { ascending: false })
      .limit(5);

    if (error) {
      setError(error.message);
      return;
    }
    setTop5((data as PopularRow[]) ?? []);
  }

  async function loadUserRaces() {
    const uid = await getUserId();
    if (!uid) {
      setUserRaces([]);
      return;
    }

    const { data, error } = await supabase
      .from("user_races")
      .select("id,race_id,status,created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      return;
    }
    setUserRaces((data as UserRace[]) ?? []);
  }

  async function setStatus(raceId: number, status: "want" | "been") {
    setError("");
    const uid = await getUserId();
    if (!uid) {
      window.location.href = "/login";
      return;
    }

    const existing = userRaces.find((ur) => ur.race_id === raceId);

    if (existing) {
      const { error } = await supabase.from("user_races").update({ status }).eq("id", existing.id);
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.from("user_races").insert({
        user_id: uid,
        race_id: raceId,
        status,
      });
      if (error) setError(error.message);
    }

    await loadUserRaces();
    await loadTop5();
  }

  async function removeUserRace(userRaceId: number) {
    setError("");
    const uid = await getUserId();
    if (!uid) {
      window.location.href = "/login";
      return;
    }

    const { error } = await supabase.from("user_races").delete().eq("id", userRaceId);
    if (error) setError(error.message);

    await loadUserRaces();
    await loadTop5();
  }

  const filteredCatalog = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter((r) => r.name.toLowerCase().includes(q));
  }, [catalog, query]);

  function raceById(raceId: number) {
    return catalog.find((c) => c.id === raceId) ?? null;
  }

  useEffect(() => {
    loadCatalog();
    loadTop5();
    loadUserRaces();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      loadUserRaces();
    });

    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="space-y-6">
      <BackHome />

      <div>
        <h1 className="text-2xl font-bold">Races</h1>
        <p className="text-sm opacity-70">Browse as a guest. Log in to save Want/Been.</p>
      </div>

      {error && !error.toLowerCase().includes("auth session missing") && (
        <p className="text-red-600 text-sm">{error}</p>
      )}

      <section className="border rounded-xl p-4 space-y-3">
        <div className="font-semibold">Top 5 Popular Races</div>

        <div className="space-y-2">
          {top5.map((r, i) => (
            <div key={r.race_id} className="border rounded-lg p-3">
              <div className="font-semibold">
                {r.slug ? (
                  <Link className="underline" href={`/races/${r.slug}`}>
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
          {top5.length === 0 && <div className="text-sm opacity-70">No popularity data yet.</div>}
        </div>
      </section>

      <section className="border rounded-xl p-4 space-y-3">
        <div className="font-semibold">Browse all races</div>

        <input
          className="border p-2 w-full"
          placeholder="Search (e.g. Bahrain Grand Prix)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="border max-h-72 overflow-y-auto rounded-md">
          {filteredCatalog.map((r) => (
            <div key={r.id} className="flex items-center justify-between px-3 py-2 border-b">
              <div className="min-w-0">
                {r.slug ? (
                  <Link className="underline" href={`/races/${r.slug}`}>
                    {r.name}
                  </Link>
                ) : (
                  <span className="text-sm text-red-600">Missing slug for: {r.name}</span>
                )}
                <div className="text-xs opacity-70">
                  {r.season ? `Season ${r.season}` : "—"}
                  {r.round ? ` • Round ${r.round}` : ""}
                  {r.race_date ? ` • ${r.race_date}` : ""}
                </div>
              </div>

              <div className="flex gap-3 shrink-0">
                <button
                  className={`underline ${!isAuthed ? "opacity-50" : ""}`}
                  onClick={() => setStatus(r.id, "want")}
                  title={!isAuthed ? "Log in to save" : ""}
                >
                  Want
                </button>
                <button
                  className={`underline ${!isAuthed ? "opacity-50" : ""}`}
                  onClick={() => setStatus(r.id, "been")}
                  title={!isAuthed ? "Log in to save" : ""}
                >
                  Been
                </button>
              </div>
            </div>
          ))}

          {filteredCatalog.length === 0 && <div className="p-3 text-sm opacity-70">No matching races</div>}
        </div>

        {!isAuthed && (
          <div className="text-sm opacity-70">
            Want/Been requires <Link className="underline" href="/login">login</Link>.
          </div>
        )}
      </section>

      <section className="space-y-2">
        <div className="font-semibold">Your list</div>

        {!isAuthed ? (
          <p className="opacity-70">Log in to see your Want/Been list.</p>
        ) : (
          <>
            {userRaces.map((ur) => {
              const r = raceById(ur.race_id);
              return (
                <div key={ur.id} className="border rounded-xl p-3 flex justify-between">
                  <div>
                    {r?.slug ? (
                      <Link className="underline" href={`/races/${r.slug}`}>
                        {r.name}
                      </Link>
                    ) : (
                      <span className="text-sm text-red-600">Missing slug</span>
                    )}{" "}
                    — <span className="opacity-70">{ur.status}</span>
                  </div>
                  <button className="underline" onClick={() => removeUserRace(ur.id)}>
                    Remove
                  </button>
                </div>
              );
            })}

            {userRaces.length === 0 && <p className="opacity-70">No races yet.</p>}
          </>
        )}
      </section>
    </main>
  );
}
