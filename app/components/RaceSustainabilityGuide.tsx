import { supabaseServer } from "../../lib/supabase/server";

type RaceSustainabilityGuide = {
  id: number;
  race_id: number;
  top_tips: string[] | null;
  spectator_travel_options: string | null;
  shuttle_park_and_ride: string | null;
  temporary_infrastructure_scale: string | null;
  power_sources_race_weekend: string | null;
  plant_based_food_availability: string | null;
  recycling_during_event: string | null;
  water_refill_stations_race_weekend: string | null;
  public_sustainability_commitments: string | null;
};

type RaceSustainabilityGuideProps = {
  raceId: number;
};

export default async function RaceSustainabilityGuide({
  raceId,
}: RaceSustainabilityGuideProps) {
  const supabase = await supabaseServer();

  const { data: guide, error } = await supabase
    .from("race_sustainability_guides")
    .select("*")
    .eq("race_id", raceId)
    .maybeSingle();

  if (error || !guide) {
    return null;
  }

  const guideData = guide as RaceSustainabilityGuide;

  // Parse top_tips if it's a JSON string
  let topTips: string[] = [];
  if (guideData.top_tips) {
    try {
      topTips =
        typeof guideData.top_tips === "string"
          ? JSON.parse(guideData.top_tips)
          : guideData.top_tips;
    } catch {
      topTips = [];
    }
  }

  const hasContent =
    topTips.length > 0 ||
    guideData.spectator_travel_options ||
    guideData.shuttle_park_and_ride ||
    guideData.temporary_infrastructure_scale ||
    guideData.power_sources_race_weekend ||
    guideData.plant_based_food_availability ||
    guideData.recycling_during_event ||
    guideData.water_refill_stations_race_weekend ||
    guideData.public_sustainability_commitments;

  if (!hasContent) {
    return null;
  }

  return (
    <div className="card p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Sustainability Guide</h2>
        <p className="text-sm opacity-80">
          Event-specific sustainability information for this race
        </p>
      </div>

      {topTips.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Top Tips</h3>
          <ul className="space-y-2">
            {topTips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                <span className="opacity-90">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {guideData.spectator_travel_options && (
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Typical Spectator Travel Options</h3>
          <div className="text-sm opacity-90 whitespace-pre-wrap">
            {guideData.spectator_travel_options}
          </div>
        </div>
      )}

      {guideData.shuttle_park_and_ride && (
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Shuttle or Park-and-Ride Services</h3>
          <div className="text-sm opacity-90 whitespace-pre-wrap">
            {guideData.shuttle_park_and_ride}
          </div>
        </div>
      )}

      {guideData.temporary_infrastructure_scale && (
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Temporary Infrastructure Scale</h3>
          <div className="text-sm opacity-90 whitespace-pre-wrap">
            {guideData.temporary_infrastructure_scale}
          </div>
        </div>
      )}

      {guideData.power_sources_race_weekend && (
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Power Sources During Race Weekend</h3>
          <div className="text-sm opacity-90 whitespace-pre-wrap">
            {guideData.power_sources_race_weekend}
          </div>
        </div>
      )}

      {guideData.plant_based_food_availability && (
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Plant-Based Food Availability</h3>
          <div className="text-sm opacity-90 whitespace-pre-wrap">
            {guideData.plant_based_food_availability}
          </div>
        </div>
      )}

      {guideData.recycling_during_event && (
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Recycling During the Event</h3>
          <div className="text-sm opacity-90 whitespace-pre-wrap">
            {guideData.recycling_during_event}
          </div>
        </div>
      )}

      {guideData.water_refill_stations_race_weekend && (
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Water Refill Stations During Race Weekend</h3>
          <div className="text-sm opacity-90 whitespace-pre-wrap">
            {guideData.water_refill_stations_race_weekend}
          </div>
        </div>
      )}

      {guideData.public_sustainability_commitments && (
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Public Sustainability Commitments</h3>
          <div className="text-sm opacity-90 whitespace-pre-wrap bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            {guideData.public_sustainability_commitments}
          </div>
        </div>
      )}
    </div>
  );
}
