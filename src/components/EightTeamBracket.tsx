import React from 'react';
import { Trophy, Medal } from 'lucide-react';
import { Match, Team } from '../lib/supabase';

interface EightTeamBracketProps {
  matches: Match[];
  teams: Team[];
  onMatchClick: (match: Match) => void;
}

const EightTeamBracket: React.FC<EightTeamBracketProps> = ({ matches, teams, onMatchClick }) => {
  const getTeamById = (id: number | null) => {
    if (!id) return null;
    return teams.find(team => team.id === id) || null;
  };

  const getMatchesByRound = (round: string) => {
    return matches.filter(match => match.match_round === round);
  };

  const quarterFinals = getMatchesByRound('quarter_final');
  const semiFinals = getMatchesByRound('semi_final');
  const finals = getMatchesByRound('final');

  const renderTeamCard = (team: Team | null, score: number, isWinner: boolean, matchStatus: 'scheduled' | 'in_progress' | 'completed' | 'cancelled') => {
    if (!team) {
      return (
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-3 text-center">
          <div className="text-gray-400 text-sm">待定</div>
        </div>
      );
    }

    return (
      <div className={`border rounded-lg p-3 transition-all duration-300 transform hover:scale-105 ${
        isWinner && matchStatus === 'completed'
          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-400 shadow-lg ring-2 ring-green-200'
          : 'bg-gradient-to-r from-white to-gray-50 border-gray-200 hover:border-blue-400 hover:shadow-md'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="font-medium text-gray-900 text-sm">{team.name}</div>
            <div className="text-xs text-gray-600">
              {team.player1_name} / {team.player2_name}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {matchStatus === 'completed' && (
              <span className={`text-lg font-bold ${
                isWinner ? 'text-green-600' : 'text-gray-500'
              }`}>
                {score}
              </span>
            )}
            {isWinner && matchStatus === 'completed' && (
              <Medal className="h-4 w-4 text-yellow-500 animate-pulse" />
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderMatch = (match: Match, showScore: boolean = true) => {
    const team1 = getTeamById(match.team1_id);
    const team2 = getTeamById(match.team2_id);
    const isWinner1 = match.winner_id === match.team1_id;
    const isWinner2 = match.winner_id === match.team2_id;

    return (
      <div
        key={match.id}
        className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-4 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-102 hover:border-blue-300"
        onClick={() => onMatchClick(match)}
      >
        <div className="space-y-2">
          {renderTeamCard(team1, match.team1_score, isWinner1, match.match_status)}
          <div className="text-center text-xs text-gray-400 font-medium">VS</div>
          {renderTeamCard(team2, match.team2_score, isWinner2, match.match_status)}
        </div>
        
        {match.match_status === 'scheduled' && (
          <div className="mt-3 text-center">
            <span className="text-xs bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 px-3 py-1 rounded-full font-medium shadow-sm">
              待开始
            </span>
          </div>
        )}
        
        {match.match_status === 'in_progress' && (
          <div className="mt-3 text-center">
            <span className="text-xs bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 px-3 py-1 rounded-full font-medium shadow-sm animate-pulse">
              进行中
            </span>
          </div>
        )}
      </div>
    );
  };



  const getChampion = () => {
    if (finals.length > 0 && finals[0].match_status === 'completed') {
      return getTeamById(finals[0].winner_id);
    }
    return null;
  };

  const champion = getChampion();

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">8队淘汰赛对战图</h2>
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
            <span>待开始</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
            <span>进行中</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
            <span>已完成</span>
          </div>
        </div>
      </div>

      {/* 新的简化布局 */}
      <div className="grid grid-cols-7 gap-4 items-center max-w-7xl mx-auto">
        {/* 四分之一决赛 */}
        <div className="space-y-8">
          <div className="text-center text-sm font-medium text-gray-700 mb-4">四分之一决赛</div>
          {quarterFinals.map((match, index) => (
            <div key={match.id}>
              {renderMatch(match)}
            </div>
          ))}
        </div>

        {/* 连接线1：四分之一决赛到半决赛 */}
        <div className="flex flex-col justify-center items-center h-full">
          <svg width="60" height="400" className="overflow-visible">
            {/* 第1场四分之一决赛到第1场半决赛 */}
            <path d="M 0 50 L 30 50 L 30 100 L 60 100" stroke="#3B82F6" strokeWidth="2" fill="none" />
            {/* 第2场四分之一决赛到第1场半决赛 */}
            <path d="M 0 150 L 30 150 L 30 100 L 60 100" stroke="#3B82F6" strokeWidth="2" fill="none" />
            {/* 第3场四分之一决赛到第2场半决赛 */}
            <path d="M 0 250 L 30 250 L 30 300 L 60 300" stroke="#3B82F6" strokeWidth="2" fill="none" />
            {/* 第4场四分之一决赛到第2场半决赛 */}
            <path d="M 0 350 L 30 350 L 30 300 L 60 300" stroke="#3B82F6" strokeWidth="2" fill="none" />
          </svg>
        </div>

        {/* 半决赛 */}
        <div className="space-y-32">
          <div className="text-center text-sm font-medium text-gray-700 mb-4">半决赛</div>
          {semiFinals.map((match, index) => (
            <div key={match.id}>
              {renderMatch(match)}
            </div>
          ))}
        </div>

        {/* 连接线2：半决赛到决赛 */}
        <div className="flex flex-col justify-center items-center h-full">
          <svg width="60" height="400" className="overflow-visible">
            {/* 第1场半决赛到决赛 */}
            <path d="M 0 100 L 30 100 L 30 200 L 60 200" stroke="#3B82F6" strokeWidth="2" fill="none" />
            {/* 第2场半决赛到决赛 */}
            <path d="M 0 300 L 30 300 L 30 200 L 60 200" stroke="#3B82F6" strokeWidth="2" fill="none" />
          </svg>
        </div>

        {/* 决赛 */}
        <div className="flex flex-col justify-center">
          <div className="text-center text-sm font-medium text-gray-700 mb-4">决赛</div>
          {finals.map((match) => (
            <div key={match.id}>
              {renderMatch(match)}
            </div>
          ))}
        </div>

        {/* 连接线3：决赛到冠军 */}
        <div className="flex flex-col justify-center items-center h-full">
          <svg width="60" height="100" className="overflow-visible">
            <path d="M 0 50 L 60 50" stroke="#3B82F6" strokeWidth="2" fill="none" />
          </svg>
        </div>

        {/* 冠军奖杯 */}
        <div className="flex flex-col items-center justify-center">
          <div className="text-center text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600 mb-4">🏆 冠军 🏆</div>
          <div className="bg-gradient-to-br from-yellow-50 via-yellow-100 to-orange-100 border-3 border-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl p-8 text-center min-h-[140px] flex flex-col items-center justify-center shadow-2xl transform hover:scale-105 transition-all duration-500 relative overflow-hidden">
            {/* 背景装饰 */}
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-200/20 to-orange-200/20 animate-pulse"></div>
            <div className="absolute top-2 right-2 w-4 h-4 bg-yellow-300 rounded-full animate-ping"></div>
            <div className="absolute bottom-2 left-2 w-3 h-3 bg-orange-300 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
            
            <div className="relative z-10">
              <Trophy className="h-16 w-16 text-yellow-600 mb-3 animate-bounce" />
              {champion ? (
                <div className="space-y-2">
                  <div className="font-bold text-yellow-800 text-lg">{champion.name}</div>
                  <div className="text-sm text-yellow-700 font-medium">
                    {champion.player1_name} / {champion.player2_name}
                  </div>
                  <div className="flex items-center justify-center space-x-2 mt-3">
                    <Medal className="h-6 w-6 text-yellow-600 animate-pulse" />
                    <span className="text-xs font-bold text-yellow-800">冠军</span>
                    <Medal className="h-6 w-6 text-yellow-600 animate-pulse" />
                  </div>
                </div>
              ) : (
                <div className="text-yellow-700 text-sm font-medium">待定</div>
              )}
            </div>
          </div>
        </div>
      </div>



      {/* 比赛统计 */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{quarterFinals.length}</div>
          <div className="text-sm text-gray-600">四分之一决赛</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{semiFinals.length}</div>
          <div className="text-sm text-gray-600">半决赛</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{finals.length}</div>
          <div className="text-sm text-gray-600">决赛</div>
        </div>
      </div>
    </div>
  );
};

export default EightTeamBracket;