import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "../../lib/supabase/server";
import GoalsClient from "./GoalsClient";

type TrackJoin = { id: number; slug: string | null; name: string; country: string | null };
type RaceJoin = { id: number; slug: string | null; name: string; country: string | null };

type TrackRow = { id: number; status: "want" | "been"; track: TrackJoin | null };
type RaceRow = { id: number; status: "want" | "been"; race: RaceJoin | null };

type GoalRow = {
  id: number;
  title: string;
  status: "in_progress" | "achieved";
  created_at: string;
  achieved_at: string | null;
};

export default async function BucketListPage() {
  const supabase = await supabaseServer();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const { data: trackRows, error: trackErr } = await supabase
    .from("user_tracks")
    .select("id,status,track:tracks_catalog(id,slug,name,country)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (trackErr) {
    return (
      <main className="space-y-3">
        <h1 className="text-2xl font-bold">My Bucket List</h1>
        <p className="text-red-600 text-sm">{trackErr.message}</p>
        <Link className="underline" href="/">
          Back home
        </Link>
      </main>
    );
  }

  const { data: raceRows, error: raceErr } = await supabase
    .from("user_races")
    .select("id,status,race:races_catalog(id,slug,name,country)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (raceErr) {
    return (
      <main className="space-y-3">
        <h1 className="text-2xl font-bold">My Bucket List</h1>
        <p className="text-red-600 text-sm">{raceErr.message}</p>
        <Link className="underline" href="/">
          Back home
        </Link>
      </main>
    );
  }

  const { data: goals, error: goalsErr } = await supabase
    .from("goals")
    .select("id,title,status,created_at,achieved_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (goalsErr) {
    return (
      <main className="space-y-3">
        <h1 className="text-2xl font-bold">My Bucket List</h1>
        <p className="text-red-600 text-sm">{goalsErr.message}</p>
        <Link className="underline" href="/">
          Back home
        </Link>
      </main>
    );
  }

  const tracks = (trackRows as unknown as TrackRow[]) ?? [];
  const races = (raceRows as unknown as RaceRow[]) ?? [];
  const initialGoals = (goals as unknown as GoalRow[]) ?? [];

  const tracksWant = tracks.filter((t) => t.status === "want");
  const tracksBeen = tracks.filter((t) => t.status === "been");

  const racesWant = races.filter((r) => r.status === "want");
  const racesBeen = races.filter((r) => r.status === "been");

  return (
    <main className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">My Bucket List</h1>
        <p className="text-sm opacity-70">Your Want/Been picks + motorsport goals.</p>
      </div>

      <section className="border rounded-xl p-4 space-y-3">
        <div className="font-semibold">Tracks</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-3 space-y-2">
            <div className="font-medium">Want to go</div>
            {tracksWant.map((t) => (
              <div key={t.id} className="text-sm">
                {t.track?.slug ? (
                  <Link className="underline" href={`/tracks/${t.track.slug}`}>
                    {t.track.name}
                    {t.track.country ? ` — ${t.track.country}` : ""}
                  </Link>
                ) : (
                  <span className="text-red-600">Missing track</span>
                )}
              </div>
            ))}
            {tracksWant.length === 0 && <div className="text-sm opacity-70">None yet.</div>}
          </div>

          <div className="border rounded-lg p-3 space-y-2">
            <div className="font-medium">Been</div>
            {tracksBeen.map((t) => (
              <div key={t.id} className="text-sm">
                {t.track?.slug ? (
                  <Link className="underline" href={`/tracks/${t.track.slug}`}>
                    {t.track.name}
                    {t.track.country ? ` — ${t.track.country}` : ""}
                  </Link>
                ) : (
                  <span className="text-red-600">Missing track</span>
                )}
              </div>
            ))}
            {tracksBeen.length === 0 && <div className="text-sm opacity-70">None yet.</div>}
          </div>
        </div>
      </section>

      <section className="border rounded-xl p-4 space-y-3">
        <div className="font-semibold">Races</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-3 space-y-2">
            <div className="font-medium">Want to go</div>
            {racesWant.map((r) => (
              <div key={r.id} className="text-sm">
                {r.race?.slug ? (
                  <Link className="underline" href={`/races/${r.race.slug}`}>
                    {r.race.name}
                    {r.race.country ? ` — ${r.race.country}` : ""}
                  </Link>
                ) : (
                  <span className="text-red-600">Missing race</span>
                )}
              </div>
            ))}
            {racesWant.length === 0 && <div className="text-sm opacity-70">None yet.</div>}
          </div>

          <div className="border rounded-lg p-3 space-y-2">
            <div className="font-medium">Been</div>
            {racesBeen.map((r) => (
              <div key={r.id} className="text-sm">
                {r.race?.slug ? (
                  <Link className="underline" href={`/races/${r.race.slug}`}>
                    {r.race.name}
                    {r.race.country ? ` — ${r.race.country}` : ""}
                  </Link>
                ) : (
                  <span className="text-red-600">Missing race</span>
                )}
              </div>
            ))}
            {racesBeen.length === 0 && <div className="text-sm opacity-70">None yet.</div>}
          </div>
        </div>
      </section>

      <GoalsClient initialGoals={initialGoals} />
    </main>
  );
}
