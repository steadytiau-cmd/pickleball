import { useEffect, useState } from 'react'
import { supabase, Group, Team, Match, Tournament, TeamCumulativeScore } from '@/lib/supabase'
import { Users, Trophy, Calendar, Clock, Target, Calculator } from 'lucide-react'
import TournamentBracket from '@/components/TournamentBracket'
import PickleballScoreCalculator from '@/components/PickleballScoreCalculator'

export default function Home() {
  const [activeTab, setActiveTab] = useState('scoreboard')
  const [groups, setGroups] = useState<Group[]>([])
  const [teams, setTeams] = useState<Team[]>([])  
  const [cumulativeScores, setCumulativeScores] = useState<TeamCumulativeScore[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
    
    // Set up real-time subscriptions
    const teamsSubscription = supabase
      .channel('teams')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
        fetchTeams()
      })
      .subscribe()

    const matchesSubscription = supabase
      .channel('matches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
        fetchMatches()
        fetchCumulativeScores() // Update cumulative scores when matches change
      })
      .subscribe()

    return () => {
      supabase.removeChannel(teamsSubscription)
      supabase.removeChannel(matchesSubscription)
    }
  }, [])

  const fetchData = async () => {
    await Promise.all([fetchGroups(), fetchTeams(), fetchMatches(), fetchTournaments(), fetchCumulativeScores()])
    setLoading(false)
  }

  const fetchGroups = async () => {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .order('name')
    
    if (error) {
      console.error('Error fetching groups:', error)
    } else {
      setGroups(data || [])
    }
  }

  const fetchTeams = async () => {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        group:groups(*)
      `)
      .eq('is_active', true)
      .order('wins', { ascending: false })
    
    if (error) {
      console.error('Error fetching teams:', error)
    } else {
      setTeams(data || [])
    }
  }

  const fetchMatches = async () => {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        team1:teams!matches_team1_id_fkey(*),
        team2:teams!matches_team2_id_fkey(*),
        tournament:tournaments(*)
      `)
      .in('match_status', ['in_progress', 'completed'])
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (error) {
      console.error('Error fetching matches:', error)
    } else {
      setMatches(data || [])
    }
  }

  const fetchTournaments = async () => {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('is_active', true)
      .order('start_date', { ascending: false })
    
    if (error) {
      console.error('Error fetching tournaments:', error)
    } else {
      setTournaments(data || [])
      // Set the first tournament as default if none selected
      if (data && data.length > 0 && !selectedTournament) {
        setSelectedTournament(data[0])
      }
    }
  }

  const fetchCumulativeScores = async () => {
    const { data, error } = await supabase
      .from('team_cumulative_scores')
      .select('*')
      .order('total_score', { ascending: false })
    
    if (error) {
      console.error('Error fetching cumulative scores:', error)
    } else {
      setCumulativeScores(data || [])
    }
  }

  const getTeamsByGroup = (groupId: number) => {
    return teams.filter(team => team.group_id === groupId)
  }

  const getTeamTypeColor = (teamType: string) => {
    switch (teamType) {
      case 'mens': return 'bg-blue-100 text-blue-800'
      case 'womens': return 'bg-pink-100 text-pink-800'
      case 'mixed': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTeamTypeLabel = (teamType: string) => {
    switch (teamType) {
      case 'mens': return '男双'
      case 'womens': return '女双'
      case 'mixed': return '混双'
      default: return teamType
    }
  }

  const getTournamentTypeLabel = (type: string) => {
    switch (type) {
      case 'group_stage': return '小组赛'
      case 'single_elimination': return '单淘汰赛'
      default: return type
    }
  }

  const getTournamentTypeColor = (type: string) => {
    switch (type) {
      case 'group_stage': return 'bg-blue-100 text-blue-800'
      case 'single_elimination': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'scoreboard':
        return renderScoreboard()
      case 'bracket':
        return <TournamentBracket />
      case 'calculator':
        return <PickleballScoreCalculator />
      default:
        return renderScoreboard()
    }
  }

  const renderCumulativeScoreboard = () => (
    <>
      {/* Cumulative Scores by Group */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {groups.map((group) => {
          const groupScores = cumulativeScores.filter(score => score.group_id === group.id)
          return (
            <div key={group.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-blue-500 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  {group.name} - 累计总分
                </h2>
              </div>
              <div className="p-6">
                {groupScores.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">暂无队伍</p>
                ) : (
                  <div className="space-y-3">
                    {['mens', 'womens', 'mixed'].map((teamType) => {
                      const typeScores = groupScores.filter(score => score.team_type === teamType)
                        .sort((a, b) => b.total_score - a.total_score)
                      return (
                        <div key={teamType}>
                          <h3 className={`text-sm font-semibold px-2 py-1 rounded-full inline-block mb-2 ${getTeamTypeColor(teamType)}`}>
                            {getTeamTypeLabel(teamType)}
                          </h3>
                          {typeScores.length === 0 ? (
                            <p className="text-gray-400 text-sm ml-2">暂无队伍</p>
                          ) : (
                            <div className="space-y-2">
                              {typeScores.map((score, index) => {
                                const isChampion = index === 0 && score.total_score > 0
                                return (
                                  <div key={score.team_id} className={`flex items-center justify-between p-3 rounded-lg ${
                                    isChampion ? 'bg-yellow-100 border-2 border-yellow-400' : 'bg-gray-50'
                                  }`}>
                                    <div className="flex items-center space-x-3">
                                      <span className={`text-lg font-bold ${
                                        isChampion ? 'text-yellow-600' : 'text-gray-600'
                                      }`}>#{index + 1}</span>
                                      {isChampion && (
                                        <Trophy className="h-5 w-5 text-yellow-500" />
                                      )}
                                      <div>
                                        <p className={`font-semibold ${
                                          isChampion ? 'text-yellow-900' : 'text-gray-900'
                                        }`}>{score.team_name}</p>
                                        <p className="text-sm text-gray-600">
                                          {score.matches_played}场比赛 · {score.wins}胜{score.losses}负
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className={`text-xl font-bold ${
                                        isChampion ? 'text-yellow-600' : 'text-green-600'
                                      }`}>{score.total_score}分</p>
                                      <p className="text-sm text-gray-500">总分</p>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Matches for Selected Tournament */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">最近比赛 - {selectedTournament?.name}</h2>
        </div>
        <div className="p-6">
          {matches.filter(match => match.tournament_id === selectedTournament?.id).length === 0 ? (
            <p className="text-gray-500 text-center py-8">暂无比赛记录</p>
          ) : (
            <div className="space-y-4">
              {matches.filter(match => match.tournament_id === selectedTournament?.id).map((match) => (
                <div key={match.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      match.match_status === 'completed' ? 'bg-green-100 text-green-800' :
                      match.match_status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {match.match_status === 'completed' ? '已完成' :
                       match.match_status === 'in_progress' ? '进行中' : '已安排'}
                    </div>
                    <div>
                      <p className="font-semibold">
                        {match.team1?.name} vs {match.team2?.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {match.tournament?.name} - {match.match_round}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">
                      {match.team1_score} - {match.team2_score}
                    </p>
                    {match.court_number && (
                      <p className="text-sm text-gray-500">场地 {match.court_number}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )

  const renderEliminationScoreboard = () => {
    // Get teams participating in this tournament and their cumulative scores
    const tournamentTeams = cumulativeScores
      .filter(score => {
        // Filter teams that have matches in this tournament
        return matches.some(match => 
          match.tournament_id === selectedTournament?.id && 
          (match.team1_id === score.team_id || match.team2_id === score.team_id)
        )
      })
      .sort((a, b) => b.total_score - a.total_score)
    
    return (
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Target className="h-5 w-5 mr-2" />
            淘汰赛累计总分 - {selectedTournament?.name}
          </h2>
        </div>
        <div className="p-6">
          {tournamentTeams.length === 0 ? (
            <p className="text-gray-500 text-center py-8">暂无参赛队伍</p>
          ) : (
            <>
              {/* Championship Banner */}
              {tournamentTeams.length > 0 && tournamentTeams[0].total_score > 0 && (
                <div className="mb-8 text-center">
                  <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white p-6 rounded-lg shadow-lg">
                    <Trophy className="h-12 w-12 mx-auto mb-2" />
                    <h3 className="text-2xl font-bold mb-1">🏆 冠军</h3>
                    <p className="text-xl">{tournamentTeams[0].team_name}</p>
                    <p className="text-lg opacity-90">总分: {tournamentTeams[0].total_score}分</p>
                  </div>
                </div>
              )}
              
              {/* Team Rankings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">队伍排名（按总分）</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tournamentTeams.map((team, index) => {
                    const isChampion = index === 0 && team.total_score > 0
                    const isTopThree = index < 3 && team.total_score > 0
                    
                    return (
                      <div key={team.team_id} className={`p-4 rounded-lg border-2 ${
                        isChampion ? 'border-yellow-400 bg-yellow-50' :
                        isTopThree ? 'border-green-400 bg-green-50' :
                        'border-gray-200 bg-white'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <span className={`text-2xl font-bold ${
                              isChampion ? 'text-yellow-600' :
                              isTopThree ? 'text-green-600' :
                              'text-gray-600'
                            }`}>#{index + 1}</span>
                            {isChampion && <Trophy className="h-6 w-6 text-yellow-500" />}
                             {isTopThree && !isChampion && <span className="text-lg">{index === 1 ? '🥈' : '🥉'}</span>}
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            getTeamTypeColor(team.team_type)
                          }`}>
                            {getTeamTypeLabel(team.team_type)}
                          </span>
                        </div>
                        
                        <div className="text-center">
                          <h4 className={`font-bold text-lg mb-2 ${
                            isChampion ? 'text-yellow-900' :
                            isTopThree ? 'text-green-900' :
                            'text-gray-900'
                          }`}>{team.team_name}</h4>
                          
                          <div className="space-y-1">
                            <p className={`text-2xl font-bold ${
                              isChampion ? 'text-yellow-600' :
                              isTopThree ? 'text-green-600' :
                              'text-blue-600'
                            }`}>{team.total_score}分</p>
                            <p className="text-sm text-gray-600">
                              {team.matches_played}场比赛
                            </p>
                            <p className="text-sm text-gray-600">
                              {team.wins}胜 {team.losses}负
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  const renderScoreboard = () => (
    <>
      {/* Tournament Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          选择锦标赛
        </label>
        <select
          value={selectedTournament?.id || ''}
          onChange={(e) => {
            const tournament = tournaments.find(t => t.id === parseInt(e.target.value))
            setSelectedTournament(tournament || null)
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">请选择锦标赛</option>
          {tournaments.map((tournament) => (
            <option key={tournament.id} value={tournament.id}>
              {tournament.name} - {getTournamentTypeLabel(tournament.tournament_type)}
            </option>
          ))}
        </select>
      </div>

      {selectedTournament && (
        <div className="mb-4">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTournamentTypeColor(selectedTournament.tournament_type)}`}>
            {getTournamentTypeLabel(selectedTournament.tournament_type)}
          </div>
        </div>
      )}

      {/* Dynamic Scoreboard Display */}
      {selectedTournament ? (
        selectedTournament.tournament_type === 'group_stage' ? (
          renderCumulativeScoreboard()
        ) : (
          renderEliminationScoreboard()
        )
      ) : (
        <div className="text-center py-12">
          <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">请选择一个锦标赛查看计分板</p>
        </div>
      )}
    </>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Trophy className="h-8 w-8 text-yellow-500" />
              <h1 className="text-3xl font-bold text-gray-900">匹克球挑战赛</h1>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>实时更新</span>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('scoreboard')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'scoreboard'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="h-4 w-4 inline mr-2" />
                计分板
              </button>
              <button
                onClick={() => setActiveTab('bracket')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'bracket'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Target className="h-4 w-4 inline mr-2" />
                锦标赛对阵
              </button>
              <button
                onClick={() => setActiveTab('calculator')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'calculator'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Calculator className="h-4 w-4 inline mr-2" />
                计分器
              </button>
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderTabContent()}
      </div>
    </div>
  )
}