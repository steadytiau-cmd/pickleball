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
      .order('created_at', { ascending: false })
    
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
      case 'elimination': return '混双淘汰赛'
      case 'single_elimination': return '单淘汰赛'
      default: return type
    }
  }

  const getTournamentTypeColor = (type: string) => {
    switch (type) {
      case 'group_stage': return 'bg-blue-100 text-blue-800'
      case 'elimination': return 'bg-purple-100 text-purple-800'
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

  // 为每个小组生成不同的渐变色
  const getGroupGradient = (index: number) => {
    const gradients = [
      'from-blue-500 to-purple-500',
      'from-green-500 to-teal-500', 
      'from-orange-500 to-red-500',
      'from-pink-500 to-rose-500',
      'from-indigo-500 to-blue-500',
      'from-yellow-500 to-orange-500',
      'from-purple-500 to-pink-500',
      'from-teal-500 to-green-500'
    ]
    return gradients[index % gradients.length]
  }

  const renderCumulativeScoreboard = () => {
    // Calculate total scores and wins for each group
    const groupTotalScores = groups.map(group => {
      const groupScores = cumulativeScores
        .filter(score => score.group_id === group.id)
      const totalScore = groupScores.reduce((total, score) => total + score.total_score, 0)
      
      // Calculate total wins for this group
      const groupTeams = teams.filter(team => team.group_id === group.id)
      const totalWins = matches
        .filter(match => 
          match.match_status === 'completed' && 
          match.winner_id && 
          groupTeams.some(team => team.id === match.winner_id)
        ).length
      
      return {
        ...group,
        totalScore,
        totalWins,
        hasTeams: groupScores.length > 0
      }
    }).sort((a, b) => {
      // Sort by wins first, then by total score if wins are equal
      if (a.totalWins !== b.totalWins) {
        return b.totalWins - a.totalWins
      }
      return b.totalScore - a.totalScore
    })

    const getRankIcon = (rank: number) => {
      switch (rank) {
        case 1: return '🥇'
        case 2: return '🥈'
        case 3: return '🥉'
        default: return `#${rank}`
      }
    }

    const getRankColor = (rank: number) => {
      switch (rank) {
        case 1: return 'from-yellow-400 via-yellow-500 to-yellow-600'
        case 2: return 'from-gray-300 via-gray-400 to-gray-500'
        case 3: return 'from-orange-400 via-orange-500 to-orange-600'
        default: return 'from-blue-400 via-blue-500 to-blue-600'
      }
    }

    const getScoreColor = (rank: number) => {
      switch (rank) {
        case 1: return 'text-yellow-600'
        case 2: return 'text-gray-600'
        case 3: return 'text-orange-600'
        default: return 'text-blue-600'
      }
    }

    return (
      <>
        {/* Cumulative Scores by Group */}
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 via-blue-500 to-purple-600 px-6 py-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Trophy className="h-6 w-6 mr-3 animate-pulse" />
              🏆 小组赛总分排行榜 🏆
            </h2>
            <p className="text-green-100 mt-2">男双 + 女双 + 混双 累计分数</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {groupTotalScores.map((group, index) => {
                const rank = index + 1
                return (
                  <div 
                    key={group.id} 
                    className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                      rank === 1 ? 'border-yellow-400 shadow-yellow-200 shadow-lg' :
                      rank === 2 ? 'border-gray-400 shadow-gray-200 shadow-md' :
                      rank === 3 ? 'border-orange-400 shadow-orange-200 shadow-md' :
                      'border-blue-300 shadow-blue-100 shadow-sm'
                    }`}
                  >
                    {/* Animated background gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${getRankColor(rank)} opacity-10 animate-pulse`}></div>
                    
                    <div className="relative p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {/* Rank Badge */}
                          <div className={`flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${getRankColor(rank)} text-white font-bold text-lg shadow-lg`}>
                            {getRankIcon(rank)}
                          </div>
                          
                          {/* Group Info */}
                          <div>
                            <h3 className="text-xl font-bold text-gray-800 flex items-center">
                              <Users className="h-5 w-5 mr-2" />
                              {group.name}
                            </h3>
                            <p className="text-sm text-gray-500">第 {rank} 名</p>
                          </div>
                        </div>
                        
                        {/* Score Display */}
                        <div className="text-right">
                          {group.hasTeams ? (
                            <>
                              <div className="flex flex-col items-end space-y-2">
                                <div className={`text-3xl font-bold ${getScoreColor(rank)} animate-pulse`}>
                                  {group.totalWins}胜
                                </div>
                                <div className={`text-2xl font-semibold ${getScoreColor(rank)}`}>
                                  {group.totalScore}分
                                </div>
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                🏆 胜场 · 🔥 总分
                              </div>
                            </>
                          ) : (
                            <div className="text-gray-400">
                              <div className="text-2xl font-bold">--</div>
                              <div className="text-sm">暂无队伍</div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      {group.hasTeams && groupTotalScores[0].totalScore > 0 && (
                        <div className="mt-4">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full bg-gradient-to-r ${getRankColor(rank)} transition-all duration-1000 ease-out`}
                              style={{ width: `${(group.totalScore / groupTotalScores[0].totalScore) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Competition Stats */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-green-100 to-green-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-700">{groups.length}</div>
                <div className="text-sm text-green-600">参赛小组</div>
              </div>
              <div className="bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-700">
                  {groupTotalScores.reduce((sum, group) => sum + group.totalWins, 0)}
                </div>
                <div className="text-sm text-yellow-600">总胜场数</div>
              </div>
              <div className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-700">
                  {groupTotalScores.reduce((sum, group) => sum + group.totalScore, 0)}
                </div>
                <div className="text-sm text-blue-600">总计分数</div>
              </div>
              <div className="bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-700">
                  {groupTotalScores[0]?.totalWins || 0}胜 · {groupTotalScores[0]?.totalScore || 0}分
                </div>
                <div className="text-sm text-purple-600">第一名成绩</div>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  const renderEliminationScoreboard = () => {
    // Get matches for the selected elimination tournament
    const eliminationMatches = matches.filter(match => 
      match.tournament_id === selectedTournament?.id
    )
    
    // Group matches by round for elimination tournaments
    const getMatchesByRound = () => {
      const rounds = ['qualification', 'round_16', 'quarter_final', 'semi_final', 'final'];
      const matchesByRound: { [key: string]: any[] } = {};
      
      rounds.forEach(round => {
        matchesByRound[round] = eliminationMatches.filter(match => match.match_round === round);
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
    
    const getMatchStatusText = (status: string) => {
      switch (status) {
        case 'completed': return '已完成';
        case 'in_progress': return '进行中';
        case 'scheduled': return '待开始';
        default: return status;
      }
    };
    
    const matchesByRound = getMatchesByRound();
    const rounds = ['qualification', 'round_16', 'quarter_final', 'semi_final', 'final'];
    const activeRounds = rounds.filter(round => matchesByRound[round].length > 0);
    
    if (activeRounds.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">混双淘汰赛对阵图</h2>
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">暂无淘汰赛数据</div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">混双淘汰赛对阵图</h2>
        
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
                            <div className={`w-56 sm:w-60 md:w-64 bg-white rounded-lg border-2 shadow-lg transition-all hover:shadow-xl ${
                              match.match_status === 'completed' ? 'border-green-500' :
                              match.match_status === 'in_progress' ? 'border-yellow-500' :
                              'border-gray-300'
                            }`}>
                              {/* Match Header */}
                              <div className="px-4 py-2 bg-gray-50 rounded-t-lg border-b">
                                <div className="flex items-center justify-between">
                                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                    match.match_status === 'completed' ? 'bg-green-100 text-green-800' :
                                    match.match_status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {getMatchStatusText(match.match_status)}
                                  </span>

                                </div>
                              </div>
                              
                              {/* Teams */}
                              <div className="p-4">
                                {/* Team 1 */}
                                <div className={`p-3 rounded-lg mb-2 ${
                                  match.winner_id === match.team1_id ? 'bg-yellow-100 border-2 border-yellow-400' : 'bg-gray-50'
                                }`}>
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="font-semibold text-sm">
                                        {match.team1?.name || '待定'}
                                      </div>
                                      {match.team1 && (
                                        <div className="text-xs text-gray-600 mt-1">
                                          {match.team1.player1_name} / {match.team1.player2_name}
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-xl font-bold ml-2">
                                      {match.team1_score || 0}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* VS Divider */}
                                <div className="text-center text-xs text-gray-400 font-medium my-1">VS</div>
                                
                                {/* Team 2 */}
                                <div className={`p-3 rounded-lg ${
                                  match.winner_id === match.team2_id ? 'bg-yellow-100 border-2 border-yellow-400' : 'bg-gray-50'
                                }`}>
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="font-semibold text-sm">
                                        {match.team2?.name || '待定'}
                                      </div>
                                      {match.team2 && (
                                        <div className="text-xs text-gray-600 mt-1">
                                          {match.team2.player1_name} / {match.team2.player2_name}
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-xl font-bold ml-2">
                                      {match.team2_score || 0}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Winner Badge */}
                                {match.winner_id && (
                                  <div className="mt-3 text-center">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-200 text-yellow-800">
                                      🏆 {match.winner_id === match.team1_id ? match.team1?.name : match.team2?.name}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
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
      </div>
    )
  }

  const renderScoreboard = () => (
    <>
      {/* Tournament Type Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          选择比赛类型
        </label>
        <div className="flex flex-wrap gap-2">
          {/* Group Stage Button */}
          {tournaments.some(t => t.tournament_type === 'group_stage') && (
            <button
              onClick={() => {
                const groupTournament = tournaments.find(t => t.tournament_type === 'group_stage')
                setSelectedTournament(groupTournament || null)
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedTournament?.tournament_type === 'group_stage'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              小组赛
            </button>
          )}
          
          {/* Elimination Tournament Button */}
          {tournaments.some(t => t.tournament_type === 'elimination') && (
            <button
              onClick={() => {
                const eliminationTournament = tournaments.find(t => t.tournament_type === 'elimination')
                setSelectedTournament(eliminationTournament || null)
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedTournament?.tournament_type === 'elimination'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              混双淘汰赛
            </button>
          )}
        </div>
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
                比赛战绩
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