-- Optional: normalize legacy "been" picks to the same status used for favourites ("want").
-- Popularity views that split want/been will then show all favourites under want_picks.
-- Run once in Supabase SQL editor after deploying the app changes.

UPDATE user_tracks SET status = 'want' WHERE status = 'been';
UPDATE user_races SET status = 'want' WHERE status = 'been';
