-- Query all active tournaments
SELECT id, name, tournament_type, team_type, is_active 
FROM tournaments 
WHERE is_active = true
ORDER BY name;