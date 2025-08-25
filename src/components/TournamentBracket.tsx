import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, Match, Team, Tournament } from '../lib/supabase';
import EightTeamBracket from './EightTeamBracket';



interface Group {
  id: number;
  name: string;
}

const TournamentBracket: React.FC = () => {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<number | string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'standard' | 'eight_team'>('standard');

  useEffect(() => {
    fetchData();
    
    // Set up real-time subscriptions
    const matchesSubscription = supabase
      .channel('matches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
        fetchMatches();
      })
      .subscribe();

    const teamsSubscription = supabase
      .channel('teams')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
        fetchTeams();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(matchesSubscription);
      supabase.removeChannel(teamsSubscription);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchTournaments(),
      fetchMatches(),
      fetchTeams(),
      fetchGroups()
    ]);
    setLoading(false);
  };

  const fetchTournaments = async () => {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .order('id');
    
    if (error) {
      console.error('Error fetching tournaments:', error);
    } else {
      setTournaments(data || []);
      if (data && data.length > 0 && !selectedTournament) {
        setSelectedTournament(data[0].id);
      }
    }
  };

  const fetchMatches = async () => {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        team1:teams!matches_team1_id_fkey(*),
        team2:teams!matches_team2_id_fkey(*)
      `)
      .order('scheduled_time');
    
    if (error) {
      console.error('Error fetching matches:', error);
    } else {
      setMatches(data || []);
    }
  };

  const fetchTeams = async () => {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('group_id', { ascending: true })
      .order('team_type', { ascending: true });
    
    if (error) {
      console.error('Error fetching teams:', error);
    } else {
      setTeams(data || []);
    }
  };

  const fetchGroups = async () => {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .order('id');
    
    if (error) {
      console.error('Error fetching groups:', error);
    } else {
      setGroups(data || []);
    }
  };

  const getGroupName = (groupId: number) => {
    const group = groups.find(g => g.id === groupId);
    return group ? group.name : `Group ${groupId}`;
  };

  const getTeamTypeLabel = (teamType: string) => {
    switch (teamType) {
      case 'mens': return '男双';
      case 'womens': return '女双';
      case 'mixed': return '混双';
      default: return teamType;
    }
  };

  // Calculate group standings based on match results
  const calculateGroupStandings = () => {
    const groupStandings: { [groupId: number]: { groupName: string; points: number; matches: { [teamType: string]: { wins: number; losses: number } } } } = {};
    
    // Initialize group standings
    groups.forEach(group => {
      groupStandings[group.id] = {
        groupName: group.name,
        points: 0,
        matches: {
          mens: { wins: 0, losses: 0 },
          womens: { wins: 0, losses: 0 },
          mixed: { wins: 0, losses: 0 }
        }
      };
    });
    
    // Calculate points from completed matches
    filteredMatches
      .filter(match => match.match_status === 'completed' && match.winner_id)
      .forEach(match => {
        const winnerTeam = match.winner_id === match.team1_id ? match.team1 : match.team2;
        const loserTeam = match.winner_id === match.team1_id ? match.team2 : match.team1;
        
        if (winnerTeam && loserTeam) {
          // Winner's group gets 1 point
          if (groupStandings[winnerTeam.group_id]) {
            groupStandings[winnerTeam.group_id].points += 1;
            groupStandings[winnerTeam.group_id].matches[winnerTeam.team_type].wins += 1;
          }
          
          // Loser's group match record
          if (groupStandings[loserTeam.group_id]) {
            groupStandings[loserTeam.group_id].matches[loserTeam.team_type].losses += 1;
          }
        }
      });
    
    return groupStandings;
  };

  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 border-green-300';
      case 'in_progress': return 'bg-yellow-100 border-yellow-300';
      case 'scheduled': return 'bg-gray-100 border-gray-300';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  const getMatchStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'in_progress': return '进行中';
      case 'scheduled': return '待开始';
      default: return status;
    }
  };

  const filteredMatches = selectedTournament 
    ? selectedTournament === 'group_stage_all'
      ? matches.filter(match => {
          const tournament = tournaments.find(t => t.id === match.tournament_id);
          return tournament && tournament.tournament_type === 'group_stage';
        })
      : selectedTournament === 'elimination_all'
        ? matches.filter(match => {
            const tournament = tournaments.find(t => t.id === match.tournament_id);
            return tournament && tournament.tournament_type === 'elimination';
          })
        : matches.filter(match => match.tournament_id === Number(selectedTournament))
    : [];

  const selectedTournamentData = selectedTournament === 'group_stage_all'
    ? {
        id: 'group_stage_all',
        name: '小组赛',
        tournament_type: 'group_stage',
        is_active: tournaments.some(t => t.tournament_type === 'group_stage' && t.is_active),
        team_type: null
      }
    : selectedTournament === 'elimination_all'
    ? {
        id: 'elimination_all',
        name: '淘汰赛',
        tournament_type: 'elimination',
        is_active: tournaments.some(t => t.tournament_type === 'elimination' && t.is_active),
        team_type: null
      }
    : tournaments.find(t => t.id === selectedTournament);

  // Group matches by round for elimination tournaments
  const getMatchesByRound = () => {
    const rounds = ['qualification', 'round_16', 'quarter_final', 'semi_final', 'final'];
    const matchesByRound: { [key: string]: Match[] } = {};
    
    rounds.forEach(round => {
      matchesByRound[round] = filteredMatches.filter(match => match.match_round === round);
    });
    
    return matchesByRound;
  };

  const getRoundLabel = (round: string) => {
    switch (round) {
      case 'qualification': return '资格赛';
      case 'round_16': return '十六强';
      case 'quarter_final': return '四分之一决赛';
      case 'semi_final': return '半决赛';
      case 'final': return '决赛';
      default: return round;
    }
  };

  const handleMatchClick = (match: Match) => {
    // 只有未开始的比赛才能跳转到计分器
    if (match.match_status === 'scheduled') {
      navigate(`/scorer/${match.id}`);
    }
  };

  // Check if current tournament is an 8-team elimination tournament
  const isEightTeamTournament = () => {
    if (selectedTournament === 'elimination_all') {
      const eliminationMatches = filteredMatches.filter(match => 
        tournaments.some(t => t.id === match.tournament_id && t.tournament_type === 'elimination')
      );
      
      // Check if it has the 8-team structure: 4 quarter-finals, 2 semi-finals, 1 final
      const quarterFinals = eliminationMatches.filter(m => m.match_round === 'quarter_final');
      const semiFinals = eliminationMatches.filter(m => m.match_round === 'semi_final');
      const finals = eliminationMatches.filter(m => m.match_round === 'final');
      
      return quarterFinals.length === 4 && semiFinals.length === 2 && finals.length === 1;
    }
    return false;
  };

  const renderEliminationBracket = () => {
    const matchesByRound = getMatchesByRound();
    const rounds = ['qualification', 'round_16', 'quarter_final', 'semi_final', 'final'];
    const activeRounds = rounds.filter(round => matchesByRound[round].length > 0);
    
    if (activeRounds.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">暂无淘汰赛数据</div>
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto pb-4">
        <div className="min-w-max px-4">
          {/* Tournament Bracket Container */}
          <div className="flex items-start justify-center space-x-8 md:space-x-12 lg:space-x-16 py-8">
            {activeRounds.map((round, roundIndex) => {
              const roundMatches = matchesByRound[round];
              const isLastRound = roundIndex === activeRounds.length - 1;
              
              return (
                <div key={round} className="flex flex-col items-center">
                  {/* Round Title */}
                  <div className="mb-6 md:mb-8">
                     <h3 className="text-base md:text-lg font-bold text-gray-900 text-center px-3 md:px-4 py-2 bg-blue-100 rounded-lg whitespace-nowrap">
                       {getRoundLabel(round)}
                     </h3>
                   </div>
                  
                  {/* Matches Container */}
                  <div className="relative">
                    <div className="flex flex-col space-y-8 md:space-y-10 lg:space-y-12">
                      {roundMatches.map((match, matchIndex) => (
                        <div key={match.id} className="relative">
                          {/* Match Card */}
                          <div 
                            className={`w-56 sm:w-60 md:w-64 bg-white rounded-lg border-2 shadow-lg transition-all hover:shadow-xl ${
                              match.match_status === 'completed' ? 'border-green-500' :
                              match.match_status === 'in_progress' ? 'border-yellow-500' :
                              'border-gray-300'
                            } ${
                              match.match_status === 'scheduled' ? 'cursor-pointer hover:bg-blue-50' : ''
                            }`}
                            onClick={() => handleMatchClick(match)}
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
                                    {getRoundLabel(match.match_round)} · {match.team1 ? getTeamTypeLabel(match.team1.team_type) : match.team2 ? getTeamTypeLabel(match.team2.team_type) : ''}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Teams */}
                            <div className="p-4">
                              {/* Team 1 */}
                              <div className={`p-3 rounded-lg mb-2 relative ${
                                match.winner_id === match.team1_id ? 'bg-gradient-to-r from-yellow-100 to-amber-100 border-2 border-amber-400 shadow-lg' : 'bg-gray-50'
                              }`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className={`font-semibold text-sm flex items-center ${
                                      match.winner_id === match.team1_id ? 'text-amber-800' : ''
                                    }`}>
                                      {match.winner_id === match.team1_id && <span className="mr-1 text-yellow-500">👑</span>}
                                      {match.team1?.name || '待定'}
                                    </div>
                                    {match.team1 && (
                                      <div className="text-xs text-gray-600 mt-1">
                                        {match.team1.player1_name} / {match.team1.player2_name}
                                      </div>
                                    )}
                                  </div>
                                  <div className={`text-xl font-bold ml-2 ${
                                    match.winner_id === match.team1_id ? 'text-amber-700' : ''
                                  }`}>
                                    {match.team1_score || 0}
                                  </div>
                                </div>
                              </div>
                              
                              {/* VS Divider */}
                              <div className="text-center text-xs text-gray-400 font-medium my-1">VS</div>
                              
                              {/* Team 2 */}
                              <div className={`p-3 rounded-lg relative ${
                                match.winner_id === match.team2_id ? 'bg-gradient-to-r from-yellow-100 to-amber-100 border-2 border-amber-400 shadow-lg' : 'bg-gray-50'
                              }`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className={`font-semibold text-sm flex items-center ${
                                      match.winner_id === match.team2_id ? 'text-amber-800' : ''
                                    }`}>
                                      {match.winner_id === match.team2_id && <span className="mr-1 text-yellow-500">👑</span>}
                                      {match.team2?.name || '待定'}
                                    </div>
                                    {match.team2 && (
                                      <div className="text-xs text-gray-600 mt-1">
                                        {match.team2.player1_name} / {match.team2.player2_name}
                                      </div>
                                    )}
                                  </div>
                                  <div className={`text-xl font-bold ml-2 ${
                                    match.winner_id === match.team2_id ? 'text-amber-700' : ''
                                  }`}>
                                    {match.team2_score || 0}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Winner Badge */}
                              {match.winner_id && (
                                <div className="mt-3 text-center">
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-md">
                                    🏆 获胜者: {match.winner_id === match.team1_id ? match.team1?.name : match.team2?.name}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Connection Lines to Next Round */}
                          {!isLastRound && (
                            <>
                              {/* Main horizontal line from match to connector */}
                               <div className="absolute top-1/2 -right-4 md:-right-6 lg:-right-8 w-4 md:w-6 lg:w-8 h-0.5 bg-gradient-to-r from-blue-500 to-blue-400 shadow-sm transform -translate-y-0.5 z-10"></div>
                              
                              {/* Vertical connector and next round line for match pairs */}
                              {matchIndex % 2 === 0 && matchIndex + 1 < roundMatches.length && (
                                <>
                                  {/* Vertical line connecting paired matches */}
                                    <div className="absolute -right-4 md:-right-6 lg:-right-8 w-0.5 bg-gradient-to-b from-blue-500 to-blue-400 shadow-sm z-10 h-32 md:h-40 lg:h-48 top-1/2 transform -translate-y-1/2"></div>
                                    
                                    {/* Horizontal line from connector to next round */}
                                    <div className="absolute -right-8 md:-right-12 lg:-right-16 w-4 md:w-6 lg:w-8 h-0.5 bg-gradient-to-r from-blue-500 to-blue-400 shadow-sm z-10" style={{
                                      top: `calc(50% + 2rem)` // Adjusted for responsive spacing
                                    }}></div>
                                  
                                  {/* Connection point indicators */}
                                   <div className="absolute -right-4 md:-right-6 lg:-right-8 w-2 h-2 bg-blue-500 rounded-full shadow-sm z-20 top-1/2 transform translate-x-1/2 -translate-y-1/2"></div>
                                   
                                   <div className="absolute -right-8 md:-right-12 lg:-right-16 w-2 h-2 bg-blue-500 rounded-full shadow-sm z-20 transform translate-x-1/2 -translate-y-1/2" style={{
                                     top: `calc(50% + 2rem)`
                                   }}></div>
                                </>
                              )}
                              
                              {/* Single match connection (odd index matches) */}
                               {matchIndex % 2 === 1 && (
                                 <>
                                   {/* Connection point for the second match in pair */}
                                   <div className="absolute -right-4 md:-right-6 lg:-right-8 w-2 h-2 bg-blue-500 rounded-full shadow-sm z-20 top-1/2 transform translate-x-1/2 -translate-y-1/2"></div>
                                 </>
                               )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Champion Section */}
          {(() => {
            const finalMatch = matchesByRound['final'][0];
            if (finalMatch && finalMatch.winner_id) {
              const winner = finalMatch.winner_id === finalMatch.team1_id ? finalMatch.team1 : finalMatch.team2;
              return (
                <div className="mt-12 text-center">
                  <div className="inline-block bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-8 py-4 rounded-lg shadow-lg">
                    <div className="text-2xl font-bold mb-2">🏆 冠军</div>
                    <div className="text-xl font-semibold">{winner?.name}</div>
                    {winner && (
                      <div className="text-sm opacity-90 mt-1">
                        {winner.player1_name} / {winner.player2_name}
                      </div>
                    )}
                  </div>
                </div>
              );
            }
            return null;
          })()
          }
        </div>
      </div>
    );
  };

  const renderGroupStageMatches = () => {
    // 按轮次分组比赛
    const matchesByRound = filteredMatches.reduce((acc, match) => {
      const round = match.match_round || 1;
      if (!acc[round]) {
        acc[round] = [];
      }
      acc[round].push(match);
      return acc;
    }, {} as Record<number, typeof filteredMatches>);

    // 计算统计信息
    const totalMatches = filteredMatches.length;
    const completedMatches = filteredMatches.filter(m => m.match_status === 'completed').length;
    const inProgressMatches = filteredMatches.filter(m => m.match_status === 'in_progress').length;
    const upcomingMatches = filteredMatches.filter(m => m.match_status === 'scheduled').length;

    return (
      <div className="space-y-6">
        {/* 比赛统计概览 */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">比赛概览</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{totalMatches}</div>
              <div className="text-sm text-gray-600">总比赛数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{completedMatches}</div>
              <div className="text-sm text-gray-600">已完成</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{inProgressMatches}</div>
              <div className="text-sm text-gray-600">进行中</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{upcomingMatches}</div>
              <div className="text-sm text-gray-600">待开始</div>
            </div>
          </div>
        </div>

        {/* 按轮次显示比赛 */}
        {Object.entries(matchesByRound)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([round, matches]) => (
            <div key={round} className="space-y-4">
              <div className="flex items-center space-x-2">
                <h4 className="text-lg font-semibold text-gray-900">{getRoundLabel(round)}</h4>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {matches.length} 场比赛
                </span>
              </div>
              
              <div className="grid gap-4">
                {matches.map((match) => (
                  <div
                    key={match.id}
                    className={`border-2 rounded-lg p-6 transition-all hover:shadow-lg ${
                      getMatchStatusColor(match.match_status)
                    } ${
                      match.match_status === 'scheduled' ? 'cursor-pointer hover:bg-blue-50' : ''
                    }`}
                    onClick={() => handleMatchClick(match)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {getRoundLabel(match.match_round)} · {match.team1 ? getTeamTypeLabel(match.team1.team_type) : match.team2 ? getTeamTypeLabel(match.team2.team_type) : ''}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          match.match_status === 'completed' ? 'bg-green-200 text-green-800' :
                          match.match_status === 'in_progress' ? 'bg-yellow-200 text-yellow-800' :
                          'bg-gray-200 text-gray-800'
                        }`}>
                          {getMatchStatusText(match.match_status)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(match.scheduled_time).toLocaleString('zh-CN')}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Team 1 */}
                      <div className={`flex-1 text-center p-4 rounded-lg relative ${
                        match.winner_id === match.team1_id ? 'bg-gradient-to-r from-yellow-100 to-amber-100 border-2 border-amber-400 shadow-lg' : 'bg-white'
                      }`}>
                        <div className={`font-semibold text-lg text-gray-900 flex items-center justify-center ${
                          match.winner_id === match.team1_id ? 'text-amber-800' : ''
                        }`}>
                          {match.winner_id === match.team1_id && <span className="mr-1 text-yellow-500">👑</span>}
                          {match.team1 ? match.team1.name : 'TBD'}
                        </div>
                        {match.team1 && (
                          <>
                            <div className="text-sm text-gray-600 mb-1">
                              {getTeamTypeLabel(match.team1.team_type)}
                            </div>
                            <div className="text-sm text-gray-700">
                              {match.team1.player1_name} / {match.team1.player2_name}
                            </div>
                          </>
                        )}
                        {match.match_status === 'completed' && (
                          <div className={`text-2xl font-bold mt-2 ${
                            match.winner_id === match.team1_id ? 'text-amber-700' : 'text-gray-900'
                          }`}>
                            {match.team1_score}
                          </div>
                        )}
                      </div>

                      {/* VS */}
                      <div className="px-6">
                        <div className="text-2xl font-bold text-gray-400">VS</div>
                      </div>

                      {/* Team 2 */}
                      <div className={`flex-1 text-center p-4 rounded-lg relative ${
                        match.winner_id === match.team2_id ? 'bg-gradient-to-r from-yellow-100 to-amber-100 border-2 border-amber-400 shadow-lg' : 'bg-white'
                      }`}>
                        <div className={`font-semibold text-lg text-gray-900 flex items-center justify-center ${
                          match.winner_id === match.team2_id ? 'text-amber-800' : ''
                        }`}>
                          {match.winner_id === match.team2_id && <span className="mr-1 text-yellow-500">👑</span>}
                          {match.team2 ? match.team2.name : 'TBD'}
                        </div>
                        {match.team2 && (
                          <>
                            <div className="text-sm text-gray-600 mb-1">
                              {getTeamTypeLabel(match.team2.team_type)}
                            </div>
                            <div className="text-sm text-gray-700">
                              {match.team2.player1_name} / {match.team2.player2_name}
                            </div>
                          </>
                        )}
                        {match.match_status === 'completed' && (
                          <div className={`text-2xl font-bold mt-2 ${
                            match.winner_id === match.team2_id ? 'text-amber-700' : 'text-gray-900'
                          }`}>
                            {match.team2_score}
                          </div>
                        )}
                      </div>
                    </div>

                    {match.winner_id && (
                      <div className="mt-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-md">
                          🏆 获胜者: {match.winner_id === match.team1_id 
                            ? (match.team1 ? match.team1.name : 'Team 1')
                            : (match.team2 ? match.team2.name : 'Team 2')
                          }
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Tournament Selection */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">比赛战绩</h1>
        
        <div className="flex flex-wrap gap-2 mb-6">
          {/* Group Stage Button - Single button for all group stage tournaments */}
          {tournaments.some(t => t.tournament_type === 'group_stage') && (
            <button
              onClick={() => {
                // Select the first group stage tournament or create a virtual selection
                const groupTournament = tournaments.find(t => t.tournament_type === 'group_stage');
                if (groupTournament) {
                  setSelectedTournament('group_stage_all');
                }
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedTournament === 'group_stage_all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              小组赛
            </button>
          )}
          
          {/* Elimination Tournament Button - Single button for all elimination tournaments */}
          {tournaments.some(t => t.tournament_type === 'elimination') && (
            <button
              onClick={() => {
                // Select the first elimination tournament or create a virtual selection
                const eliminationTournament = tournaments.find(t => t.tournament_type === 'elimination');
                if (eliminationTournament) {
                  setSelectedTournament('elimination_all');
                }
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedTournament === 'elimination_all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              淘汰赛
            </button>
          )}
        </div>

        {/* View Mode Toggle for 8-team tournaments */}
        {selectedTournament === 'elimination_all' && isEightTeamTournament() && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setViewMode('standard')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'standard'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              标准视图
            </button>
            <button
              onClick={() => setViewMode('eight_team')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'eight_team'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              8队专用视图
            </button>
          </div>
        )}
      </div>

      {selectedTournamentData && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedTournamentData.name}
            </h2>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                selectedTournamentData.tournament_type === 'group_stage' ? 'bg-blue-100 text-blue-800' :
                'bg-purple-100 text-purple-800'
              }`}>
                {selectedTournamentData.tournament_type === 'group_stage' ? '小组赛' : '淘汰赛'}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                selectedTournamentData.is_active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {selectedTournamentData.is_active ? '进行中' : '未开始'}
              </span>
              {selectedTournamentData.team_type && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {getTeamTypeLabel(selectedTournamentData.team_type)}
                </span>
              )}
            </div>
          </div>
          <p className="text-gray-600">{selectedTournamentData.tournament_type || '锦标赛'}</p>
        </div>
      )}

      {/* Dynamic Content Based on Tournament Type */}
      <div className="grid gap-6">
        {filteredMatches.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">暂无比赛安排</div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            {selectedTournamentData?.tournament_type === 'elimination' ? (
              <>
                <h3 className="text-xl font-bold text-gray-900 mb-6">淘汰赛对阵图</h3>
                {viewMode === 'eight_team' && isEightTeamTournament() ? (
                  <EightTeamBracket 
                    matches={filteredMatches}
                    teams={teams}
                    onMatchClick={handleMatchClick}
                  />
                ) : (
                  renderEliminationBracket()
                )}
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold text-gray-900 mb-6">小组赛对阵</h3>
                {renderGroupStageMatches()}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentBracket;