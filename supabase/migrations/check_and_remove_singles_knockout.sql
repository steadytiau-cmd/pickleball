-- Check all tournaments and remove Singles Knockout Cup if it exists

-- First, let's see all tournaments
SELECT id, name, tournament_type, team_type, is_active 
FROM tournaments 
ORDER BY name;

-- Delete Singles Knockout Cup tournament if it exists
DELETE FROM tournaments 
WHERE name = 'Singles Knockout Cup';

-- Show remaining tournaments after deletion
SELECT id, name, tournament_type, team_type, is_active 
FROM tournaments 
ORDER BY name;