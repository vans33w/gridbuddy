-- Migration: Create track_sustainability_guides table
-- This table stores location-specific sustainability information for tracks

CREATE TABLE IF NOT EXISTS track_sustainability_guides (
  id BIGSERIAL PRIMARY KEY,
  track_id BIGINT NOT NULL REFERENCES tracks_catalog(id) ON DELETE CASCADE,
  routes TEXT,
  transit_tips TEXT,
  avoid_section TEXT,
  checklist JSONB, -- Array of strings: ["Item 1", "Item 2", ...]
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(track_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_track_sustainability_guides_track_id ON track_sustainability_guides(track_id);

-- Add updated_at trigger
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

-- Example insert (you can add more via Supabase dashboard or API):
-- INSERT INTO track_sustainability_guides (track_id, routes, transit_tips, avoid_section, checklist)
-- VALUES (
--   1, -- Replace with actual track_id
--   'Take the train from London to Silverstone station, then use the free shuttle bus.',
--   'The track offers free bicycle parking. Consider cycling from nearby towns.',
--   'Avoid driving during peak race weekends. Parking is limited and expensive.',
--   '["Book train tickets in advance", "Bring a reusable water bottle", "Use public transport on race day"]'::jsonb
-- );

