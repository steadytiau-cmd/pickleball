-- Insert sample matches
-- Note: Team IDs start from 1 and increment sequentially
-- Group A: teams 1-4, Group B: teams 5-8, Group C: teams 9-12, 
-- Group D: teams 13-16, Group E: teams 17-20, Group F: teams 21-28

INSERT INTO matches (tournament_id, team1_id, team2_id, match_status, match_round, team1_score, team2_score, scheduled_time, created_at) VALUES
-- Group Stage matches (tournament_id = 1)
-- Group A matches
(1, 1, 2, 'completed', 'qualification', 21, 18, '2024-01-15 09:00:00', NOW()),
(1, 3, 4, 'completed', 'qualification', 19, 21, '2024-01-15 09:30:00', NOW()),
(1, 1, 3, 'in_progress', 'qualification', 15, 12, '2024-01-15 10:00:00', NOW()),
(1, 2, 4, 'scheduled', 'qualification', 0, 0, '2024-01-15 10:30:00', NOW()),

-- Group B matches
(1, 5, 6, 'completed', 'qualification', 21, 16, '2024-01-15 11:00:00', NOW()),
(1, 7, 8, 'completed', 'qualification', 18, 21, '2024-01-15 11:30:00', NOW()),
(1, 5, 7, 'in_progress', 'qualification', 10, 8, '2024-01-15 12:00:00', NOW()),
(1, 6, 8, 'scheduled', 'qualification', 0, 0, '2024-01-15 12:30:00', NOW()),

-- Group C matches
(1, 9, 10, 'completed', 'qualification', 21, 19, '2024-01-15 13:00:00', NOW()),
(1, 11, 12, 'completed', 'qualification', 21, 14, '2024-01-15 13:30:00', NOW()),
(1, 9, 11, 'scheduled', 'qualification', 0, 0, '2024-01-15 14:00:00', NOW()),
(1, 10, 12, 'scheduled', 'qualification', 0, 0, '2024-01-15 14:30:00', NOW()),

-- Group D matches
(1, 13, 14, 'completed', 'qualification', 21, 13, '2024-01-15 15:00:00', NOW()),
(1, 15, 16, 'completed', 'qualification', 16, 21, '2024-01-15 15:30:00', NOW()),

-- Group E matches
(1, 17, 18, 'completed', 'qualification', 21, 17, '2024-01-15 16:00:00', NOW()),
(1, 19, 20, 'in_progress', 'qualification', 18, 15, '2024-01-15 16:30:00', NOW()),

-- Group F matches
(1, 21, 22, 'completed', 'qualification', 21, 20, '2024-01-15 17:00:00', NOW()),
(1, 23, 24, 'scheduled', 'qualification', 0, 0, '2024-01-15 17:30:00', NOW()),
(1, 25, 26, 'completed', 'qualification', 19, 21, '2024-01-15 18:00:00', NOW()),
(1, 27, 28, 'scheduled', 'qualification', 0, 0, '2024-01-15 18:30:00', NOW()),

-- Elimination Tournament matches (tournament_id = 2)
(2, 1, 8, 'completed', 'quarter_final', 21, 17, '2024-01-21 09:00:00', NOW()),
(2, 11, 16, 'completed', 'quarter_final', 19, 21, '2024-01-21 09:30:00', NOW()),
(2, 17, 22, 'in_progress', 'semi_final', 18, 15, '2024-01-21 10:00:00', NOW()),
(2, 26, 21, 'scheduled', 'semi_final', 0, 0, '2024-01-21 10:30:00', NOW());