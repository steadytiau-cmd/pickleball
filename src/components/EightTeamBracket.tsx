import React from 'react';

import { Match, Team } from '../types/tournament';

interface EightTeamBracketProps {
  matches: Match[];
  teams: Team[];
  onMatchClick?: (match: Match) => void;
}

const EightTeamBracket: React.FC<EightTeamBracketProps> = ({ matches, teams, onMatchClick }) => {
  const getTeamById = (id: number) => teams.find(team => team.id === id);
  const getMatchById = (id: number) => matches.find(match => match.id === id);

  const getMatchesByRound = (round: string) => {
    return matches.filter(match => match.match_round === round);
  };

  const quarterFinals = getMatchesByRound('quarter_final');
  const semiFinals = getMatchesByRound('semi_final');
  const finals = getMatchesByRound('final');
  const finalMatch = finals[0];

  // 获取亚军和季军
  const getRunnerUp = () => {
    if (isFinalsComplete()) {
      const finalMatch = finals[0];
      const loserId = finalMatch.winner_id === finalMatch.team1_id ? finalMatch.team2_id : finalMatch.team1_id;
      return getTeamById(loserId);
    }
    return null;
  };

  const getThirdPlace = () => {
    // 假设有季军赛或者从半决赛失败者中确定
    // 这里简化处理，可以根据实际业务逻辑调整
    if (areSemiFinalsComplete()) {
      const semiLosers = semiFinals.map(match => {
        if (match.match_status === 'completed' && match.winner_id) {
          const loserId = match.winner_id === match.team1_id ? match.team2_id : match.team1_id;
          return getTeamById(loserId);
        }
        return null;
      }).filter(Boolean);
      return semiLosers[0]; // 简化处理，返回第一个半决赛失败者作为季军
    }
    return null;
  };

  // 获取晋级到半决赛的队伍
  const getSemiFinalTeams = () => {
    const semiTeams: { [key: number]: { team1?: Team | null, team2?: Team | null } } = {};
    
    // 检查每场1/4决赛的获胜者
    quarterFinals.forEach((match, index) => {
      if (match.match_status === 'completed' && match.winner_id) {
        const winner = getTeamById(match.winner_id);
        if (winner) {
          // 根据1/4决赛的顺序分配到对应的半决赛
          const semiIndex = Math.floor(index / 2); // 0,1 -> 0; 2,3 -> 1
          const position = index % 2; // 0,2 -> 0 (team1); 1,3 -> 1 (team2)
          
          if (!semiTeams[semiIndex]) semiTeams[semiIndex] = {};
          semiTeams[semiIndex][position === 0 ? 'team1' : 'team2'] = winner;
        }
      }
    });
    
    return semiTeams;
  };

  // 获取晋级到决赛的队伍
  const getFinalTeams = () => {
    const finalTeams: { team1?: Team | null, team2?: Team | null } = {};
    
    // 检查每场半决赛的获胜者
    semiFinals.forEach((match, index) => {
      if (match.match_status === 'completed' && match.winner_id) {
        const winner = getTeamById(match.winner_id);
        if (winner) {
          finalTeams[index === 0 ? 'team1' : 'team2'] = winner;
        }
      }
    });
    
    return finalTeams;
  };

  // 渲染比赛对阵 - 采用TournamentBracket的卡片式设计
  const renderMatchPair = (match: Match, team1: Team | null, team2: Team | null, round: string) => {
    const isCompleted = match.match_status === 'completed';
    const winner = match.winner_id ? getTeamById(match.winner_id) : null;
    
    const getRoundTitle = (round: string) => {
      switch(round) {
        case 'quarterfinals': return '四分之一决赛';
        case 'semifinals': return '半决赛';
        case 'finals': return '决赛';
        default: return '';
      }
    };

    const getMatchStatusText = (status: string) => {
      switch(status) {
        case 'completed': return '已完成';
        case 'in_progress': return '进行中';
        case 'scheduled': return '等待开始';
        default: return '待定';
      }
    };

    return (
      <div 
        className={`w-56 sm:w-60 md:w-64 bg-white rounded-lg border-2 shadow-lg transition-all hover:shadow-xl ${
          match.match_status === 'completed' ? 'border-green-500' :
          match.match_status === 'in_progress' ? 'border-yellow-500' :
          'border-gray-300'
        }`}
        onClick={() => onMatchClick?.(match)}
      >
        {/* Match Header */}
        <div className="px-4 py-2 bg-gray-50 rounded-t-lg border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                match.match_status === 'completed' ? 'bg-green-100 text-green-800' :
                match.match_status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {getMatchStatusText(match.match_status)}
              </span>
              <div className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                {getRoundTitle(round)}
              </div>
            </div>
          </div>
        </div>
        
        {/* Teams */}
        <div className="p-4">
          {/* Team 1 */}
          <div className={`p-3 rounded-lg mb-2 relative ${
            match.winner_id === team1?.id ? 'bg-gradient-to-r from-yellow-100 to-amber-100 border-2 border-amber-400 shadow-lg' : 'bg-gray-50'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className={`font-semibold text-sm flex items-center ${
                  match.winner_id === team1?.id ? 'text-amber-800' : ''
                }`}>
                  {match.winner_id === team1?.id && <span className="mr-1 text-yellow-500">👑</span>}
                  {team1?.name || '待定'}
                </div>
                {team1 && (
                  <div className="text-xs text-gray-600 mt-1">
                    {team1.player1_name} / {team1.player2_name}
                  </div>
                )}
              </div>
              <div className={`text-xl font-bold ml-2 ${
                match.winner_id === team1?.id ? 'text-amber-700' : ''
              }`}>
                {match.team1_score || 0}
              </div>
            </div>
          </div>
          
          {/* VS Divider */}
          <div className="text-center text-xs text-gray-400 font-medium my-1">VS</div>
          
          {/* Team 2 */}
          <div className={`p-3 rounded-lg relative ${
            match.winner_id === team2?.id ? 'bg-gradient-to-r from-yellow-100 to-amber-100 border-2 border-amber-400 shadow-lg' : 'bg-gray-50'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className={`font-semibold text-sm flex items-center ${
                  match.winner_id === team2?.id ? 'text-amber-800' : ''
                }`}>
                  {match.winner_id === team2?.id && <span className="mr-1 text-yellow-500">👑</span>}
                  {team2?.name || '待定'}
                </div>
                {team2 && (
                  <div className="text-xs text-gray-600 mt-1">
                    {team2.player1_name} / {team2.player2_name}
                  </div>
                )}
              </div>
              <div className={`text-xl font-bold ml-2 ${
                match.winner_id === team2?.id ? 'text-amber-700' : ''
              }`}>
                {match.team2_score || 0}
              </div>
            </div>
          </div>
          
          {/* Winner Badge */}
          {match.winner_id && (
            <div className="mt-3 text-center">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-md">
                🏆 获胜者: {match.winner_id === team1?.id ? team1?.name : team2?.name}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };



  // 检查各轮比赛是否完成
  const areQuarterFinalsComplete = () => {
    return quarterFinals.length === 4 && quarterFinals.every(match => match.match_status === 'completed');
  };

  const areSemiFinalsComplete = () => {
    return semiFinals.length === 2 && semiFinals.every(match => match.match_status === 'completed');
  };

  const isFinalsComplete = () => {
    return finals.length === 1 && finals[0].match_status === 'completed';
  };

  const getChampion = () => {
    if (isFinalsComplete()) {
      return getTeamById(finals[0].winner_id);
    }
    return null;
  };

  const champion = getChampion();
  const runnerUp = getRunnerUp();
  const thirdPlace = getThirdPlace();
  const semiTeams = getSemiFinalTeams();
  const finalTeams = getFinalTeams();

  return (
    <div className="w-full overflow-x-auto bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8 rounded-2xl shadow-2xl border border-white/20">
      <div className="min-w-[1400px] min-h-[800px] flex flex-row justify-between items-center relative">
        {/* 四分之一决赛 - 左侧 */}
        <div className="flex flex-col items-center space-y-8">
          <div className="text-center font-bold text-xl text-indigo-800 bg-gradient-to-r from-white to-indigo-50 px-6 py-3 rounded-xl shadow-lg border border-indigo-200">1/4决赛</div>
          <div className="flex flex-col space-y-8">
            {quarterFinals[0] && renderMatchPair(quarterFinals[0], getTeamById(quarterFinals[0].team1_id), getTeamById(quarterFinals[0].team2_id), 'quarterfinals')}
            {quarterFinals[1] && renderMatchPair(quarterFinals[1], getTeamById(quarterFinals[1].team1_id), getTeamById(quarterFinals[1].team2_id), 'quarterfinals')}
            {quarterFinals[2] && renderMatchPair(quarterFinals[2], getTeamById(quarterFinals[2].team1_id), getTeamById(quarterFinals[2].team2_id), 'quarterfinals')}
            {quarterFinals[3] && renderMatchPair(quarterFinals[3], getTeamById(quarterFinals[3].team1_id), getTeamById(quarterFinals[3].team2_id), 'quarterfinals')}
          </div>
        </div>

        {/* 半决赛 - 中左 */}
        <div className="flex flex-col items-center space-y-16">
          <div className="text-center font-bold text-xl text-purple-800 bg-gradient-to-r from-white to-purple-50 px-6 py-3 rounded-xl shadow-lg border border-purple-200">半决赛</div>
          <div className="flex flex-col space-y-32">
            {semiFinals[0] && renderMatchPair(semiFinals[0], getTeamById(semiFinals[0].team1_id), getTeamById(semiFinals[0].team2_id), 'semifinals')}
            {semiFinals[1] && renderMatchPair(semiFinals[1], getTeamById(semiFinals[1].team1_id), getTeamById(semiFinals[1].team2_id), 'semifinals')}
          </div>
        </div>

        {/* 决赛 - 中右 */}
        <div className="flex flex-col items-center space-y-16">
          <div className="text-center font-bold text-xl text-pink-800 bg-gradient-to-r from-white to-pink-50 px-6 py-3 rounded-xl shadow-lg border border-pink-200">决赛</div>
          {finalMatch && renderMatchPair(finalMatch, finalTeams.team1 || null, finalTeams.team2 || null, 'finals')}
        </div>

        {/* 排名区域 - 右侧 */}
        <div className="flex flex-col items-center space-y-6">
          <div className="text-center font-bold text-xl text-gray-800 mb-4 bg-gradient-to-r from-white to-gray-50 px-6 py-3 rounded-xl shadow-lg border border-gray-200">排名</div>
          
          {/* 冠军 */}
          <div className="w-full">
            {champion ? (
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-6 py-4 rounded-lg shadow-lg">
                <div className="text-xl font-bold mb-2 flex items-center justify-center">
                  🥇 <span className="ml-2">第一名</span>
                </div>
                <div className="text-lg font-semibold text-center">{champion.name}</div>
                <div className="text-sm opacity-90 mt-1 text-center">
                  {champion.player1_name} / {champion.player2_name}
                </div>
              </div>
            ) : (
              <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg px-6 py-4 flex flex-col items-center justify-center text-gray-500">
                <div className="text-lg font-medium">🥇 第一名</div>
                <div className="text-sm mt-1">待定</div>
              </div>
            )}
          </div>
          
          {/* 亚军 */}
          <div className="w-full">
            {runnerUp ? (
              <div className="bg-gradient-to-r from-gray-400 to-gray-600 text-white px-6 py-3 rounded-lg shadow-lg">
                <div className="text-lg font-bold mb-2 flex items-center justify-center">
                  🥈 <span className="ml-2">第二名</span>
                </div>
                <div className="text-base font-semibold text-center">{runnerUp.name}</div>
                <div className="text-xs opacity-90 mt-1 text-center">
                  {runnerUp.player1_name} / {runnerUp.player2_name}
                </div>
              </div>
            ) : (
              <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg px-6 py-3 flex flex-col items-center justify-center text-gray-500">
                <div className="text-base font-medium">🥈 第二名</div>
                <div className="text-xs mt-1">待定</div>
              </div>
            )}
          </div>
          
          {/* 季军 */}
          <div className="w-full">
            {thirdPlace ? (
              <div className="bg-gradient-to-r from-amber-600 to-orange-700 text-white px-6 py-3 rounded-lg shadow-lg">
                <div className="text-lg font-bold mb-2 flex items-center justify-center">
                  🥉 <span className="ml-2">第三名</span>
                </div>
                <div className="text-base font-semibold text-center">{thirdPlace.name}</div>
                <div className="text-xs opacity-90 mt-1 text-center">
                  {thirdPlace.player1_name} / {thirdPlace.player2_name}
                </div>
              </div>
            ) : (
              <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg px-6 py-3 flex flex-col items-center justify-center text-gray-500">
                <div className="text-base font-medium">🥉 第三名</div>
                <div className="text-xs mt-1">待定</div>
              </div>
            )}
          </div>
        </div>

        {/* SVG连接线系统已移除 - 界面更简洁 */}
      </div>

        {/* 比赛统计 */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center text-sm text-slate-600 bg-white rounded-lg p-4 shadow-sm">
          <div className="flex justify-center space-x-8">
            <span>总比赛: {matches.length}</span>
            <span>已完成: {matches.filter(m => m.match_status === 'completed').length}</span>
            <span>进行中: {matches.filter(m => m.match_status === 'in_progress').length}</span>
          </div>
        </div>
    </div>
  );
};

export default EightTeamBracket;