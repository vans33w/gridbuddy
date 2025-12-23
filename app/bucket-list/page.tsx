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
    .select("id,status,track:tracks_catalog(id,slug,name,country)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (trackErr) throw new Error(trackErr.message);

  const { data: raceRows, error: raceErr } = await supabase
    .from("user_races")
    .select("id,status,race:races_catalog(id,slug,name,country)")
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
        <h1 className="text-2xl font-bold">My Bucket List</h1>
        <p className="text-sm opacity-70">
          Edit Want/Been here directly (no need to go back to Tracks/Races).
        </p>
      </div>

      <PicksClient initialTracks={initialTracks} initialRaces={initialRaces} />
      <GoalsClient initialGoals={initialGoals} />
      <EventsClient userId={user.id} />
    </main>
  );
}
