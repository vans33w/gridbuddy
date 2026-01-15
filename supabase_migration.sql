-- Migration: Create sustainability guides tables for tracks and races
-- These tables store location-specific and event-specific sustainability information

-- Track Sustainability Guides (permanent track facilities)
CREATE TABLE IF NOT EXISTS track_sustainability_guides (
  id BIGSERIAL PRIMARY KEY,
  track_id BIGINT NOT NULL REFERENCES tracks_catalog(id) ON DELETE CASCADE,
  top_tips JSONB, -- Array of strings: ["Tip 1", "Tip 2", ...]
  public_transport_access TEXT,
  distance_from_nearest_city TEXT,
  bike_access_bike_parking TEXT,
  ev_charging_availability TEXT,
  renewable_energy_use TEXT,
  water_refill_stations TEXT,
  sustainability_certifications TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(track_id)
);

-- Race Sustainability Guides (event-specific)
CREATE TABLE IF NOT EXISTS race_sustainability_guides (
  id BIGSERIAL PRIMARY KEY,
  race_id BIGINT NOT NULL REFERENCES races_catalog(id) ON DELETE CASCADE,
  top_tips JSONB, -- Array of strings: ["Tip 1", "Tip 2", ...]
  spectator_travel_options TEXT,
  shuttle_park_and_ride TEXT,
  temporary_infrastructure_scale TEXT,
  power_sources_race_weekend TEXT,
  plant_based_food_availability TEXT,
  recycling_during_event TEXT,
  water_refill_stations_race_weekend TEXT,
  public_sustainability_commitments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(race_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_track_sustainability_guides_track_id ON track_sustainability_guides(track_id);
CREATE INDEX IF NOT EXISTS idx_race_sustainability_guides_race_id ON race_sustainability_guides(race_id);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_track_sustainability_guides_updated_at
  BEFORE UPDATE ON track_sustainability_guides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_race_sustainability_guides_updated_at
  BEFORE UPDATE ON race_sustainability_guides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Migration: Add track_id and race_id columns to moments table
-- This allows moments to be linked to specific tracks or races

-- Add track_id column to moments table (nullable, optional reference)
ALTER TABLE moments
ADD COLUMN IF NOT EXISTS track_id BIGINT REFERENCES tracks_catalog(id) ON DELETE SET NULL;

-- Add race_id column to moments table (nullable, optional reference)
ALTER TABLE moments
ADD COLUMN IF NOT EXISTS race_id BIGINT REFERENCES races_catalog(id) ON DELETE SET NULL;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_moments_track_id ON moments(track_id);
CREATE INDEX IF NOT EXISTS idx_moments_race_id ON moments(race_id);

-- Example inserts (you can add more via Supabase dashboard or API):

-- Track example:
-- INSERT INTO track_sustainability_guides (track_id, top_tips, public_transport_access, distance_from_nearest_city, bike_access_bike_parking, ev_charging_availability, renewable_energy_use, water_refill_stations, sustainability_certifications)
-- VALUES (
--   1, -- Replace with actual track_id
--   '["Take the train from London", "Use the free shuttle bus", "Bring a reusable water bottle"]'::jsonb,
--   'Direct train service from London to Silverstone station, then free shuttle bus to track.',
--   'Approximately 100km from London',
--   'Free bicycle parking available. Cycle paths connect from nearby towns.',
--   'EV charging stations available in main parking areas.',
--   'Track uses 100% renewable energy for facilities.',
--   'Water refill stations located throughout the venue.',
--   'ISO 14001 Environmental Management certified.'
-- );

-- Race example:
-- INSERT INTO race_sustainability_guides (race_id, top_tips, spectator_travel_options, shuttle_park_and_ride, temporary_infrastructure_scale, power_sources_race_weekend, plant_based_food_availability, recycling_during_event, water_refill_stations_race_weekend, public_sustainability_commitments)
-- VALUES (
--   1, -- Replace with actual race_id
--   '["Book park-and-ride in advance", "Use public transport", "Bring reusable containers"]'::jsonb,
--   'Enhanced train services on race weekend. Shuttle buses from station to circuit.',
--   'Park-and-ride available from multiple locations. Book online in advance.',
--   'Temporary grandstands and facilities use modular, reusable structures.',
--   'All temporary power from renewable sources. Solar panels on hospitality units.',
--   'Plant-based food options available at all food vendors.',
--   'Comprehensive recycling program with clearly marked bins throughout venue.',
--   'Additional water refill stations installed for race weekend.',
--   'Race organizers committed to carbon-neutral event by 2025.'
-- );