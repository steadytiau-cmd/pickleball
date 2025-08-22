-- Clear all teams data
DELETE FROM teams WHERE is_active = true;

-- Reset the sequence for teams id
SELECT setval('teams_id_seq', 1, false);