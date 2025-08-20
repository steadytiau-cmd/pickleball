-- Update tournament structure for 3-round system
-- 第一轮：资格赛（随机对战）
-- 第二轮：半决赛（第一轮总分最高的4组晋级）
-- 第三轮：决赛

-- Clear existing tournaments and matches
DELETE FROM matches;
DELETE FROM tournaments;

-- Create tournaments for each category and round
-- 第一轮：资格赛 - 男双
INSERT INTO tournaments (id, name, tournament_type, team_type, is_active, start_date, description) VALUES
(1, '第一轮资格赛 - 男双', 'group_stage', 'mens', true, CURRENT_DATE, '所有6组的男双分别抽签决定对手组别，每场21分制');

-- 第一轮：资格赛 - 女双
INSERT INTO tournaments (id, name, tournament_type, team_type, is_active, start_date, description) VALUES
(2, '第一轮资格赛 - 女双', 'group_stage', 'womens', true, CURRENT_DATE, '所有6组的女双分别抽签决定对手组别，每场21分制');

-- 第一轮：资格赛 - 混双
INSERT INTO tournaments (id, name, tournament_type, team_type, is_active, start_date, description) VALUES
(3, '第一轮资格赛 - 混双', 'group_stage', 'mixed', true, CURRENT_DATE, '所有6组的混双分别抽签决定对手组别，每场21分制');

-- 第二轮：半决赛
INSERT INTO tournaments (id, name, tournament_type, team_type, is_active, start_date, description) VALUES
(4, '第二轮半决赛', 'elimination', NULL, false, CURRENT_DATE + INTERVAL '1 day', '第一轮总分最高的4组晋级，3场比赛（男双、女双、混双）决定胜负');

-- 第三轮：决赛
INSERT INTO tournaments (id, name, tournament_type, team_type, is_active, start_date, description) VALUES
(5, '第三轮决赛', 'elimination', NULL, false, CURRENT_DATE + INTERVAL '2 days', '第二轮胜者争夺冠亚军');

-- Reset tournament sequence
SELECT setval('tournaments_id_seq', 5, true);

-- Create sample qualification matches (random pairings)
-- First, let's get the actual team IDs from the teams table
-- 男双资格赛 (3场比赛，每组轮流对战)
INSERT INTO matches (tournament_id, team1_id, team2_id, match_round, match_status, court_number, scheduled_time)
SELECT 
    1 as tournament_id,
    t1.id as team1_id,
    t2.id as team2_id,
    'qualification' as match_round,
    'scheduled' as match_status,
    ROW_NUMBER() OVER() as court_number,
    CURRENT_TIMESTAMP + INTERVAL '1 hour' as scheduled_time
FROM 
    (SELECT id, ROW_NUMBER() OVER() as rn FROM teams WHERE team_type = 'mens' ORDER BY id) t1
JOIN 
    (SELECT id, ROW_NUMBER() OVER() as rn FROM teams WHERE team_type = 'mens' ORDER BY id) t2
    ON t1.rn < t2.rn
LIMIT 3;

-- 女双资格赛 (3场比赛，不同的随机配对)
INSERT INTO matches (tournament_id, team1_id, team2_id, match_round, match_status, court_number, scheduled_time)
SELECT 
    2 as tournament_id,
    t1.id as team1_id,
    t2.id as team2_id,
    'qualification' as match_round,
    'scheduled' as match_status,
    ROW_NUMBER() OVER() as court_number,
    CURRENT_TIMESTAMP + INTERVAL '2 hours' as scheduled_time
FROM 
    (SELECT id, ROW_NUMBER() OVER() as rn FROM teams WHERE team_type = 'womens' ORDER BY id) t1
JOIN 
    (SELECT id, ROW_NUMBER() OVER() as rn FROM teams WHERE team_type = 'womens' ORDER BY id) t2
    ON t1.rn < t2.rn
LIMIT 3;

-- 混双资格赛 (3场比赛，又不同的随机配对)
INSERT INTO matches (tournament_id, team1_id, team2_id, match_round, match_status, court_number, scheduled_time)
SELECT 
    3 as tournament_id,
    t1.id as team1_id,
    t2.id as team2_id,
    'qualification' as match_round,
    'scheduled' as match_status,
    ROW_NUMBER() OVER() as court_number,
    CURRENT_TIMESTAMP + INTERVAL '3 hours' as scheduled_time
FROM 
    (SELECT id, ROW_NUMBER() OVER() as rn FROM teams WHERE team_type = 'mixed' ORDER BY id) t1
JOIN 
    (SELECT id, ROW_NUMBER() OVER() as rn FROM teams WHERE team_type = 'mixed' ORDER BY id) t2
    ON t1.rn < t2.rn
LIMIT 3;

-- Add some completed matches with sample scores for demonstration
-- 完成一些比赛作为示例
-- Complete first match in each tournament (team1 wins)
UPDATE matches SET 
    match_status = 'completed',
    team1_score = 21,
    team2_score = 18,
    winner_id = team1_id,
    actual_start_time = scheduled_time,
    actual_end_time = scheduled_time + INTERVAL '45 minutes'
WHERE tournament_id IN (1, 2, 3) AND court_number = 1;

-- Complete second match in each tournament (team2 wins)
UPDATE matches SET 
    match_status = 'completed',
    team1_score = 19,
    team2_score = 21,
    winner_id = team2_id,
    actual_start_time = scheduled_time,
    actual_end_time = scheduled_time + INTERVAL '50 minutes'
WHERE tournament_id IN (1, 2, 3) AND court_number = 2;

-- Update team wins/losses based on completed matches
-- 更新获胜队伍的统计 (winners)
UPDATE teams SET wins = wins + 1 
WHERE id IN (
    SELECT winner_id FROM matches WHERE match_status = 'completed' AND winner_id IS NOT NULL
);

-- Update losses for losing teams
UPDATE teams SET losses = losses + 1 
WHERE id IN (
    SELECT CASE 
        WHEN winner_id = team1_id THEN team2_id 
        WHEN winner_id = team2_id THEN team1_id 
    END as loser_id
    FROM matches 
    WHERE match_status = 'completed' AND winner_id IS NOT NULL
);

-- Grant permissions
GRANT SELECT ON tournaments TO anon;
GRANT ALL PRIVILEGES ON tournaments TO authenticated;
GRANT SELECT ON matches TO anon;
GRANT ALL PRIVILEGES ON matches TO authenticated;