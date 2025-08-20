-- Update groups table with 6 fixed groups for pickleball tournament
-- 苍玉、翡翠、玛瑙、璧玺、紫晶、碧玉

-- Clear existing groups data
DELETE FROM groups;

-- Insert the 6 fixed groups
INSERT INTO groups (id, name, description) VALUES
(1, '苍玉', '苍玉小组 - 男双、女双、混双'),
(2, '翡翠', '翡翠小组 - 男双、女双、混双'),
(3, '玛瑙', '玛瑙小组 - 男双、女双、混双'),
(4, '璧玺', '璧玺小组 - 男双、女双、混双'),
(5, '紫晶', '紫晶小组 - 男双、女双、混双'),
(6, '碧玉', '碧玉小组 - 男双、女双、混双');

-- Reset the sequence to start from 7
SELECT setval('groups_id_seq', 6, true);

-- Clear existing teams data to prepare for new structure
DELETE FROM teams;

-- Insert sample teams for each group and category
-- 苍玉小组 (Group 1)
INSERT INTO teams (name, group_id, team_type, player1_name, player2_name) VALUES
('苍玉男双', 1, 'mens', '待填写', '待填写'),
('苍玉女双', 1, 'womens', '待填写', '待填写'),
('苍玉混双', 1, 'mixed', '待填写', '待填写');

-- 翡翠小组 (Group 2)
INSERT INTO teams (name, group_id, team_type, player1_name, player2_name) VALUES
('翡翠男双', 2, 'mens', '待填写', '待填写'),
('翡翠女双', 2, 'womens', '待填写', '待填写'),
('翡翠混双', 2, 'mixed', '待填写', '待填写');

-- 玛瑙小组 (Group 3)
INSERT INTO teams (name, group_id, team_type, player1_name, player2_name) VALUES
('玛瑙男双', 3, 'mens', '待填写', '待填写'),
('玛瑙女双', 3, 'womens', '待填写', '待填写'),
('玛瑙混双', 3, 'mixed', '待填写', '待填写');

-- 璧玺小组 (Group 4)
INSERT INTO teams (name, group_id, team_type, player1_name, player2_name) VALUES
('璧玺男双', 4, 'mens', '待填写', '待填写'),
('璧玺女双', 4, 'womens', '待填写', '待填写'),
('璧玺混双', 4, 'mixed', '待填写', '待填写');

-- 紫晶小组 (Group 5)
INSERT INTO teams (name, group_id, team_type, player1_name, player2_name) VALUES
('紫晶男双', 5, 'mens', '待填写', '待填写'),
('紫晶女双', 5, 'womens', '待填写', '待填写'),
('紫晶混双', 5, 'mixed', '待填写', '待填写');

-- 碧玉小组 (Group 6)
INSERT INTO teams (name, group_id, team_type, player1_name, player2_name) VALUES
('碧玉男双', 6, 'mens', '待填写', '待填写'),
('碧玉女双', 6, 'womens', '待填写', '待填写'),
('碧玉混双', 6, 'mixed', '待填写', '待填写');

-- Grant permissions for the tables
GRANT SELECT ON groups TO anon;
GRANT ALL PRIVILEGES ON groups TO authenticated;
GRANT SELECT ON teams TO anon;
GRANT ALL PRIVILEGES ON teams TO authenticated;