import { supabaseServer } from "../../lib/supabase/server";

type TrackSustainabilityGuide = {
  id: number;
  track_id: number;
  top_tips: string[] | null;
  public_transport_access: string | null;
  distance_from_nearest_city: string | null;
  bike_access_bike_parking: string | null;
  ev_charging_availability: string | null;
  renewable_energy_use: string | null;
  water_refill_stations: string | null;
  sustainability_certifications: string | null;
};

type TrackSustainabilityGuideProps = {
  trackId: number;
};

export default async function TrackSustainabilityGuide({
  trackId,
}: TrackSustainabilityGuideProps) {
  const supabase = await supabaseServer();

  const { data: guide, error } = await supabase
    .from("track_sustainability_guides")
    .select("*")
    .eq("track_id", trackId)
    .maybeSingle();

  if (error || !guide) {
    return null;
  }

  const guideData = guide as TrackSustainabilityGuide;

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
    guideData.public_transport_access ||
    guideData.distance_from_nearest_city ||
    guideData.bike_access_bike_parking ||
    guideData.ev_charging_availability ||
    guideData.renewable_energy_use ||
    guideData.water_refill_stations ||
    guideData.sustainability_certifications;

  if (!hasContent) {
    return null;
  }

  return (
    <div className="card p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Sustainability Guide</h2>
        <p className="text-sm opacity-80">
          Track-specific sustainability information and facilities
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

      {guideData.public_transport_access && (
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Public Transport Access</h3>
          <div className="text-sm opacity-90 whitespace-pre-wrap">
            {guideData.public_transport_access}
          </div>
        </div>
      )}

      {guideData.distance_from_nearest_city && (
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Distance from Nearest City</h3>
          <div className="text-sm opacity-90">{guideData.distance_from_nearest_city}</div>
        </div>
      )}

      {guideData.bike_access_bike_parking && (
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Bike Access / Bike Parking</h3>
          <div className="text-sm opacity-90 whitespace-pre-wrap">
            {guideData.bike_access_bike_parking}
          </div>
        </div>
      )}

      {guideData.ev_charging_availability && (
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">EV Charging Availability</h3>
          <div className="text-sm opacity-90 whitespace-pre-wrap">
            {guideData.ev_charging_availability}
          </div>
        </div>
      )}

      {guideData.renewable_energy_use && (
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Renewable Energy Use</h3>
          <div className="text-sm opacity-90 whitespace-pre-wrap">
            {guideData.renewable_energy_use}
          </div>
        </div>
      )}

      {guideData.water_refill_stations && (
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Water Refill Stations</h3>
          <div className="text-sm opacity-90 whitespace-pre-wrap">
            {guideData.water_refill_stations}
          </div>
        </div>
      )}

      {guideData.sustainability_certifications && (
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Sustainability Certifications</h3>
          <div className="text-sm opacity-90 whitespace-pre-wrap bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            {guideData.sustainability_certifications}
          </div>
        </div>
      )}
    </div>
  );
}
