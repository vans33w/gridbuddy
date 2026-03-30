"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "../../lib/supabase/browser";
import { FavouriteHeartIconButton } from "../components/FavouriteControls";
import { isFavouritedStatus } from "../../lib/favourites";

type TrackJoin = {
  id: number;
  slug: string | null;
  name: string;
  country: string | null;
  hero_image_url: string | null;
};
type RaceJoin = {
  id: number;
  slug: string | null;
  name: string;
  country: string | null;
  hero_image_url: string | null;
};

export type TrackRow = {
  id: number;
  status: "want" | "been";
  created_at: string;
  track: TrackJoin | null;
};
export type RaceRow = {
  id: number;
  status: "want" | "been";
  created_at: string;
  race: RaceJoin | null;
};

type ListFilter = "all" | "tracks" | "races";

type CatalogTrack = {
  id: number;
  slug: string | null;
  name: string;
  country: string | null;
  hero_image_url: string | null;
};
type CatalogRace = {
  id: number;
  slug: string | null;
  name: string;
  country: string | null;
  hero_image_url: string | null;
};

function FilterSelect({
  value,
  onChange,
  id,
}: {
  value: ListFilter;
  onChange: (v: ListFilter) => void;
  id: string;
}) {
  return (
    <select
      id={id}
      className="border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-white"
      value={value}
      onChange={(e) => onChange(e.target.value as ListFilter)}
    >
      <option value="all">All</option>
      <option value="tracks">Tracks</option>
      <option value="races">Races</option>
    </select>
  );
}

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

function CatalogAddBar({
  targetStatus,
  catalogTracks,
  catalogRaces,
  idsAlreadyInSectionTrack,
  idsAlreadyInSectionRace,
  busy,
  onAddTrack,
  onAddRace,
}: {
  targetStatus: "want" | "been";
  catalogTracks: CatalogTrack[];
  catalogRaces: CatalogRace[];
  idsAlreadyInSectionTrack: Set<number>;
  idsAlreadyInSectionRace: Set<number>;
  busy: boolean;
  onAddTrack: (id: number) => void;
  onAddRace: (id: number) => void;
}) {
  const [pickKind, setPickKind] = useState<"track" | "race">("track");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (pickKind === "track") {
      const list = !s
        ? catalogTracks.slice(0, 10)
        : catalogTracks.filter((t) => t.name.toLowerCase().includes(s)).slice(0, 12);
      return { kind: "track" as const, items: list };
    }
    const list = !s
      ? catalogRaces.slice(0, 10)
      : catalogRaces.filter((r) => r.name.toLowerCase().includes(s)).slice(0, 12);
    return { kind: "race" as const, items: list };
  }, [pickKind, q, catalogTracks, catalogRaces]);

  const heading = targetStatus === "want" ? "Bucket List" : "Logbook";

  return (
    <div className="border border-[var(--border)] rounded-lg p-3 sm:p-4 space-y-3 bg-[var(--secondary)]/[0.02]">
      <div className="text-sm font-medium text-[var(--secondary)]" style={{ fontFamily: "var(--font-space-grotesk)" }}>
        Add to {heading} (from catalogue)
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <select
          className="border border-[var(--border)] rounded-lg px-2 py-2 text-sm"
          value={pickKind}
          onChange={(e) => setPickKind(e.target.value as "track" | "race")}
        >
          <option value="track">Tracks</option>
          <option value="race">Races</option>
        </select>
        <input
          type="search"
          placeholder={`Search ${pickKind === "track" ? "tracks" : "races"}…`}
          className="flex-1 min-w-[180px] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <ul className="max-h-52 overflow-y-auto border border-[var(--border)] rounded-md divide-y divide-[var(--border)] text-sm">
        {filtered.kind === "track"
          ? filtered.items.map((t) => {
              const disabled = idsAlreadyInSectionTrack.has(t.id) || busy;
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    disabled={disabled}
                    className="w-full text-left px-3 py-2.5 hover:bg-[var(--primary)]/5 disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={() => onAddTrack(t.id)}
                  >
                    {t.name}
                    {t.country ? ` — ${t.country}` : ""}
                  </button>
                </li>
              );
            })
          : filtered.items.map((r) => {
              const disabled = idsAlreadyInSectionRace.has(r.id) || busy;
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    disabled={disabled}
                    className="w-full text-left px-3 py-2.5 hover:bg-[var(--primary)]/5 disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={() => onAddRace(r.id)}
                  >
                    {r.name}
                    {r.country ? ` — ${r.country}` : ""}
                  </button>
                </li>
              );
            })}
        {filtered.items.length === 0 && (
          <li className="px-3 py-3 text-[var(--secondary)]/60">No matches</li>
        )}
      </ul>
    </div>
  );
}

function useMergedItems(
  tracks: TrackRow[],
  races: RaceRow[],
  status: "want" | "been",
  filter: ListFilter
) {
  return useMemo(() => {
    const tRows = tracks.filter((t) => t.status === status && t.track);
    const rRows = races.filter((r) => r.status === status && r.race);
    const items: Array<
      | { kind: "track"; created_at: string; row: TrackRow }
      | { kind: "race"; created_at: string; row: RaceRow }
    > = [];
    if (filter === "all" || filter === "tracks") {
      tRows.forEach((row) => items.push({ kind: "track", created_at: row.created_at, row }));
    }
    if (filter === "all" || filter === "races") {
      rRows.forEach((row) => items.push({ kind: "race", created_at: row.created_at, row }));
    }
    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return items;
  }, [tracks, races, status, filter]);
}

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
  const [catalogTracks, setCatalogTracks] = useState<CatalogTrack[]>([]);
  const [catalogRaces, setCatalogRaces] = useState<CatalogRace[]>([]);
  const [wantFilter, setWantFilter] = useState<ListFilter>("all");
  const [beenFilter, setBeenFilter] = useState<ListFilter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [addBusy, setAddBusy] = useState(false);
  const [error, setError] = useState("");

  const wantItems = useMergedItems(tracks, races, "want", wantFilter);
  const beenItems = useMergedItems(tracks, races, "been", beenFilter);
  const favouriteItems = useMemo(() => {
    const items: Array<
      | { kind: "track"; created_at: string; row: TrackRow }
      | { kind: "race"; created_at: string; row: RaceRow }
    > = [];
    tracks.forEach((row) => {
      if (row.track) items.push({ kind: "track", created_at: row.created_at, row });
    });
    races.forEach((row) => {
      if (row.race) items.push({ kind: "race", created_at: row.created_at, row });
    });
    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return items;
  }, [tracks, races]);

  const wantTrackIds = useMemo(
    () => new Set(tracks.filter((t) => t.status === "want").map((t) => t.track?.id).filter(Boolean) as number[]),
    [tracks]
  );
  const wantRaceIds = useMemo(
    () => new Set(races.filter((r) => r.status === "want").map((r) => r.race?.id).filter(Boolean) as number[]),
    [races]
  );
  const beenTrackIds = useMemo(
    () => new Set(tracks.filter((t) => t.status === "been").map((t) => t.track?.id).filter(Boolean) as number[]),
    [tracks]
  );
  const beenRaceIds = useMemo(
    () => new Set(races.filter((r) => r.status === "been").map((r) => r.race?.id).filter(Boolean) as number[]),
    [races]
  );

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
      .select("id,status,created_at,track:tracks_catalog(id,slug,name,country,hero_image_url)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (tErr) throw new Error(tErr.message);

    const { data: rData, error: rErr } = await supabase
      .from("user_races")
      .select("id,status,created_at,race:races_catalog(id,slug,name,country,hero_image_url)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (rErr) throw new Error(rErr.message);

    setTracks(((tData as unknown) as TrackRow[]) ?? []);
    setRaces(((rData as unknown) as RaceRow[]) ?? []);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: t } = await supabase
        .from("tracks_catalog")
        .select("id,slug,name,country,hero_image_url")
        .order("name");
      const { data: r } = await supabase
        .from("races_catalog")
        .select("id,slug,name,country,hero_image_url")
        .order("name");
      if (!cancelled) {
        setCatalogTracks((t as CatalogTrack[]) ?? []);
        setCatalogRaces((r as CatalogRace[]) ?? []);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- supabase client is stable
  }, []);

  async function deleteTrackRow(rowId: number) {
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

  async function deleteRaceRow(rowId: number) {
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

  async function setTrackStatusByRow(rowId: number, status: "want" | "been") {
    setError("");
    setBusyId(`t-st-${rowId}`);
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

  async function setRaceStatusByRow(rowId: number, status: "want" | "been") {
    setError("");
    setBusyId(`r-st-${rowId}`);
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

  async function upsertTrackPick(trackId: number, status: "want" | "been") {
    const user = await requireUser();
    const existing = tracks.find((t) => t.track?.id === trackId);
    if (existing) {
      const { error } = await supabase.from("user_tracks").update({ status }).eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("user_tracks").insert({
        user_id: user.id,
        track_id: trackId,
        status,
      });
      if (error) throw new Error(error.message);
    }
  }

  async function upsertRacePick(raceId: number, status: "want" | "been") {
    const user = await requireUser();
    const existing = races.find((r) => r.race?.id === raceId);
    if (existing) {
      const { error } = await supabase.from("user_races").update({ status }).eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("user_races").insert({
        user_id: user.id,
        race_id: raceId,
        status,
      });
      if (error) throw new Error(error.message);
    }
  }

  async function handleAddTrack(status: "want" | "been", trackId: number) {
    setError("");
    setAddBusy(true);
    try {
      await upsertTrackPick(trackId, status);
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    } finally {
      setAddBusy(false);
    }
  }

  async function handleAddRace(status: "want" | "been", raceId: number) {
    setError("");
    setAddBusy(true);
    try {
      await upsertRacePick(raceId, status);
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    } finally {
      setAddBusy(false);
    }
  }

  function renderTrackCard(row: TrackRow, section: "want" | "been") {
    const t = row.track;
    if (!t) return null;
    const href = t.slug ? `/tracks/${t.slug}` : "#";
    const busy = busyId === `t-del-${row.id}` || busyId === `t-st-${row.id}`;
    return (
      <div key={`track-${row.id}`} className="group card overflow-hidden hover:shadow-lg transition-all relative">
        <div className="aspect-[4/3] relative bg-[var(--secondary)]/5 overflow-hidden">
          {t.slug ? (
            <Link href={href} className="block h-full">
              {t.hero_image_url ? (
                <img
                  src={t.hero_image_url}
                  alt={t.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--secondary)]/30">
                  {trackPlaceholder()}
                </div>
              )}
            </Link>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm text-[var(--primary)] px-2 text-center">
              Missing slug
            </div>
          )}
          <FavouriteHeartIconButton
            overlay
            active={isFavouritedStatus(row.status)}
            loading={busy}
            label="Remove from bucket list"
            onPress={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void deleteTrackRow(row.id);
            }}
          />
        </div>
        <div className="p-4 border-t border-[var(--border)] space-y-2">
          <Link href={href} className="font-semibold hover:text-[var(--primary)] transition-colors block line-clamp-2">
            {t.name}
            {t.country ? ` — ${t.country}` : ""}
          </Link>
          {section === "want" ? (
            <button
              type="button"
              className="btn-text text-xs"
              disabled={busy}
              onClick={() => void setTrackStatusByRow(row.id, "been")}
            >
              Move to Logbook
            </button>
          ) : (
            <button
              type="button"
              className="btn-text text-xs"
              disabled={busy}
              onClick={() => void setTrackStatusByRow(row.id, "want")}
            >
              Move to Bucket List
            </button>
          )}
        </div>
      </div>
    );
  }

  function renderRaceCard(row: RaceRow, section: "want" | "been") {
    const r = row.race;
    if (!r) return null;
    const href = r.slug ? `/races/${r.slug}` : "#";
    const busy = busyId === `r-del-${row.id}` || busyId === `r-st-${row.id}`;
    return (
      <div key={`race-${row.id}`} className="group card overflow-hidden hover:shadow-lg transition-all relative">
        <div className="aspect-[4/3] relative bg-[var(--secondary)]/5 overflow-hidden">
          {r.slug ? (
            <Link href={href} className="block h-full">
              {r.hero_image_url ? (
                <img
                  src={r.hero_image_url}
                  alt={r.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--secondary)]/30">
                  {racePlaceholder()}
                </div>
              )}
            </Link>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm text-[var(--primary)] px-2 text-center">
              Missing slug
            </div>
          )}
          <FavouriteHeartIconButton
            overlay
            active={isFavouritedStatus(row.status)}
            loading={busy}
            label="Remove from bucket list"
            onPress={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void deleteRaceRow(row.id);
            }}
          />
        </div>
        <div className="p-4 border-t border-[var(--border)] space-y-2">
          <Link href={href} className="font-semibold hover:text-[var(--primary)] transition-colors block line-clamp-2">
            {r.name}
            {r.country ? ` — ${r.country}` : ""}
          </Link>
          {section === "want" ? (
            <button
              type="button"
              className="btn-text text-xs"
              disabled={busy}
              onClick={() => void setRaceStatusByRow(row.id, "been")}
            >
              Move to Logbook
            </button>
          ) : (
            <button
              type="button"
              className="btn-text text-xs"
              disabled={busy}
              onClick={() => void setRaceStatusByRow(row.id, "want")}
            >
              Move to Bucket List
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {error && !error.toLowerCase().includes("auth session missing") && (
        <p className="text-red-600 text-sm">{error}</p>
      )}

      <section className="card p-4 sm:p-6 space-y-4">
        <h2 className="text-lg font-bold text-[var(--secondary)]" style={{ fontFamily: "var(--font-space-grotesk)" }}>
          Favourites
        </h2>
        {favouriteItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
            {favouriteItems.slice(0, 12).map((item) =>
              item.kind === "track"
                ? renderTrackCard(item.row, item.row.status)
                : renderRaceCard(item.row, item.row.status)
            )}
          </div>
        ) : (
          <p className="text-sm opacity-70">No favourites yet. Add tracks or races below.</p>
        )}
      </section>

      <section className="card p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg font-bold text-[var(--secondary)]" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            Bucket List
          </h2>
          <label className="flex items-center gap-2 text-sm text-[var(--secondary)]/80">
            <span>Show</span>
            <FilterSelect id="want-filter" value={wantFilter} onChange={setWantFilter} />
          </label>
        </div>

        <CatalogAddBar
          targetStatus="want"
          catalogTracks={catalogTracks}
          catalogRaces={catalogRaces}
          idsAlreadyInSectionTrack={wantTrackIds}
          idsAlreadyInSectionRace={wantRaceIds}
          busy={addBusy}
          onAddTrack={(id) => void handleAddTrack("want", id)}
          onAddRace={(id) => void handleAddRace("want", id)}
        />

        {wantItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
            {wantItems.map((item) =>
              item.kind === "track"
                ? renderTrackCard(item.row, "want")
                : renderRaceCard(item.row, "want")
            )}
          </div>
        ) : (
          <p className="text-sm opacity-70">Nothing here yet — add tracks or races to your bucket list from the catalogue above.</p>
        )}
      </section>

      <section className="card p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg font-bold text-[var(--secondary)]" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            Logbook
          </h2>
          <label className="flex items-center gap-2 text-sm text-[var(--secondary)]/80">
            <span>Show</span>
            <FilterSelect id="been-filter" value={beenFilter} onChange={setBeenFilter} />
          </label>
        </div>

        <CatalogAddBar
          targetStatus="been"
          catalogTracks={catalogTracks}
          catalogRaces={catalogRaces}
          idsAlreadyInSectionTrack={beenTrackIds}
          idsAlreadyInSectionRace={beenRaceIds}
          busy={addBusy}
          onAddTrack={(id) => void handleAddTrack("been", id)}
          onAddRace={(id) => void handleAddRace("been", id)}
        />

        {beenItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
            {beenItems.map((item) =>
              item.kind === "track"
                ? renderTrackCard(item.row, "been")
                : renderRaceCard(item.row, "been")
            )}
          </div>
        ) : (
          <p className="text-sm opacity-70">Nothing here yet — add tracks or races you have already visited.</p>
        )}
      </section>
    </div>
  );
}
