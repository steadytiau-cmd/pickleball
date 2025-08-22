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
    // Calculate total scores for each group and sort by highest score
    const groupTotalScores = groups.map(group => {
      const groupScores = cumulativeScores
        .filter(score => score.group_id === group.id)
      const totalScore = groupScores.reduce((total, score) => total + score.total_score, 0)
      return {
        ...group,
        totalScore,
        hasTeams: groupScores.length > 0
      }
    }).sort((a, b) => b.totalScore - a.totalScore)

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
                              <div className={`text-4xl font-bold ${getScoreColor(rank)} animate-pulse`}>
                                {group.totalScore}分
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                🔥 累计总分
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
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-green-100 to-green-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-700">{groups.length}</div>
                <div className="text-sm text-green-600">参赛小组</div>
              </div>
              <div className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-700">
                  {groupTotalScores.reduce((sum, group) => sum + group.totalScore, 0)}
                </div>
                <div className="text-sm text-blue-600">总计分数</div>
              </div>
              <div className="bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-700">
                  {groupTotalScores[0]?.totalScore || 0}
                </div>
                <div className="text-sm text-purple-600">最高分数</div>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

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
    
    const totalScore = tournamentTeams.reduce((total, team) => total + team.total_score, 0)
    
    return (
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-600 px-6 py-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Target className="h-6 w-6 mr-3 animate-bounce" />
            🎯 混双淘汰赛总分 🎯
          </h2>
          <p className="text-purple-100 mt-2">激烈对决，谁与争锋！</p>
        </div>
        <div className="p-8">
          {tournamentTeams.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
                <Target className="h-12 w-12 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg">暂无参赛队伍</p>
              <p className="text-gray-400 text-sm mt-2">等待勇士们的挑战...</p>
            </div>
          ) : (
            <>
              {/* Main Score Display */}
              <div className="text-center mb-8">
                <div className="relative">
                  {/* Animated background circles */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 bg-gradient-to-r from-purple-200 to-pink-200 rounded-full animate-pulse opacity-30"></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 bg-gradient-to-r from-pink-300 to-red-300 rounded-full animate-ping opacity-20"></div>
                  </div>
                  
                  {/* Score */}
                  <div className="relative z-10 py-12">
                    <div className="text-8xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent animate-pulse">
                      {totalScore}
                    </div>
                    <div className="text-2xl font-bold text-gray-600 mt-2">总分</div>
                    <div className="text-lg text-gray-500 mt-1">🔥 淘汰赛累计分数 🔥</div>
                  </div>
                </div>
              </div>
              
              {/* Tournament Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="bg-gradient-to-r from-purple-100 to-purple-200 rounded-xl p-6 text-center transform hover:scale-105 transition-transform duration-300">
                  <div className="text-3xl font-bold text-purple-700">{tournamentTeams.length}</div>
                  <div className="text-sm text-purple-600 mt-1">参赛队伍</div>
                  <div className="text-xs text-purple-500 mt-2">💪 勇敢挑战者</div>
                </div>
                <div className="bg-gradient-to-r from-pink-100 to-pink-200 rounded-xl p-6 text-center transform hover:scale-105 transition-transform duration-300">
                  <div className="text-3xl font-bold text-pink-700">
                    {tournamentTeams.length > 0 ? Math.round(totalScore / tournamentTeams.length) : 0}
                  </div>
                  <div className="text-sm text-pink-600 mt-1">平均分数</div>
                  <div className="text-xs text-pink-500 mt-2">📊 实力指标</div>
                </div>
              </div>
              
              {/* Achievement Badge */}
              {totalScore > 0 && (
                <div className="mt-8 text-center">
                  <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-full text-white font-bold text-lg shadow-lg transform hover:scale-110 transition-transform duration-300">
                    <Trophy className="h-6 w-6 mr-2 animate-bounce" />
                    淘汰赛进行中
                    <Trophy className="h-6 w-6 ml-2 animate-bounce" />
                  </div>
                </div>
              )}
            </>
          )}
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
        <select
          value={selectedTournament?.tournament_type || ''}
          onChange={(e) => {
            const tournamentType = e.target.value
            if (tournamentType === 'group_stage') {
              // For group stage, select the first group_stage tournament
              const groupTournament = tournaments.find(t => t.tournament_type === 'group_stage')
              setSelectedTournament(groupTournament || null)
            } else if (tournamentType === 'elimination') {
              // For elimination, select the first elimination tournament
              const eliminationTournament = tournaments.find(t => t.tournament_type === 'elimination')
              setSelectedTournament(eliminationTournament || null)
            } else {
              setSelectedTournament(null)
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">请选择比赛类型</option>
          {tournaments.some(t => t.tournament_type === 'group_stage') && (
            <option value="group_stage">小组赛</option>
          )}
          {tournaments.some(t => t.tournament_type === 'elimination') && (
            <option value="elimination">混双淘汰赛</option>
          )}
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