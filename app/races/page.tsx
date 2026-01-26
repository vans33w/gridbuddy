"use client";

import BackHome from "../components/BackHome";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "../../lib/supabase/browser";

type CatalogRace = { id: number; slug: string | null; name: string; country: string | null; hero_image_url: string | null };
type UserRace = { id: number; race_id: number; status: "been" | "want"; created_at: string };

type PopularRow = {
  race_id: number;
  slug: string | null;
  name: string;
  country: string | null;
  hero_image_url: string | null;
  total_picks: number;
  want_picks: number;
  been_picks: number;
};

export default function RacesPage() {
  const supabase = supabaseBrowser();

  const [catalog, setCatalog] = useState<CatalogRace[]>([]);
  const [userRaces, setUserRaces] = useState<UserRace[]>([]);
  const [popularTop5, setPopularTop5] = useState<PopularRow[]>([]);
  const [isAuthed, setIsAuthed] = useState(false);

  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  async function getUserId(): Promise<string | null> {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      const msg = (error.message || "").toLowerCase();
      if (msg.includes("auth session missing")) {
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
      .select("id,slug,name,country,hero_image_url")
      .order("name");

    if (error) {
      setError(error.message);
      return;
    }
    setCatalog((data as CatalogRace[]) ?? []);
  }

  async function loadTop5() {
    setError("");
    const { data: popData, error: popError } = await supabase
      .from("race_popularity")
      .select("race_id,slug,name,country,total_picks,want_picks,been_picks")
      .order("total_picks", { ascending: false })
      .limit(8);

    if (popError) {
      setError(popError.message);
      return;
    }

    if (!popData || popData.length === 0) {
      setPopularTop5([]);
      return;
    }

    const raceIds = popData.map((p) => p.race_id);
    const { data: races, error: racesError } = await supabase
      .from("races_catalog")
      .select("id,hero_image_url")
      .in("id", raceIds);

    if (racesError) {
      setError(racesError.message);
      return;
    }

    const popularWithImages = popData.map((pop) => {
      const race = races?.find((r) => r.id === pop.race_id);
      return {
        ...pop,
        hero_image_url: race?.hero_image_url ?? null,
      };
    });

    setPopularTop5(popularWithImages);
  }

  async function loadUserRaces() {
    setError("");
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

    return () => {
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="space-y-6 sm:space-y-8">
      <BackHome />

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--secondary)]/40">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          className="border border-[var(--border)] rounded-lg pl-10 pr-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
          placeholder="Browse all races.."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {error && <p className="text-[var(--primary)] text-sm">{error}</p>}

      {/* Popular Races Section */}
      <section className="space-y-4 sm:space-y-6">
        <h2
          className="text-xl sm:text-2xl font-bold text-[var(--secondary)]"
          style={{ fontFamily: "var(--font-space-grotesk)" }}
        >
          Popular Races
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {popularTop5.length > 0 ? (
            popularTop5.map((race, i) => (
              <Link
                key={race.race_id}
                href={race.slug ? `/races/${race.slug}` : "#"}
                className="group card overflow-hidden hover:shadow-lg transition-all relative"
              >
                {/* Numbered Circle */}
                <div className="absolute top-3 left-3 z-10 w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold text-sm">
                  {i + 1}
                </div>

                {/* Image */}
                <div className="aspect-[4/3] relative bg-[var(--secondary)]/5 overflow-hidden">
                  {race.hero_image_url ? (
                    <img
                      src={race.hero_image_url}
                      alt={race.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--secondary)]/30">
                      <svg
                        className="w-16 h-16"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Title */}
                <div className="p-4 border-t border-[var(--border)]">
                  <h3 className="font-semibold text-[var(--secondary)] group-hover:text-[var(--primary)] transition-colors line-clamp-2">
                    {race.name}
                  </h3>
                  {race.country && (
                    <p className="text-sm text-[var(--secondary)]/60 mt-1">
                      {race.country}
                    </p>
                  )}
              </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-sm opacity-70 py-8 text-center">
              No popular races yet.
            </div>
          )}
        </div>
      </section>

      {/* Browse All Races Section */}
      <section className="space-y-4">
        <h2
          className="text-xl font-bold text-[var(--secondary)]"
          style={{ fontFamily: "var(--font-space-grotesk)" }}
        >
          {query ? "Search Results" : "All Races"}
        </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredCatalog.map((race) => (
              <Link
                key={race.id}
                href={race.slug ? `/races/${race.slug}` : "#"}
                className="group card overflow-hidden hover:shadow-lg transition-all relative"
              >
                {/* Image */}
                <div className="aspect-[4/3] relative bg-[var(--secondary)]/5 overflow-hidden">
                  {race.hero_image_url ? (
                    <img
                      src={race.hero_image_url}
                      alt={race.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--secondary)]/30">
                      <svg
                        className="w-16 h-16"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
        </div>

                {/* Title */}
                <div className="p-4 border-t border-[var(--border)]">
                  <h3 className="font-semibold text-[var(--secondary)] group-hover:text-[var(--primary)] transition-colors">
                    {race.name}
                  </h3>
                  {race.country && (
                    <p className="text-sm text-[var(--secondary)]/60 mt-1">
                      {race.country}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {filteredCatalog.length === 0 && (
            <div className="text-sm opacity-70 py-8 text-center">
              {query ? "No matching races found." : "No races available."}
          </div>
        )}
      </section>

      {/* Your List Section */}
      {isAuthed && (
        <section className="space-y-4">
          <h2
            className="text-xl font-bold text-[var(--secondary)]"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            Your List
          </h2>

          {userRaces.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {userRaces.map((ur) => {
              const r = raceById(ur.race_id);
                if (!r) return null;
              return (
                  <div key={ur.id} className="card p-4 space-y-3">
                    {r.slug ? (
                      <Link
                        href={`/races/${r.slug}`}
                        className="font-semibold hover:text-[var(--primary)] transition-colors block"
                      >
                        {r.name}
                        {r.country ? ` — ${r.country}` : ""}
                      </Link>
                    ) : (
                      <span className="text-sm text-[var(--primary)]">
                        Missing slug
                      </span>
                    )}
                    <span className="text-sm opacity-70 block">Status: {ur.status}</span>
                    <div className="flex gap-2 flex-wrap">
                    {ur.status !== "want" && (
                        <button
                          className="btn-text text-xs"
                          onClick={() => setStatus(ur.race_id, "want")}
                        >
                        Mark Want
                      </button>
                    )}
                    {ur.status !== "been" && (
                        <button
                          className="btn-text text-xs"
                          onClick={() => setStatus(ur.race_id, "been")}
                        >
                        Mark Been
                      </button>
                    )}
                      <button
                        className="btn-text text-xs"
                        onClick={() => removeUserRace(ur.id)}
                      >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
            </div>
          ) : (
            <p className="opacity-70">No races in your list yet.</p>
        )}
      </section>
      )}

      {!isAuthed && (
        <div className="text-sm opacity-70 text-center py-4">
          <Link href="/login" className="btn-text">
            Log in
          </Link>{" "}
          to save races to your Want/Been list.
        </div>
      )}
    </main>
  );
}
