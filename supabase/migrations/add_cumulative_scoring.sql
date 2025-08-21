-- Add cumulative scoring view for teams
-- This view calculates total scores across all matches for each team

CREATE OR REPLACE VIEW team_cumulative_scores AS
SELECT 
    t.id as team_id,
    t.name as team_name,
    t.group_id,
    t.team_type,
    COALESCE(SUM(CASE WHEN m.team1_id = t.id THEN m.team1_score ELSE 0 END), 0) +
    COALESCE(SUM(CASE WHEN m.team2_id = t.id THEN m.team2_score ELSE 0 END), 0) as total_score,
    COUNT(CASE WHEN (m.team1_id = t.id OR m.team2_id = t.id) AND m.match_status = 'completed' THEN 1 END) as matches_played,
    COUNT(CASE WHEN m.winner_id = t.id THEN 1 END) as wins,
    COUNT(CASE WHEN (m.team1_id = t.id OR m.team2_id = t.id) AND m.match_status = 'completed' AND m.winner_id != t.id THEN 1 END) as losses
FROM teams t
LEFT JOIN matches m ON (m.team1_id = t.id OR m.team2_id = t.id) AND m.match_status = 'completed'
WHERE t.is_active = true
GROUP BY t.id, t.name, t.group_id, t.team_type
ORDER BY total_score DESC, wins DESC;

-- Grant permissions
GRANT SELECT ON team_cumulative_scores TO anon;
GRANT SELECT ON team_cumulative_scores TO authenticated;