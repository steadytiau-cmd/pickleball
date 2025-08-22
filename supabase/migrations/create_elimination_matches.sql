-- 为淘汰赛锦标赛创建半决赛和决赛比赛
-- 基于现有的队伍数据创建示例比赛

-- 第二轮半决赛比赛 (tournament_id = 4)
-- 假设前4名队伍晋级半决赛
INSERT INTO matches (tournament_id, team1_id, team2_id, match_round, match_status, court_number, scheduled_time)
SELECT 
    4 as tournament_id,
    t1.id as team1_id,
    t2.id as team2_id,
    'semi_final' as match_round,
    'scheduled' as match_status,
    ROW_NUMBER() OVER() as court_number,
    CURRENT_TIMESTAMP + INTERVAL '1 day' as scheduled_time
FROM 
    (SELECT id, ROW_NUMBER() OVER() as rn FROM teams ORDER BY wins DESC, id LIMIT 4) ranked_teams
    CROSS JOIN (SELECT id, ROW_NUMBER() OVER() as rn FROM teams ORDER BY wins DESC, id LIMIT 4) t1
    CROSS JOIN (SELECT id, ROW_NUMBER() OVER() as rn FROM teams ORDER BY wins DESC, id LIMIT 4) t2
WHERE t1.rn = 1 AND t2.rn = 2
   OR t1.rn = 3 AND t2.rn = 4
LIMIT 2;

-- 第三轮决赛比赛 (tournament_id = 5)
-- 创建一场决赛比赛（获胜者待定）
INSERT INTO matches (tournament_id, team1_id, team2_id, match_round, match_status, court_number, scheduled_time)
SELECT 
    5 as tournament_id,
    (SELECT id FROM teams ORDER BY wins DESC, id LIMIT 1) as team1_id,
    (SELECT id FROM teams ORDER BY wins DESC, id LIMIT 1 OFFSET 1) as team2_id,
    'final' as match_round,
    'scheduled' as match_status,
    1 as court_number,
    CURRENT_TIMESTAMP + INTERVAL '2 days' as scheduled_time;

-- 完成一场半决赛作为示例
UPDATE matches SET 
    match_status = 'completed',
    team1_score = 21,
    team2_score = 19,
    winner_id = team1_id,
    actual_start_time = scheduled_time,
    actual_end_time = scheduled_time + INTERVAL '45 minutes'
WHERE tournament_id = 4 AND match_round = 'semi_final' AND court_number = 1;

-- 设置一场半决赛为进行中
UPDATE matches SET 
    match_status = 'in_progress',
    team1_score = 15,
    team2_score = 12,
    actual_start_time = CURRENT_TIMESTAMP - INTERVAL '20 minutes'
WHERE tournament_id = 4 AND match_round = 'semi_final' AND court_number = 2;