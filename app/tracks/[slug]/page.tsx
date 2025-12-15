import Link from "next/link";
import { supabaseServer } from "../../../lib/supabase/server";

export default async function TrackDetailBySlugPage(props: any) {
  const p = await Promise.resolve(props.params);
  const slug = p?.slug ? String(p.slug) : "";

  if (!slug) {
    return (
      <main className="p-6 space-y-3">
        <p className="font-semibold">Invalid track slug.</p>
        <Link className="underline" href="/tracks">Back to Tracks</Link>
      </main>
    );
  }

  const supabase = await supabaseServer();

  const { data: track, error: trackErr } = await supabase
    .from("tracks_catalog")
    .select("id,slug,name,country,city,length_km,turns,lap_record,website,hero_image_url")
    .eq("slug", slug)
    .single();

  if (trackErr || !track) {
    return (
      <main className="p-6 space-y-3">
        <p>Track not found.</p>
        <Link className="underline" href="/tracks">Back to Tracks</Link>
      </main>
    );
  }

  const { data: pop } = await supabase
    .from("track_popularity")
    .select("total_picks,want_picks,been_picks")
    .eq("track_id", track.id)
    .maybeSingle();

  return (
    <main className="p-6 space-y-4 max-w-2xl">
      <Link className="underline" href="/tracks">← Back to Tracks</Link>

      <h1 className="text-3xl font-bold">
        {track.name} {track.country ? `— ${track.country}` : ""}
      </h1>

      {track.hero_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={track.hero_image_url} alt={track.name} className="w-full border" />
      )}

      <div className="border p-4 space-y-1">
        <div className="font-semibold">Track details</div>
        <div className="text-sm opacity-80">City: {track.city ?? "—"}</div>
        <div className="text-sm opacity-80">Length (km): {track.length_km ?? "—"}</div>
        <div className="text-sm opacity-80">Turns: {track.turns ?? "—"}</div>
        <div className="text-sm opacity-80">Lap record: {track.lap_record ?? "—"}</div>
        <div className="text-sm opacity-80">
          Website:{" "}
          {track.website ? (
            <a className="underline" href={track.website} target="_blank">
              Open
            </a>
          ) : (
            "—"
          )}
        </div>
      </div>

      <div className="border p-4 space-y-1">
        <div className="font-semibold">Popularity</div>
        <div className="text-sm opacity-80">Total picks: {pop?.total_picks ?? 0}</div>
        <div className="text-sm opacity-80">
          Want: {pop?.want_picks ?? 0} • Been: {pop?.been_picks ?? 0}
        </div>
      </div>
    </main>
  );
}
