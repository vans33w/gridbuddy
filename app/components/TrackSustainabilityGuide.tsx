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

  // Parse top_tips - handle JSONB, JSON string, or plain text
  let topTipsText: string | null = null;
  if (guideData.top_tips) {
    try {
      if (typeof guideData.top_tips === "string") {
        // Try to parse as JSON first
        try {
          const parsed = JSON.parse(guideData.top_tips);
          if (Array.isArray(parsed)) {
            topTipsText = parsed.join("\n\n");
          } else if (typeof parsed === "string") {
            topTipsText = parsed;
          }
        } catch {
          // If parsing fails, treat as plain text
          topTipsText = guideData.top_tips;
        }
      } else if (Array.isArray(guideData.top_tips)) {
        // Already an array from JSONB
        topTipsText = guideData.top_tips.join("\n\n");
      } else if (typeof guideData.top_tips === "object") {
        // Handle object case
        topTipsText = JSON.stringify(guideData.top_tips);
      }
    } catch {
      topTipsText = null;
    }
  }

  const hasContent =
    topTipsText ||
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

      {topTipsText && (
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Top Tips</h3>
          <div className="text-sm opacity-90 whitespace-pre-wrap">
            {topTipsText}
          </div>
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
