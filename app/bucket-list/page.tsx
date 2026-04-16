import { redirect } from "next/navigation";
import { supabaseServer } from "../../lib/supabase/server";
import PicksClient, { RaceRow, TrackRow } from "./PicksClient";
import EventsClient from "../components/EventsClient";

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

  const initialTracks = (trackRows as unknown as TrackRow[]) ?? [];
  const initialRaces = (raceRows as unknown as RaceRow[]) ?? [];

  return (
    <main className="space-y-8">
      <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-space-grotesk)" }}>
        My Profile
      </h1>

      <PicksClient initialTracks={initialTracks} initialRaces={initialRaces} />
      <EventsClient userId={user.id} />
    </main>
  );
}
