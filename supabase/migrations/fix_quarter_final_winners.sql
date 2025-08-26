-- Fix winner_id for completed quarter-final matches
-- This migration adds the missing winner_id based on the scores

-- Update winner_id for mixed doubles elimination tournament quarter-finals
UPDATE matches 
SET winner_id = CASE 
    WHEN team1_score > team2_score THEN team1_id
    WHEN team2_score > team1_score THEN team2_id
    ELSE NULL
END
WHERE tournament_id IN (
    SELECT id FROM tournaments WHERE name = '混双淘汰赛' AND tournament_type = 'elimination'
)
AND match_round = 'quarter_final'
AND match_status = 'completed'
AND winner_id IS NULL;

-- Update winner_id for singles knockout cup quarter-finals
UPDATE matches 
SET winner_id = CASE 
    WHEN team1_score > team2_score THEN team1_id
    WHEN team2_score > team1_score THEN team2_id
    ELSE NULL
END
WHERE tournament_id IN (
    SELECT id FROM tournaments WHERE name = 'Singles Knockout Cup' AND tournament_type = 'elimination'
)
AND match_round = 'quarter_final'
AND match_status = 'completed'
AND winner_id IS NULL;

-- Verify the updates
SELECT 
    t.name as tournament_name,
    m.match_round,
    m.team1_score,
    m.team2_score,
    m.winner_id,
    CASE 
        WHEN m.winner_id = m.team1_id THEN 'Team 1 wins'
        WHEN m.winner_id = m.team2_id THEN 'Team 2 wins'
        ELSE 'No winner set'
    END as winner_status
FROM matches m
JOIN tournaments t ON m.tournament_id = t.id
WHERE t.tournament_type = 'elimination'
AND m.match_round = 'quarter_final'
AND m.match_status = 'completed'
ORDER BY t.name, m.id;