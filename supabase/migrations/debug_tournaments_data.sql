-- 查询锦标赛数据，特别是小组赛的team_type设置
SELECT 
  t.id,
  t.name,
  t.tournament_type,
  t.team_type,
  t.is_active,
  COUNT(m.id) as match_count
FROM tournaments t
LEFT JOIN matches m ON t.id = m.tournament_id
WHERE t.tournament_type = 'group_stage'
GROUP BY t.id, t.name, t.tournament_type, t.team_type, t.is_active
ORDER BY t.created_at DESC;

-- 查询小组赛比赛数据和队伍类型
SELECT 
  m.id as match_id,
  t.name as tournament_name,
  t.team_type as tournament_team_type,
  team1.name as team1_name,
  team1.team_type as team1_type,
  team2.name as team2_name,
  team2.team_type as team2_type,
  m.match_status
FROM matches m
JOIN tournaments t ON m.tournament_id = t.id
LEFT JOIN teams team1 ON m.team1_id = team1.id
LEFT JOIN teams team2 ON m.team2_id = team2.id
WHERE t.tournament_type = 'group_stage'
ORDER BY t.id, m.id;