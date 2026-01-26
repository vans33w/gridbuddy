-- Migration: Remove unused columns from race_sustainability_guides table
-- Keep only: top_tips, spectator_travel_options, public_sustainability_commitments

-- Drop columns that are no longer needed
ALTER TABLE race_sustainability_guides
DROP COLUMN IF EXISTS shuttle_park_and_ride;

ALTER TABLE race_sustainability_guides
DROP COLUMN IF EXISTS temporary_infrastructure_scale;

ALTER TABLE race_sustainability_guides
DROP COLUMN IF EXISTS power_sources_race_weekend;

ALTER TABLE race_sustainability_guides
DROP COLUMN IF EXISTS plant_based_food_availability;

ALTER TABLE race_sustainability_guides
DROP COLUMN IF EXISTS recycling_during_event;

ALTER TABLE race_sustainability_guides
DROP COLUMN IF EXISTS water_refill_stations_race_weekend;
