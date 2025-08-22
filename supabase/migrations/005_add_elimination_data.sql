-- Add elimination tournament data using existing teams

-- Insert elimination tournaments
INSERT INTO tournaments (name, tournament_type, team_type, start_date, end_date, is_active, created_at) VALUES
('混双淘汰赛', 'elimination', 'mixed', '2024-01-21', '2024-01-25', true, NOW()),
('Singles Knockout Cup', 'elimination', 'mens', '2024-01-28', '2024-02-01', true, NOW());

-- Insert elimination matches using existing team IDs
-- Get the tournament IDs and available team IDs dynamically
DO $$
DECLARE
    mixed_tournament_id INTEGER;
    singles_tournament_id INTEGER;
    team_ids INTEGER[];
BEGIN
    -- Get the tournament IDs
    SELECT id INTO mixed_tournament_id FROM tournaments WHERE name = '混双淘汰赛';
    SELECT id INTO singles_tournament_id FROM tournaments WHERE name = 'Singles Knockout Cup';
    
    -- Get available team IDs (first 16 teams)
    SELECT ARRAY(SELECT id FROM teams ORDER BY id LIMIT 16) INTO team_ids;
    
    -- Only proceed if we have enough teams
    IF array_length(team_ids, 1) >= 16 THEN
        -- Insert matches for 混双淘汰赛
        INSERT INTO matches (tournament_id, team1_id, team2_id, match_status, match_round, team1_score, team2_score, scheduled_time, created_at) VALUES
        -- Quarter-finals
        (mixed_tournament_id, team_ids[1], team_ids[2], 'completed', 'quarter_final', 21, 17, '2024-01-21 09:00:00', NOW()),
        (mixed_tournament_id, team_ids[3], team_ids[4], 'completed', 'quarter_final', 19, 21, '2024-01-21 09:30:00', NOW()),
        (mixed_tournament_id, team_ids[5], team_ids[6], 'completed', 'quarter_final', 21, 15, '2024-01-21 10:00:00', NOW()),
        (mixed_tournament_id, team_ids[7], team_ids[8], 'completed', 'quarter_final', 18, 21, '2024-01-21 10:30:00', NOW()),
        
        -- Semi-finals (winners from quarter-finals)
        (mixed_tournament_id, team_ids[1], team_ids[4], 'completed', 'semi_final', 21, 19, '2024-01-22 14:00:00', NOW()),
        (mixed_tournament_id, team_ids[5], team_ids[8], 'in_progress', 'semi_final', 15, 12, '2024-01-22 14:30:00', NOW()),
        
        -- Final
        (mixed_tournament_id, team_ids[1], team_ids[5], 'scheduled', 'final', 0, 0, '2024-01-23 16:00:00', NOW()),
        
        -- Singles Knockout Cup matches
        -- Quarter-finals
        (singles_tournament_id, team_ids[9], team_ids[10], 'completed', 'quarter_final', 21, 16, '2024-01-28 09:00:00', NOW()),
        (singles_tournament_id, team_ids[11], team_ids[12], 'completed', 'quarter_final', 18, 21, '2024-01-28 09:30:00', NOW()),
        (singles_tournament_id, team_ids[13], team_ids[14], 'in_progress', 'quarter_final', 20, 18, '2024-01-28 10:00:00', NOW()),
        (singles_tournament_id, team_ids[15], team_ids[16], 'scheduled', 'quarter_final', 0, 0, '2024-01-28 10:30:00', NOW()),
        
        -- Semi-finals
        (singles_tournament_id, team_ids[9], team_ids[12], 'scheduled', 'semi_final', 0, 0, '2024-01-29 14:00:00', NOW()),
        (singles_tournament_id, team_ids[13], team_ids[15], 'scheduled', 'semi_final', 0, 0, '2024-01-29 14:30:00', NOW()),
        
        -- Final
        (singles_tournament_id, team_ids[9], team_ids[13], 'scheduled', 'final', 0, 0, '2024-01-30 16:00:00', NOW());
    END IF;
END $$;

-- Ensure permissions are granted
GRANT SELECT ON tournaments TO anon;
GRANT SELECT ON matches TO anon;
GRANT ALL PRIVILEGES ON tournaments TO authenticated;
GRANT ALL PRIVILEGES ON matches TO authenticated;