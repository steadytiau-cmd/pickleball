-- 检查淘汰赛比赛轮次数据
SELECT 
  t.name as tournament_name,
  t.team_type,
  m.match_round,
  COUNT(*) as match_count,
  STRING_AGG(DISTINCT m.match_status::text, ', ') as statuses
FROM tournaments t
JOIN matches m ON t.id = m.tournament_id
WHERE t.tournament_type = 'elimination'
GROUP BY t.name, t.team_type, m.match_round
ORDER BY t.name, 
  CASE m.match_round
    WHEN 'qualification' THEN 1
    WHEN 'round_16' THEN 2
    WHEN 'quarter_final' THEN 3
    WHEN 'semi_final' THEN 4
    WHEN 'final' THEN 5
    ELSE 6
  END;

-- 检查具体的淘汰赛比赛详情
SELECT 
  t.name as tournament_name,
  t.team_type,
  m.match_round,
  m.match_status,
  m.court_number,
  m.scheduled_time,
  team1.name as team1_name,
  team2.name as team2_name,
  m.team1_score,
  m.team2_score,
  winner.name as winner_name
FROM tournaments t
JOIN matches m ON t.id = m.tournament_id
LEFT JOIN teams team1 ON m.team1_id = team1.id
LEFT JOIN teams team2 ON m.team2_id = team2.id
LEFT JOIN teams winner ON m.winner_id = winner.id
WHERE t.tournament_type = 'elimination'
ORDER BY t.name, 
  CASE m.match_round
    WHEN 'qualification' THEN 1
    WHEN 'round_16' THEN 2
    WHEN 'quarter_final' THEN 3
    WHEN 'semi_final' THEN 4
    WHEN 'final' THEN 5
    ELSE 6
  END,
  m.scheduled_time;