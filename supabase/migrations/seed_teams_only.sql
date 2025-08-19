-- Insert only teams data first
-- Clear existing data if any
DELETE FROM matches;
DELETE FROM tournaments;
DELETE FROM teams;

-- Reset sequences
ALTER SEQUENCE teams_id_seq RESTART WITH 1;
ALTER SEQUENCE tournaments_id_seq RESTART WITH 1;
ALTER SEQUENCE matches_id_seq RESTART WITH 1;

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

-- Grant permissions
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