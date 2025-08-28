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

  const renderMatchPair = (match: Match | undefined, round: string, showAdvancedTeams: boolean = true) => {
    // 对于半决赛和决赛，只有当前一轮比赛完成时才显示队伍
    if (!match || !showAdvancedTeams) {
      return (
        <div className="flex flex-col items-center space-y-6">
          <div className="w-36 h-18 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-gray-500 text-sm font-medium">待定</span>
          </div>
          <div className="w-36 h-18 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-gray-500 text-sm font-medium">待定</span>
          </div>
        </div>
      );
    }

    const team1 = getTeamById(match.team1_id);
    const team2 = getTeamById(match.team2_id);
    const winner = match.winner_id ? getTeamById(match.winner_id) : null;

    return (
      <div className="flex flex-col items-center space-y-6 relative">
        <div className="relative">
          {renderTeamBox(team1, winner?.id === team1?.id, 'top')}
        </div>
        {match.team1_score !== null && match.team2_score !== null && (
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-2 border-white rounded-lg px-3 py-2 text-sm font-bold z-20 shadow-lg">
            {match.team1_score}-{match.team2_score}
          </div>
        )}
        <div className="relative">
          {renderTeamBox(team2, winner?.id === team2?.id, 'bottom')}
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

  return (
    <div className="w-full overflow-y-auto bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8 rounded-2xl shadow-2xl border border-white/20">
      <div className="min-h-[1200px] flex flex-col justify-between items-center relative">
        {/* 冠军 - 顶部 */}
        <div className="flex flex-row items-center">
          <div className="text-center font-bold text-xl text-yellow-800 mr-8 bg-gradient-to-r from-white to-yellow-50 px-6 py-3 rounded-xl shadow-lg border border-yellow-200">冠军</div>
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

        {/* 决赛 */}
        <div className="flex flex-row items-center space-x-32">
          <div className="text-center font-bold text-xl text-pink-800 bg-gradient-to-r from-white to-pink-50 px-6 py-3 rounded-xl shadow-lg border border-pink-200">决赛</div>
          {renderMatchPair(finalMatch, 'final', areSemiFinalsComplete())}
        </div>

        {/* 半决赛 */}
        <div className="flex flex-row items-center space-x-16">
          <div className="text-center font-bold text-xl text-purple-800 bg-gradient-to-r from-white to-purple-50 px-6 py-3 rounded-xl shadow-lg border border-purple-200">半决赛</div>
          <div className="flex space-x-32">
            {renderMatchPair(semiFinals[0], 'semi', areQuarterFinalsComplete())}
            {renderMatchPair(semiFinals[1], 'semi', areQuarterFinalsComplete())}
          </div>
        </div>

        {/* 四分之一决赛 - 底部 */}
        <div className="flex flex-row items-center space-x-16">
          <div className="text-center font-bold text-xl text-indigo-800 bg-gradient-to-r from-white to-indigo-50 px-6 py-3 rounded-xl shadow-lg border border-indigo-200">1/4决赛</div>
          <div className="flex space-x-16">
            {renderMatchPair(quarterFinals[0], 'quarter')}
            {renderMatchPair(quarterFinals[1], 'quarter')}
            {renderMatchPair(quarterFinals[2], 'quarter')}
            {renderMatchPair(quarterFinals[3], 'quarter')}
          </div>
        </div>

        {/* SVG连接线系统 - 垂直布局连接线 */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#A855F7" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#C084FC" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          
          {/* 四分之一决赛到半决赛的连接线 */}
          {/* 第1场四分之一决赛到第1场半决赛 */}
          <path
            d="M 300 950 Q 300 900 300 850 Q 300 800 350 750"
            stroke="url(#lineGradient)"
            strokeWidth="3"
            fill="none"
            className="drop-shadow-sm"
          />
          
          {/* 第2场四分之一决赛到第1场半决赛 */}
          <path
            d="M 500 950 Q 500 900 450 850 Q 400 800 350 750"
            stroke="url(#lineGradient)"
            strokeWidth="3"
            fill="none"
            className="drop-shadow-sm"
          />
          
          {/* 第3场四分之一决赛到第2场半决赛 */}
          <path
            d="M 700 950 Q 700 900 750 850 Q 800 800 850 750"
            stroke="url(#lineGradient)"
            strokeWidth="3"
            fill="none"
            className="drop-shadow-sm"
          />
          
          {/* 第4场四分之一决赛到第2场半决赛 */}
          <path
            d="M 900 950 Q 900 900 900 850 Q 900 800 850 750"
            stroke="url(#lineGradient)"
            strokeWidth="3"
            fill="none"
            className="drop-shadow-sm"
          />
          
          {/* 半决赛到决赛的连接线 */}
          {/* 第1场半决赛到决赛 */}
          <path
            d="M 350 650 Q 350 600 500 550 Q 650 500 600 450"
            stroke="url(#lineGradient)"
            strokeWidth="3"
            fill="none"
            className="drop-shadow-sm"
          />
          
          {/* 第2场半决赛到决赛 */}
          <path
            d="M 850 650 Q 850 600 700 550 Q 550 500 600 450"
            stroke="url(#lineGradient)"
            strokeWidth="3"
            fill="none"
            className="drop-shadow-sm"
          />
          
          {/* 决赛到冠军的连接线 */}
          <path
            d="M 600 350 Q 600 300 600 250 Q 600 200 600 150"
            stroke="url(#lineGradient)"
            strokeWidth="3"
            fill="none"
            className="drop-shadow-sm"
          />
        </svg>
      </div>

      {/* 比赛统计 */}
      <div className="mt-8 text-center text-sm text-slate-600 bg-white rounded-lg p-4 shadow-sm">
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