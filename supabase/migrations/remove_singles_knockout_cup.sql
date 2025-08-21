-- Remove Singles Knockout Cup tournament and related matches

-- First, delete all matches related to Singles Knockout Cup
DELETE FROM matches 
WHERE tournament_id IN (
    SELECT id FROM tournaments WHERE name = 'Singles Knockout Cup'
);

-- Then delete the tournament itself
DELETE FROM tournaments 
WHERE name = 'Singles Knockout Cup';

-- Verify the deletion
SELECT id, name, tournament_type, team_type 
FROM tournaments 
WHERE is_active = true
ORDER BY name;