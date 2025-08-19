-- Complete seed data migration
-- This file contains all necessary data for the pickleball tournament system

-- First, ensure we have the correct groups (should already exist)
-- Insert sample teams for all groups
-- Group A teams (group_id = 1)
INSERT INTO teams (name, group_id, team_type, player1_name, player2_name) VALUES
('Thunder Bolts', 1, 'mens', 'John Smith', 'Mike Johnson'),
('Lightning Strike', 1, 'womens', 'Sarah Wilson', 'Emma Davis'),
('Storm Chasers', 1, 'mixed', 'David Brown', 'Lisa Garcia'),
('Wind Warriors', 1, 'mens', 'Chris Miller', 'Tom Anderson');

-- Group B teams (group_id = 2)
INSERT INTO teams (name, group_id, team_type, player1_name, player2_name) VALUES
('Fire Dragons', 2, 'womens', 'Jennifer Taylor', 'Michelle White'),
('Flame Throwers', 2, 'mixed', 'Robert Lee', 'Amanda Clark'),
('Blaze Masters', 2, 'mens', 'Kevin Martinez', 'Steve Rodriguez'),
('Heat Wave', 2, 'womens', 'Jessica Lewis', 'Ashley Walker');

-- Group C teams (group_id = 3)
INSERT INTO teams (name, group_id, team_type, player1_name, player2_name) VALUES
('Ice Breakers', 3, 'mixed', 'Daniel Hall', 'Rachel Allen'),
('Frost Giants', 3, 'mens', 'Matthew Young', 'Andrew King'),
('Snow Leopards', 3, 'womens', 'Nicole Wright', 'Stephanie Lopez'),
('Arctic Wolves', 3, 'mixed', 'James Hill', 'Megan Scott');

-- Group D teams (group_id = 4)
INSERT INTO teams (name, group_id, team_type, player1_name, player2_name) VALUES
('Earth Shakers', 4, 'mens', 'Brandon Green', 'Tyler Adams'),
('Rock Crushers', 4, 'womens', 'Samantha Baker', 'Brittany Gonzalez'),
('Mountain Movers', 4, 'mixed', 'Joshua Nelson', 'Kimberly Carter'),
('Stone Giants', 4, 'mens', 'Ryan Mitchell', 'Jacob Perez');

-- Group E teams (group_id = 5)
INSERT INTO teams (name, group_id, team_type, player1_name, player2_name) VALUES
('Ocean Waves', 5, 'womens', 'Lauren Roberts', 'Danielle Turner'),
('Sea Storms', 5, 'mixed', 'Nathan Phillips', 'Heather Campbell'),
('Tidal Force', 5, 'mens', 'Eric Parker', 'Justin Evans'),
('Deep Blue', 5, 'womens', 'Melissa Edwards', 'Christina Collins');

-- Group F teams (group_id = 6)
INSERT INTO teams (name, group_id, team_type, player1_name, player2_name) VALUES
('Sky Riders', 6, 'mixed', 'Alexander Stewart', 'Victoria Sanchez'),
('Cloud Jumpers', 6, 'mens', 'Benjamin Morris', 'Jonathan Rogers'),
('Wind Dancers', 6, 'womens', 'Kayla Reed', 'Alexis Cook'),
('Air Force', 6, 'mixed', 'Nicholas Bailey', 'Courtney Rivera');

-- Insert sample tournaments
INSERT INTO tournaments (name, tournament_type, team_type, start_date, end_date, is_active) VALUES
('Winter Group Stage 2024', 'group_stage', 'mixed', '2024-01-15', '2024-01-20', true),
('Winter Elimination 2024', 'elimination', 'mixed', '2024-01-21', '2024-01-25', true);

-- Insert sample matches using sequential team IDs
-- Note: Teams will have IDs 1-24 based on insertion order
INSERT INTO matches (tournament_id, team1_id, team2_id, match_status, match_round, team1_score, team2_score, scheduled_time, created_at) VALUES
-- Group Stage matches (tournament_id = 1)
-- Group A matches (teams 1-4)
(1, 1, 2, 'completed', 'qualification', 21, 18, '2024-01-15 09:00:00', NOW()),
(1, 3, 4, 'completed', 'qualification', 19, 21, '2024-01-15 09:30:00', NOW()),
(1, 1, 3, 'in_progress', 'qualification', 15, 12, '2024-01-15 10:00:00', NOW()),
(1, 2, 4, 'scheduled', 'qualification', 0, 0, '2024-01-15 10:30:00', NOW()),

-- Group B matches (teams 5-8)
(1, 5, 6, 'completed', 'qualification', 21, 16, '2024-01-15 11:00:00', NOW()),
(1, 7, 8, 'completed', 'qualification', 18, 21, '2024-01-15 11:30:00', NOW()),
(1, 5, 7, 'in_progress', 'qualification', 10, 8, '2024-01-15 12:00:00', NOW()),
(1, 6, 8, 'scheduled', 'qualification', 0, 0, '2024-01-15 12:30:00', NOW()),

-- Group C matches (teams 9-12)
(1, 9, 10, 'completed', 'qualification', 21, 19, '2024-01-15 13:00:00', NOW()),
(1, 11, 12, 'completed', 'qualification', 21, 14, '2024-01-15 13:30:00', NOW()),
(1, 9, 11, 'scheduled', 'qualification', 0, 0, '2024-01-15 14:00:00', NOW()),
(1, 10, 12, 'scheduled', 'qualification', 0, 0, '2024-01-15 14:30:00', NOW()),

-- Group D matches (teams 13-16)
(1, 13, 14, 'completed', 'qualification', 21, 13, '2024-01-15 15:00:00', NOW()),
(1, 15, 16, 'completed', 'qualification', 16, 21, '2024-01-15 15:30:00', NOW()),

-- Group E matches (teams 17-20)
(1, 17, 18, 'completed', 'qualification', 21, 17, '2024-01-15 16:00:00', NOW()),
(1, 19, 20, 'in_progress', 'qualification', 18, 15, '2024-01-15 16:30:00', NOW()),

-- Group F matches (teams 21-24)
(1, 21, 22, 'completed', 'qualification', 21, 20, '2024-01-15 17:00:00', NOW()),
(1, 23, 24, 'scheduled', 'qualification', 0, 0, '2024-01-15 17:30:00', NOW()),

-- Elimination Tournament matches (tournament_id = 2)
(2, 1, 8, 'completed', 'quarter_final', 21, 17, '2024-01-21 09:00:00', NOW()),
(2, 11, 16, 'completed', 'quarter_final', 19, 21, '2024-01-21 09:30:00', NOW()),
(2, 17, 22, 'in_progress', 'semi_final', 18, 15, '2024-01-21 10:00:00', NOW()),
(2, 4, 21, 'scheduled', 'semi_final', 0, 0, '2024-01-21 10:30:00', NOW());

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON teams TO anon;
GRANT ALL PRIVILEGES ON teams TO authenticated;

GRANT SELECT ON tournaments TO anon;
GRANT ALL PRIVILEGES ON tournaments TO authenticated;

GRANT SELECT ON matches TO anon;
GRANT ALL PRIVILEGES ON matches TO authenticated;

GRANT SELECT ON groups TO anon;
GRANT ALL PRIVILEGES ON groups TO authenticated;

GRANT SELECT ON admin_users TO anon;
GRANT ALL PRIVILEGES ON admin_users TO authenticated;

GRANT SELECT ON audit_logs TO anon;
GRANT ALL PRIVILEGES ON audit_logs TO authenticated;