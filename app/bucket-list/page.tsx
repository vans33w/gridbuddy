import { redirect } from "next/navigation";
import { supabaseServer } from "../../lib/supabase/server";
import PicksClient, { RaceRow, TrackRow } from "./PicksClient";
import GoalsClient from "./GoalsClient";
import EventsClient from "../components/EventsClient";

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
    .select("id,status,created_at,track:tracks_catalog(id,slug,name,country,hero_image_url)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (trackErr) throw new Error(trackErr.message);

  const { data: raceRows, error: raceErr } = await supabase
    .from("user_races")
    .select("id,status,created_at,race:races_catalog(id,slug,name,country,hero_image_url)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (raceErr) throw new Error(raceErr.message);

  const { data: goals, error: goalsErr } = await supabase
    .from("goals")
    .select("id,title,status,created_at,achieved_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (goalsErr) throw new Error(goalsErr.message);

  const initialTracks = (trackRows as unknown as TrackRow[]) ?? [];
  const initialRaces = (raceRows as unknown as RaceRow[]) ?? [];
  const initialGoals = (goals as unknown as GoalRow[]) ?? [];

  return (
    <main className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-space-grotesk)" }}>
          My Bucket List
        </h1>
        <p className="text-sm text-[var(--secondary)]/70">
          Want To Go and Been — add tracks and races from the catalogue (no typing). Use the heart on each card to remove.
        </p>
      </div>

      <PicksClient initialTracks={initialTracks} initialRaces={initialRaces} />
      <GoalsClient initialGoals={initialGoals} />
      <EventsClient userId={user.id} />
    </main>
  );
}
