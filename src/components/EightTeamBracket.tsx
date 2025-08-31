import React from 'react';
import { Crown } from 'lucide-react';
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

  const renderTeamBox = (team: Team | undefined, isWinner: boolean = false, position: 'top' | 'bottom' = 'top') => {
    if (!team) {
      return (
        <div className="w-36 h-18 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 rounded-xl flex items-center justify-center shadow-sm">
          <span className="text-gray-500 text-sm font-medium">待定</span>
        </div>
      );
    }

    return (
      <div className={`w-36 h-18 border-2 rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
        isWinner 
          ? 'bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 border-blue-500 text-blue-900 shadow-lg ring-2 ring-blue-300 ring-opacity-50' 
          : 'bg-gradient-to-br from-white to-gray-50 border-gray-400 text-gray-800 shadow-md hover:shadow-lg'
      }`}>
        <div className="text-center leading-tight px-2">
          <div className="font-semibold">{team.player1_name}</div>
          <div className="text-xs text-gray-500 font-light">/</div>
          <div className="font-semibold">{team.player2_name}</div>
        </div>
        {isWinner && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">✓</span>
          </div>
        )}
      </div>
    );
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

  // 渲染比赛对阵
  const renderMatchPair = (match: Match, team1: Team | null, team2: Team | null, round: string) => {
    const getTeamDisplay = (team: Team | null) => {
      if (!team) return { name: '待定', players: '等待晋级' };
      return {
        name: team.name,
        players: `${team.player1_name} / ${team.player2_name}`
      };
    };

    const team1Display = getTeamDisplay(team1);
    const team2Display = getTeamDisplay(team2);
    const isCompleted = match.match_status === 'completed';
    const winner = match.winner_id ? getTeamById(match.winner_id) : null;
    
    const getRoundTitle = (round: string) => {
      switch(round) {
        case 'quarterfinals': return '1/4决赛';
        case 'semifinals': return '半决赛';
        case 'finals': return '决赛';
        default: return '';
      }
    };

    return (
      <div className="bg-white rounded-lg border-2 border-gray-200 p-3 min-w-[200px] shadow-sm">
        <div className="text-center text-sm font-semibold text-gray-600 mb-2">
          {getRoundTitle(round)}
        </div>
        
        <div className="space-y-2">
          <div className={`p-2 rounded transition-colors ${
            winner?.id === team1?.id ? 'bg-green-100 border-green-300 border-2' : 
            team1 ? 'bg-gray-50 border border-gray-200' : 'bg-gray-100 border border-dashed border-gray-300'
          }`}>
            <div className={`font-medium text-sm ${
              team1 ? 'text-gray-900' : 'text-gray-500 italic'
            }`}>{team1Display.name}</div>
            <div className={`text-xs ${
              team1 ? 'text-gray-600' : 'text-gray-400'
            }`}>{team1Display.players}</div>
            {isCompleted && team1 && (
              <div className="text-right text-sm font-bold text-blue-600">
                {match.team1_score || 0}
              </div>
            )}
          </div>
          
          <div className="text-center text-xs text-gray-500 font-semibold py-1">
            <span className="bg-gray-200 px-2 py-1 rounded">VS</span>
          </div>
          
          <div className={`p-2 rounded transition-colors ${
            winner?.id === team2?.id ? 'bg-green-100 border-green-300 border-2' : 
            team2 ? 'bg-gray-50 border border-gray-200' : 'bg-gray-100 border border-dashed border-gray-300'
          }`}>
            <div className={`font-medium text-sm ${
              team2 ? 'text-gray-900' : 'text-gray-500 italic'
            }`}>{team2Display.name}</div>
            <div className={`text-xs ${
              team2 ? 'text-gray-600' : 'text-gray-400'
            }`}>{team2Display.players}</div>
            {isCompleted && team2 && (
              <div className="text-right text-sm font-bold text-blue-600">
                {match.team2_score || 0}
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-3 text-center">
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
            isCompleted ? 'bg-green-100 text-green-800' : 
            (team1 && team2) ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
          }`}>
            {isCompleted ? '已完成' : (team1 && team2) ? '进行中' : '等待对阵'}
          </span>
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
            {semiFinals[0] && renderMatchPair(semiFinals[0], semiTeams[0]?.team1 || null, semiTeams[0]?.team2 || null, 'semifinals')}
            {semiFinals[1] && renderMatchPair(semiFinals[1], semiTeams[1]?.team1 || null, semiTeams[1]?.team2 || null, 'semifinals')}
          </div>
        </div>

        {/* 决赛 - 中右 */}
        <div className="flex flex-col items-center space-y-16">
          <div className="text-center font-bold text-xl text-pink-800 bg-gradient-to-r from-white to-pink-50 px-6 py-3 rounded-xl shadow-lg border border-pink-200">决赛</div>
          {finalMatch && renderMatchPair(finalMatch, finalTeams.team1 || null, finalTeams.team2 || null, 'finals')}
        </div>

        {/* 冠军 - 右侧 */}
        <div className="flex flex-col items-center">
          <div className="text-center font-bold text-xl text-yellow-800 mb-8 bg-gradient-to-r from-white to-yellow-50 px-6 py-3 rounded-xl shadow-lg border border-yellow-200">冠军</div>
          <div className="w-48 h-32 bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 border-4 border-yellow-200 rounded-2xl flex flex-col items-center justify-center text-white shadow-2xl transform hover:scale-105 transition-all duration-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-200/30 to-transparent"></div>
            <Crown className="w-10 h-10 mb-2 text-yellow-100 relative z-10 drop-shadow-lg" />
            {champion ? (
              <div className="text-center relative z-10">
                <div className="font-bold text-lg mb-2 drop-shadow-md">🏆</div>
                <div className="text-sm leading-tight font-semibold drop-shadow-sm">
                  <div>{champion.player1_name}</div>
                  <div className="text-yellow-100">/</div>
                  <div>{champion.player2_name}</div>
                </div>
              </div>
            ) : (
              <div className="text-lg font-bold relative z-10 drop-shadow-md">待定</div>
            )}
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-red-400 to-red-600 rounded-full opacity-20"></div>
            <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full opacity-20"></div>
          </div>
        </div>

        {/* SVG连接线系统 - 水平布局连接线 */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#A855F7" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#C084FC" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          
          {/* 四分之一决赛到半决赛的连接线 */}
          {/* 第1场和第2场四分之一决赛到第1场半决赛 */}
          <path
            d="M 220 250 L 280 250 L 280 300 L 340 300"
            stroke="url(#lineGradient)"
            strokeWidth="3"
            fill="none"
            className="drop-shadow-sm"
          />
          <path
            d="M 220 350 L 280 350 L 280 300 L 340 300"
            stroke="url(#lineGradient)"
            strokeWidth="3"
            fill="none"
            className="drop-shadow-sm"
          />
          
          {/* 第3场和第4场四分之一决赛到第2场半决赛 */}
          <path
            d="M 220 450 L 280 450 L 280 500 L 340 500"
            stroke="url(#lineGradient)"
            strokeWidth="3"
            fill="none"
            className="drop-shadow-sm"
          />
          <path
            d="M 220 550 L 280 550 L 280 500 L 340 500"
            stroke="url(#lineGradient)"
            strokeWidth="3"
            fill="none"
            className="drop-shadow-sm"
          />
          
          {/* 半决赛到决赛的连接线 */}
          <path
            d="M 520 300 L 580 300 L 580 400 L 640 400"
            stroke="url(#lineGradient)"
            strokeWidth="3"
            fill="none"
            className="drop-shadow-sm"
          />
          <path
            d="M 520 500 L 580 500 L 580 400 L 640 400"
            stroke="url(#lineGradient)"
            strokeWidth="3"
            fill="none"
            className="drop-shadow-sm"
          />
          
          {/* 决赛到冠军的连接线 */}
          <path
            d="M 820 400 L 940 400"
            stroke="url(#lineGradient)"
            strokeWidth="3"
            fill="none"
            className="drop-shadow-sm"
          />
        </svg>
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