-- Seed sample data for pickleball tournament

-- Insert sample teams for each group (1-6) with different team types
INSERT INTO teams (name, group_id, team_type, player1_name, player2_name, created_at) VALUES
-- Group 1 teams (Group A)
('Thunder Smash', 1, 'mens', 'John Smith', 'Mike Johnson', NOW()),
('Lightning Strike', 1, 'mens', 'David Brown', 'Chris Wilson', NOW()),
('Power Serve', 1, 'mens', 'Robert Davis', 'James Miller', NOW()),
('Ace Masters', 1, 'mens', 'William Garcia', 'Thomas Anderson', NOW()),
('Net Crushers', 1, 'womens', 'Sarah Johnson', 'Emily Davis', NOW()),
('Paddle Queens', 1, 'womens', 'Jessica Brown', 'Amanda Wilson', NOW()),
('Spin Sisters', 1, 'womens', 'Lisa Miller', 'Karen Garcia', NOW()),
('Court Angels', 1, 'womens', 'Michelle Lee', 'Jennifer Taylor', NOW()),
('Mixed Magic', 1, 'mixed', 'Alex Thompson', 'Maria Rodriguez', NOW()),
('Dynamic Duo', 1, 'mixed', 'Kevin White', 'Nicole Martinez', NOW()),
('Perfect Pair', 1, 'mixed', 'Ryan Clark', 'Stephanie Lewis', NOW()),
('Team Harmony', 1, 'mixed', 'Daniel Hall', 'Rachel Young', NOW()),

-- Group 2 teams (Group B)
('Storm Breakers', 2, 'mens', 'Mark Thompson', 'Steve Wilson', NOW()),
('Rocket Rackets', 2, 'mens', 'Paul Martinez', 'Tony Garcia', NOW()),
('Smash Brothers', 2, 'mens', 'Brian Lee', 'Scott Taylor', NOW()),
('Court Kings', 2, 'mens', 'Jason Clark', 'Matt Rodriguez', NOW()),
('Fierce Females', 2, 'womens', 'Diana White', 'Laura Martinez', NOW()),
('Dink Divas', 2, 'womens', 'Susan Lewis', 'Carol Hall', NOW()),
('Volley Vixens', 2, 'womens', 'Patricia Young', 'Linda King', NOW()),
('Baseline Beauties', 2, 'womens', 'Barbara Wright', 'Nancy Lopez', NOW()),
('Power Couple', 2, 'mixed', 'Michael Green', 'Angela Adams', NOW()),
('Court Crushers', 2, 'mixed', 'Andrew Baker', 'Melissa Nelson', NOW()),
('Winning Combo', 2, 'mixed', 'Joshua Carter', 'Kimberly Mitchell', NOW()),
('Team Synergy', 2, 'mixed', 'Christopher Perez', 'Donna Roberts', NOW()),

-- Group 3 teams (Group C)
('Net Ninjas', 3, 'mens', 'Eric Johnson', 'Kevin Brown', NOW()),
('Paddle Power', 3, 'mens', 'Ryan Davis', 'Tyler Miller', NOW()),
('Serve Surge', 3, 'mens', 'Brandon Wilson', 'Justin Garcia', NOW()),
('Baseline Blitz', 3, 'mens', 'Aaron Martinez', 'Nathan Anderson', NOW()),
('Dink Dynasty', 3, 'womens', 'Ashley Thompson', 'Brittany Taylor', NOW()),
('Volley Victors', 3, 'womens', 'Samantha Moore', 'Heather Jackson', NOW()),
('Smash Squad', 3, 'womens', 'Megan White', 'Danielle Harris', NOW()),
('Court Commanders', 3, 'womens', 'Kayla Martin', 'Jenna Clark', NOW()),
('Perfect Match', 3, 'mixed', 'Jacob Rodriguez', 'Alexis Lewis', NOW()),
('Dream Team', 3, 'mixed', 'Ethan Lee', 'Jasmine Walker', NOW()),
('Ace Alliance', 3, 'mixed', 'Noah Hall', 'Destiny Allen', NOW()),
('Victory Voyage', 3, 'mixed', 'Mason Young', 'Trinity King', NOW()),

-- Group 4 teams (Group D)
('Thunder Bolts', 4, 'mens', 'Logan Wright', 'Connor Lopez', NOW()),
('Lightning Lords', 4, 'mens', 'Hunter Hill', 'Caleb Scott', NOW()),
('Power Players', 4, 'mens', 'Ian Green', 'Gavin Adams', NOW()),
('Smash Specialists', 4, 'mens', 'Owen Baker', 'Liam Gonzalez', NOW()),
('Queen Bees', 4, 'womens', 'Chloe Nelson', 'Sophia Carter', NOW()),
('Lady Legends', 4, 'womens', 'Emma Mitchell', 'Olivia Perez', NOW()),
('Fierce Force', 4, 'womens', 'Ava Roberts', 'Isabella Turner', NOW()),
('Victory Vixens', 4, 'womens', 'Mia Phillips', 'Charlotte Campbell', NOW()),
('Mixed Masters', 4, 'mixed', 'Lucas Parker', 'Abigail Evans', NOW()),
('Harmony Heroes', 4, 'mixed', 'Alexander Edwards', 'Madison Collins', NOW()),
('Balance Brigade', 4, 'mixed', 'Benjamin Stewart', 'Elizabeth Sanchez', NOW()),
('Unity United', 4, 'mixed', 'Samuel Morris', 'Victoria Rogers', NOW()),

-- Group 5 teams (Group E)
('Storm Surge', 5, 'mens', 'Gabriel Reed', 'Elijah Cook', NOW()),
('Rocket Rush', 5, 'mens', 'Matthew Bailey', 'Anthony Rivera', NOW()),
('Thunder Thrill', 5, 'mens', 'Andrew Cooper', 'Joshua Richardson', NOW()),
('Lightning Launch', 5, 'mens', 'Nicholas Cox', 'Jonathan Ward', NOW()),
('Diva Dynamos', 5, 'womens', 'Grace Torres', 'Natalie Peterson', NOW()),
('Queen Quake', 5, 'womens', 'Hannah Gray', 'Zoe Ramirez', NOW()),
('Lady Lightning', 5, 'womens', 'Lily James', 'Addison Watson', NOW()),
('Fierce Flames', 5, 'womens', 'Ella Brooks', 'Avery Kelly', NOW()),
('Power Partnership', 5, 'mixed', 'Christian Sanders', 'Layla Price', NOW()),
('Dream Duo', 5, 'mixed', 'Isaac Bennett', 'Scarlett Wood', NOW()),
('Perfect Pair Plus', 5, 'mixed', 'Wyatt Barnes', 'Aria Ross', NOW()),
('Harmony Hub', 5, 'mixed', 'Jaxon Henderson', 'Leah Coleman', NOW()),

-- Group 6 teams (Group F)
('Final Force', 6, 'mens', 'Carson Jenkins', 'Easton Perry', NOW()),
('Ultimate Unity', 6, 'mens', 'Nolan Powell', 'Colton Long', NOW()),
('Supreme Smash', 6, 'mens', 'Landon Patterson', 'Hudson Hughes', NOW()),
('Champion Charge', 6, 'mens', 'Brayden Flores', 'Grayson Washington', NOW()),
('Final Females', 6, 'womens', 'Aubrey Butler', 'Penelope Simmons', NOW()),
('Ultimate Queens', 6, 'womens', 'Claire Foster', 'Hazel Gonzales', NOW()),
('Supreme Sisters', 6, 'womens', 'Violet Bryant', 'Savannah Alexander', NOW()),
('Champion Chicks', 6, 'womens', 'Aurora Russell', 'Paisley Griffin', NOW()),
('Final Mix', 6, 'mixed', 'Maverick Diaz', 'Nova Hayes', NOW()),
('Ultimate Union', 6, 'mixed', 'Ryder Myers', 'Willow Ford', NOW()),
('Supreme Sync', 6, 'mixed', 'Kai Hamilton', 'Kinsley Graham', NOW()),
('Champion Combo', 6, 'mixed', 'Axel Sullivan', 'Luna Wallace', NOW());

-- Insert tournaments
INSERT INTO tournaments (name, tournament_type, team_type, start_date, end_date, is_active, created_at) VALUES
('Group Stage Tournament', 'group_stage', 'mixed', '2024-01-15', '2024-01-20', true, NOW()),
('Elimination Tournament', 'elimination', 'mixed', '2024-01-21', '2024-01-25', true, NOW());

-- Insert sample matches
INSERT INTO matches (tournament_id, team1_id, team2_id, match_status, match_round, team1_score, team2_score, scheduled_time, created_at) VALUES
-- Group Stage matches (tournament_id = 1)
(1, 1, 2, 'completed', 'qualification', 21, 18, '2024-01-15 09:00:00', NOW()),
(1, 3, 4, 'completed', 'qualification', 19, 21, '2024-01-15 09:30:00', NOW()),
(1, 5, 6, 'in_progress', 'qualification', 15, 12, '2024-01-15 10:00:00', NOW()),
(1, 7, 8, 'scheduled', 'qualification', 0, 0, '2024-01-15 10:30:00', NOW()),
(1, 9, 10, 'completed', 'qualification', 21, 16, '2024-01-15 11:00:00', NOW()),
(1, 11, 12, 'completed', 'qualification', 18, 21, '2024-01-15 11:30:00', NOW()),

-- More Group Stage matches
(1, 13, 14, 'completed', 'qualification', 21, 19, '2024-01-15 12:00:00', NOW()),
(1, 15, 16, 'in_progress', 'qualification', 10, 8, '2024-01-15 12:30:00', NOW()),
(1, 17, 18, 'scheduled', 'qualification', 0, 0, '2024-01-15 13:00:00', NOW()),
(1, 19, 20, 'completed', 'qualification', 21, 14, '2024-01-15 13:30:00', NOW()),

-- Elimination Tournament matches (tournament_id = 2)
(2, 1, 4, 'completed', 'quarter_final', 21, 17, '2024-01-21 09:00:00', NOW()),
(2, 6, 9, 'completed', 'quarter_final', 19, 21, '2024-01-21 09:30:00', NOW()),
(2, 12, 13, 'in_progress', 'semi_final', 18, 15, '2024-01-21 10:00:00', NOW()),
(2, 20, 21, 'scheduled', 'semi_final', 0, 0, '2024-01-21 10:30:00', NOW()),

-- Additional matches for variety
(1, 21, 22, 'completed', 'qualification', 21, 13, '2024-01-15 14:00:00', NOW()),
(1, 23, 24, 'completed', 'qualification', 16, 21, '2024-01-15 14:30:00', NOW()),
(2, 25, 26, 'scheduled', 'quarter_final', 0, 0, '2024-01-21 11:00:00', NOW()),
(2, 27, 28, 'completed', 'quarter_final', 21, 20, '2024-01-21 11:30:00', NOW());

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON teams TO anon;
GRANT SELECT ON tournaments TO anon;
GRANT SELECT ON matches TO anon;
GRANT SELECT ON groups TO anon;

GRANT ALL PRIVILEGES ON teams TO authenticated;
GRANT ALL PRIVILEGES ON tournaments TO authenticated;
GRANT ALL PRIVILEGES ON matches TO authenticated;
GRANT ALL PRIVILEGES ON groups TO authenticated;
GRANT ALL PRIVILEGES ON admin_users TO authenticated;
GRANT ALL PRIVILEGES ON audit_logs TO authenticated;