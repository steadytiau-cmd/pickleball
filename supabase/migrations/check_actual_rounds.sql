-- 检查实际存在的比赛轮次
SELECT 
  m.match_round,
  COUNT(*) as match_count,
  CASE m.match_round
    WHEN 'qualification' THEN 1
    WHEN 'round_16' THEN 2
    WHEN 'quarter_final' THEN 3
    WHEN 'semi_final' THEN 4
    WHEN 'final' THEN 5
    ELSE 6
  END as round_order
FROM matches m
GROUP BY m.match_round
ORDER BY round_order;

-- 检查淘汰赛锦标赛的具体比赛
SELECT 
  t.name as tournament_name,
  m.match_round,
  m.match_status,
  COUNT(*) as match_count
FROM tournaments t
JOIN matches m ON t.id = m.tournament_id
WHERE t.tournament_type = 'elimination'
GROUP BY t.name, m.match_round, m.match_status
ORDER BY t.name, 
  CASE m.match_round
    WHEN 'qualification' THEN 1
    WHEN 'round_16' THEN 2
    WHEN 'quarter_final' THEN 3
    WHEN 'semi_final' THEN 4
    WHEN 'final' THEN 5
    ELSE 6
  END;