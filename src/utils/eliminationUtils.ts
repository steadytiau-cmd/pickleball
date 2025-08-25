import { supabase } from '../lib/supabase';

interface Match {
  id: number;
  tournament_id: number;
  team1_id: number | null;
  team2_id: number | null;
  winner_id: number | null;
  match_round: string;
  match_status: string;
  team1_score?: number;
  team2_score?: number;
}

/**
 * 处理淘汰赛胜者自动晋级逻辑
 * @param completedMatch 刚完成的比赛
 */
export const handleEliminationAdvancement = async (completedMatch: Match) => {
  if (!completedMatch.winner_id || completedMatch.match_status !== 'completed') {
    return;
  }

  try {
    // 获取同一锦标赛的所有比赛
    const { data: allMatches, error: fetchError } = await supabase
      .from('matches')
      .select('*')
      .eq('tournament_id', completedMatch.tournament_id)
      .order('match_round');

    if (fetchError) {
      console.error('获取比赛数据失败:', fetchError);
      return;
    }

    // 根据比赛轮次确定晋级逻辑
    await advanceWinnerToNextRound(completedMatch, allMatches || []);
  } catch (error) {
    console.error('处理晋级逻辑失败:', error);
  }
};

/**
 * 将获胜者晋级到下一轮比赛
 * @param completedMatch 完成的比赛
 * @param allMatches 所有比赛数据
 */
const advanceWinnerToNextRound = async (completedMatch: Match, allMatches: Match[]) => {
  const { match_round, winner_id } = completedMatch;
  
  // 定义轮次晋级映射
  const roundProgression: { [key: string]: string } = {
    'quarter_final': 'semi_final',
    'semi_final': 'final'
  };

  const nextRound = roundProgression[match_round];
  if (!nextRound) {
    // 如果是决赛，没有下一轮
    return;
  }

  // 获取下一轮的比赛
  const nextRoundMatches = allMatches.filter(match => match.match_round === nextRound);
  
  if (nextRoundMatches.length === 0) {
    console.error(`未找到${nextRound}轮次的比赛`);
    return;
  }

  // 根据8队淘汰赛的标准晋级逻辑
  if (match_round === 'quarter_final') {
    await advanceFromQuarterFinal(completedMatch, nextRoundMatches, winner_id);
  } else if (match_round === 'semi_final') {
    await advanceFromSemiFinal(completedMatch, nextRoundMatches, winner_id);
  }
};

/**
 * 处理四分之一决赛的晋级逻辑
 * @param completedMatch 完成的四分之一决赛
 * @param semiFinalMatches 半决赛比赛列表
 * @param winnerId 获胜队伍ID
 */
const advanceFromQuarterFinal = async (
  completedMatch: Match, 
  semiFinalMatches: Match[], 
  winnerId: number
) => {
  // 8队淘汰赛的四分之一决赛晋级逻辑：
  // QF1获胜者 vs QF2获胜者 -> SF1
  // QF3获胜者 vs QF4获胜者 -> SF2
  
  // 获取当前比赛在四分之一决赛中的位置
  const { data: quarterFinals, error } = await supabase
    .from('matches')
    .select('*')
    .eq('tournament_id', completedMatch.tournament_id)
    .eq('match_round', 'quarter_final')
    .order('id');

  if (error || !quarterFinals) {
    console.error('获取四分之一决赛数据失败:', error);
    return;
  }

  const matchIndex = quarterFinals.findIndex(match => match.id === completedMatch.id);
  if (matchIndex === -1) return;

  // 确定应该晋级到哪场半决赛
  const semiFinalIndex = Math.floor(matchIndex / 2); // 0或1
  const targetSemiFinal = semiFinalMatches[semiFinalIndex];
  
  if (!targetSemiFinal) {
    console.error('未找到目标半决赛');
    return;
  }

  // 确定应该填入team1还是team2位置
  const isFirstInPair = matchIndex % 2 === 0;
  const updateField = isFirstInPair ? 'team1_id' : 'team2_id';

  // 更新半决赛的队伍
  const { error: updateError } = await supabase
    .from('matches')
    .update({ [updateField]: winnerId })
    .eq('id', targetSemiFinal.id);

  if (updateError) {
    console.error('更新半决赛队伍失败:', updateError);
  } else {
    console.log(`队伍${winnerId}已晋级到半决赛`);
  }
};

/**
 * 处理半决赛的晋级逻辑
 * @param completedMatch 完成的半决赛
 * @param finalMatches 决赛比赛列表
 * @param winnerId 获胜队伍ID
 */
const advanceFromSemiFinal = async (
  completedMatch: Match, 
  finalMatches: Match[], 
  winnerId: number
) => {
  // 半决赛获胜者晋级到决赛
  const finalMatch = finalMatches[0]; // 应该只有一场决赛
  
  if (!finalMatch) {
    console.error('未找到决赛');
    return;
  }

  // 获取当前半决赛的索引
  const { data: semiFinals, error } = await supabase
    .from('matches')
    .select('*')
    .eq('tournament_id', completedMatch.tournament_id)
    .eq('match_round', 'semi_final')
    .order('id');

  if (error || !semiFinals) {
    console.error('获取半决赛数据失败:', error);
    return;
  }

  const matchIndex = semiFinals.findIndex(match => match.id === completedMatch.id);
  if (matchIndex === -1) return;

  // 第一场半决赛的获胜者进入决赛的team1位置，第二场的获胜者进入team2位置
  const updateField = matchIndex === 0 ? 'team1_id' : 'team2_id';

  // 更新决赛的队伍
  const { error: updateError } = await supabase
    .from('matches')
    .update({ [updateField]: winnerId })
    .eq('id', finalMatch.id);

  if (updateError) {
    console.error('更新决赛队伍失败:', updateError);
  } else {
    console.log(`队伍${winnerId}已晋级到决赛`);
  }
};

/**
 * 检查是否为8队淘汰赛格式
 * @param tournamentId 锦标赛ID
 * @returns 是否为8队淘汰赛
 */
export const isEightTeamEliminationTournament = async (tournamentId: number): Promise<boolean> => {
  try {
    const { data: matches, error } = await supabase
      .from('matches')
      .select('match_round')
      .eq('tournament_id', tournamentId);

    if (error || !matches) {
      return false;
    }

    // 统计各轮次的比赛数量
    const roundCounts = matches.reduce((acc, match) => {
      acc[match.match_round] = (acc[match.match_round] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    // 8队淘汰赛应该有：4场四分之一决赛，2场半决赛，1场决赛
    return (
      roundCounts['quarter_final'] === 4 &&
      roundCounts['semi_final'] === 2 &&
      roundCounts['final'] === 1
    );
  } catch (error) {
    console.error('检查锦标赛格式失败:', error);
    return false;
  }
};