-- Migration: Add track_id and race_id columns to moments table
-- This allows moments to be linked to specific tracks or races
-- Run this migration in your Supabase SQL editor

-- Add track_id column to moments table (nullable, optional reference)
ALTER TABLE moments
ADD COLUMN IF NOT EXISTS track_id BIGINT REFERENCES tracks_catalog(id) ON DELETE SET NULL;

-- Add race_id column to moments table (nullable, optional reference)
ALTER TABLE moments
ADD COLUMN IF NOT EXISTS race_id BIGINT REFERENCES races_catalog(id) ON DELETE SET NULL;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_moments_track_id ON moments(track_id);
CREATE INDEX IF NOT EXISTS idx_moments_race_id ON moments(race_id);
