import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Team {
  id: number;
  name: string;
  group_id: number;
  team_type: 'mens' | 'womens' | 'mixed';
  player1_name: string;
  player2_name: string;
  wins: number;
  losses: number;
}

interface Match {
  id: number;
  tournament_id: number;
  team1_id: number;
  team2_id: number;
  team1_score: number | null;
  team2_score: number | null;
  winner_id: number | null;
  match_round: string;
  match_status: 'scheduled' | 'in_progress' | 'completed';
  court_number: number;
  scheduled_time: string;
  team1?: Team;
  team2?: Team;
}

interface Tournament {
  id: number;
  name: string;
  tournament_type: string;
  team_type: string | null;
  is_active: boolean;
}

interface Group {
  id: number;
  name: string;
}

const TournamentBracket: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

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
    ? matches.filter(match => match.tournament_id === selectedTournament)
    : [];

  const selectedTournamentData = tournaments.find(t => t.id === selectedTournament);

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

  const renderEliminationBracket = () => {
    const matchesByRound = getMatchesByRound();
    const rounds = ['qualification', 'round_16', 'quarter_final', 'semi_final', 'final'];
    
    return (
      <div className="space-y-8">
        {rounds.map((round) => {
          const roundMatches = matchesByRound[round];
          if (roundMatches.length === 0) return null;
          
          return (
            <div key={round} className="">
              <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
                {getRoundLabel(round)}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {roundMatches.map((match) => (
                  <div key={match.id} className={`p-4 rounded-lg border-2 transition-all hover:shadow-lg ${
                    match.match_status === 'completed' ? 'border-green-500 bg-green-50' :
                    match.match_status === 'in_progress' ? 'border-yellow-500 bg-yellow-50' :
                    'border-gray-200 bg-white'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        match.match_status === 'completed' ? 'bg-green-100 text-green-800' :
                        match.match_status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {getMatchStatusText(match.match_status)}
                      </span>
                      <span className="text-xs text-gray-500">场地 {match.court_number}</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className={`flex items-center justify-between p-2 rounded ${
                        match.winner_id === match.team1_id ? 'bg-yellow-100 font-bold' : 'bg-gray-50'
                      }`}>
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            {match.team1?.name || '待定'}
                          </div>
                          {match.team1 && (
                            <div className="text-xs text-gray-600">
                              {match.team1.player1_name} / {match.team1.player2_name}
                            </div>
                          )}
                        </div>
                        <span className="font-bold text-lg ml-2">{match.team1_score || 0}</span>
                      </div>
                      
                      <div className="text-center text-xs text-gray-500 font-medium">VS</div>
                      
                      <div className={`flex items-center justify-between p-2 rounded ${
                        match.winner_id === match.team2_id ? 'bg-yellow-100 font-bold' : 'bg-gray-50'
                      }`}>
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            {match.team2?.name || '待定'}
                          </div>
                          {match.team2 && (
                            <div className="text-xs text-gray-600">
                              {match.team2.player1_name} / {match.team2.player2_name}
                            </div>
                          )}
                        </div>
                        <span className="font-bold text-lg ml-2">{match.team2_score || 0}</span>
                      </div>
                    </div>
                    
                    {match.winner_id && (
                      <div className="mt-3 text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          🏆 {match.winner_id === match.team1_id ? match.team1?.name : match.team2?.name}
                        </span>
                      </div>
                    )}
                    
                    {match.scheduled_time && (
                      <div className="mt-3 text-xs text-gray-500 text-center">
                        {new Date(match.scheduled_time).toLocaleString('zh-CN')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderGroupStageMatches = () => {
    return (
      <div className="grid gap-4">
        {filteredMatches.map((match) => (
          <div
            key={match.id}
            className={`border-2 rounded-lg p-6 transition-all hover:shadow-lg ${
              getMatchStatusColor(match.match_status)
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-600">
                  场地 {match.court_number}
                </span>
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
              <div className={`flex-1 text-center p-4 rounded-lg ${
                match.winner_id === match.team1_id ? 'bg-green-200' : 'bg-white'
              }`}>
                <div className="font-semibold text-lg text-gray-900">
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
                  <div className="text-2xl font-bold mt-2 text-gray-900">
                    {match.team1_score}
                  </div>
                )}
              </div>

              {/* VS */}
              <div className="px-6">
                <div className="text-2xl font-bold text-gray-400">VS</div>
              </div>

              {/* Team 2 */}
              <div className={`flex-1 text-center p-4 rounded-lg ${
                match.winner_id === match.team2_id ? 'bg-green-200' : 'bg-white'
              }`}>
                <div className="font-semibold text-lg text-gray-900">
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
                  <div className="text-2xl font-bold mt-2 text-gray-900">
                    {match.team2_score}
                  </div>
                )}
              </div>
            </div>

            {match.winner_id && (
              <div className="mt-4 text-center">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
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
        <h1 className="text-3xl font-bold text-gray-900 mb-6">锦标赛对阵表</h1>
        
        <div className="flex flex-wrap gap-2 mb-6">
          {tournaments.map((tournament) => (
            <button
              key={tournament.id}
              onClick={() => setSelectedTournament(tournament.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedTournament === tournament.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {tournament.name}
            </button>
          ))}
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
                  {selectedTournamentData.tournament_type === 'group_stage' ? '小组赛' : '单淘汰赛'}
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
      </div>

      {/* Dynamic Content Based on Tournament Type */}
      <div className="grid gap-6">
        {filteredMatches.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">暂无比赛安排</div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            {selectedTournamentData?.tournament_type === 'single_elimination' ? (
              <>
                <h3 className="text-xl font-bold text-gray-900 mb-6">淘汰赛对阵图</h3>
                {renderEliminationBracket()}
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

      {/* Group Standings - Only show for group stage tournaments */}
      {selectedTournamentData?.tournament_type === 'group_stage' && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">小组积分榜</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {['mens', 'womens', 'mixed'].map((teamType) => (
              <div key={teamType} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {getTeamTypeLabel(teamType)}
                  </h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {teams
                    .filter(team => team.team_type === teamType)
                    .sort((a, b) => b.wins - a.wins || (a.losses - b.losses))
                    .map((team, index) => (
                      <div key={team.id} className="px-4 py-3 flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                            <span className="font-medium text-gray-900">
                              {getGroupName(team.group_id)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {team.player1_name} / {team.player2_name}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {team.wins}胜 {team.losses}负
                          </div>
                          <div className="text-xs text-gray-500">
                            胜率: {team.wins + team.losses > 0 
                              ? Math.round((team.wins / (team.wins + team.losses)) * 100) 
                              : 0}%
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentBracket;