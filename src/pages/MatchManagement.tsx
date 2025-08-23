import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, Match, Team, Tournament } from '@/lib/supabase'
import { 
  Calendar, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  ArrowLeft,
  Play,
  Pause,
  CheckCircle,
  Clock
} from 'lucide-react'

interface MatchFormData {
  team1_id: number
  team2_id: number
  tournament_id: number
  match_round: string
}

interface ScoreUpdateData {
  team1_score: number
  team2_score: number
  match_status: 'scheduled' | 'in_progress' | 'completed'
}

export default function MatchManagement() {
  const [matches, setMatches] = useState<Match[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingMatch, setEditingMatch] = useState<Match | null>(null)
  const [showScoreModal, setShowScoreModal] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterTournament, setFilterTournament] = useState<number | ''>()
  const [formData, setFormData] = useState<MatchFormData>({
    team1_id: 0,
    team2_id: 0,
    tournament_id: 0,
    match_round: 'qualification'
  })
  const [scoreData, setScoreData] = useState<ScoreUpdateData>({
    team1_score: 0,
    team2_score: 0,
    match_status: 'scheduled'
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [showQuickScore, setShowQuickScore] = useState(false)
  const [quickScoreMatches, setQuickScoreMatches] = useState<Match[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    // Check if admin is logged in
    const adminData = localStorage.getItem('admin_user')
    if (!adminData) {
      navigate('/admin/login')
      return
    }

    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [matchesResult, teamsResult, tournamentsResult] = await Promise.all([
        supabase
          .from('matches')
          .select(`
            *,
            team1:teams!matches_team1_id_fkey(*),
            team2:teams!matches_team2_id_fkey(*),
            tournament:tournaments(*)
          `)
          .order('scheduled_time', { ascending: false }),
        supabase
          .from('teams')
          .select('*')
          .eq('is_active', true)
          .order('name'),
        supabase
          .from('tournaments')
          .select('*')
          .in('tournament_type', ['group_stage', 'elimination'])
          .order('name')
      ])

      setMatches(matchesResult.data || [])
      setTeams(teamsResult.data || [])
      setTournaments(tournamentsResult.data || [])
      
      if (teamsResult.data && teamsResult.data.length > 0) {
        setFormData(prev => ({
          ...prev,
          team1_id: teamsResult.data[0].id,
          team2_id: teamsResult.data.length > 1 ? teamsResult.data[1].id : teamsResult.data[0].id
        }))
      }
      
      if (tournamentsResult.data && tournamentsResult.data.length > 0) {
        setFormData(prev => ({
          ...prev,
          tournament_id: tournamentsResult.data[0].id
        }))
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (formData.team1_id === formData.team2_id) {
      errors.teams = '不能选择相同的队伍'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      if (editingMatch) {
        // Update existing match
        const { error } = await supabase
          .from('matches')
          .update({
            team1_id: formData.team1_id,
            team2_id: formData.team2_id,
            tournament_id: formData.tournament_id,
            match_round: formData.match_round,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingMatch.id)

        if (error) throw error
      } else {
        // Create new match
        const { error } = await supabase
          .from('matches')
          .insert({
            team1_id: formData.team1_id,
            team2_id: formData.team2_id,
            tournament_id: formData.tournament_id,
            match_round: formData.match_round,
            team1_score: 0,
            team2_score: 0,
            match_status: 'scheduled'
          })

        if (error) throw error
      }

      // Reset form and refresh data
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Error saving match:', error)
      alert('保存失败，请重试')
    }
  }

  const handleScoreUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedMatch) return

    try {
      // 计算获胜者ID（如果比赛完成且满足获胜条件）
      let winner_id = null
      if (scoreData.match_status === 'completed') {
        // 使用匹克球规则判定胜负：需要达到获胜分数（通常21分）且领先对手至少2分
        const winningScore = 21 // 可以根据需要调整为11、15或21
        const team1Won = scoreData.team1_score >= winningScore && scoreData.team1_score - scoreData.team2_score >= 2
        const team2Won = scoreData.team2_score >= winningScore && scoreData.team2_score - scoreData.team1_score >= 2
        
        if (team1Won) {
          winner_id = selectedMatch.team1_id
        } else if (team2Won) {
          winner_id = selectedMatch.team2_id
        }
      }

      const { error } = await supabase
        .from('matches')
        .update({
          team1_score: scoreData.team1_score,
          team2_score: scoreData.team2_score,
          match_status: scoreData.match_status,
          winner_id: winner_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedMatch.id)

      if (error) throw error

      // Update team records if match is completed
      if (scoreData.match_status === 'completed' && winner_id) {
        const loser_id = winner_id === selectedMatch.team1_id ? selectedMatch.team2_id : selectedMatch.team1_id

        // Update winner
        await supabase.rpc('increment_team_wins', { team_id: winner_id })
        
        // Update loser
        await supabase.rpc('increment_team_losses', { team_id: loser_id })

        // Update points
        await supabase
          .from('teams')
          .update({ 
            points_for: (selectedMatch.team1?.points_for || 0) + scoreData.team1_score,
            points_against: (selectedMatch.team1?.points_against || 0) + scoreData.team2_score
          })
          .eq('id', selectedMatch.team1_id)

        await supabase
          .from('teams')
          .update({ 
            points_for: (selectedMatch.team2?.points_for || 0) + scoreData.team2_score,
            points_against: (selectedMatch.team2?.points_against || 0) + scoreData.team1_score
          })
          .eq('id', selectedMatch.team2_id)
      }

      setShowScoreModal(false)
      setSelectedMatch(null)
      fetchData()
    } catch (error) {
      console.error('Error updating score:', error)
      alert('更新失败，请重试')
    }
  }

  const handleEdit = (match: Match) => {
    setEditingMatch(match)
    setFormData({
      team1_id: match.team1_id,
      team2_id: match.team2_id,
      tournament_id: match.tournament_id,
      match_round: match.match_round
    })
    setShowAddForm(true)
  }

  const handleScoreEdit = (match: Match) => {
    setSelectedMatch(match)
    setScoreData({
      team1_score: match.team1_score || 0,
      team2_score: match.team2_score || 0,
      match_status: match.match_status as 'scheduled' | 'in_progress' | 'completed'
    })
    setShowScoreModal(true)
  }

  const handleDelete = async (match: Match) => {
    if (!confirm(`确定要删除这场比赛吗？`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', match.id)

      if (error) throw error

      fetchData()
    } catch (error) {
      console.error('Error deleting match:', error)
      alert('删除失败，请重试')
    }
  }

  const resetForm = () => {
    setFormData({
      team1_id: teams.length > 0 ? teams[0].id : 0,
      team2_id: teams.length > 1 ? teams[1].id : 0,
      tournament_id: tournaments.length > 0 ? tournaments[0].id : 0,
      match_round: 'qualification'
    })
    setFormErrors({})
    setEditingMatch(null)
    setShowAddForm(false)
  }

  const handleQuickScoreUpdate = async (matchId: number, team1Score: number, team2Score: number, status: string) => {
    try {
      const match = matches.find(m => m.id === matchId)
      if (!match) return

      // 计算获胜者ID（如果比赛完成且满足获胜条件）
      let winner_id = null
      if (status === 'completed') {
        // 使用匹克球规则判定胜负：需要达到获胜分数（通常21分）且领先对手至少2分
        const winningScore = 21 // 可以根据需要调整为11、15或21
        const team1Won = team1Score >= winningScore && team1Score - team2Score >= 2
        const team2Won = team2Score >= winningScore && team2Score - team1Score >= 2
        
        if (team1Won) {
          winner_id = match.team1_id
        } else if (team2Won) {
          winner_id = match.team2_id
        }
      }

      const { error } = await supabase
        .from('matches')
        .update({
          team1_score: team1Score,
          team2_score: team2Score,
          match_status: status,
          winner_id: winner_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', matchId)

      if (error) throw error

      // Update team records if match is completed
      if (status === 'completed' && winner_id) {
        const loser_id = winner_id === match.team1_id ? match.team2_id : match.team1_id

        // Update winner
        await supabase.rpc('increment_team_wins', { team_id: winner_id })
        
        // Update loser
        await supabase.rpc('increment_team_losses', { team_id: loser_id })

        // Update points
        await supabase
          .from('teams')
          .update({ 
            points_for: (match.team1?.points_for || 0) + team1Score,
            points_against: (match.team1?.points_against || 0) + team2Score
          })
          .eq('id', match.team1_id)

        await supabase
          .from('teams')
          .update({ 
            points_for: (match.team2?.points_for || 0) + team2Score,
            points_against: (match.team2?.points_against || 0) + team1Score
          })
          .eq('id', match.team2_id)
      }

      fetchData()
    } catch (error) {
      console.error('Error updating quick score:', error)
      alert('更新失败，请重试')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return '已完成'
      case 'in_progress': return '进行中'
      case 'scheduled': return '已安排'
      default: return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'in_progress': return <Play className="h-4 w-4" />
      case 'scheduled': return <Clock className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const filteredMatches = matches.filter(match => {
    const matchesStatus = filterStatus === '' || match.match_status === filterStatus
    const matchesTournament = filterTournament === '' || match.tournament_id === filterTournament
    
    return matchesStatus && matchesTournament
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>返回</span>
              </button>
              <div className="flex items-center space-x-3">
                <Calendar className="h-8 w-8 text-green-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">比赛管理</h1>
                  <p className="text-sm text-gray-600">管理所有比赛安排和比分</p>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  const activeMatches = matches.filter(m => m.match_status === 'scheduled' || m.match_status === 'in_progress')
                  setQuickScoreMatches(activeMatches)
                  setShowQuickScore(true)
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Play className="h-4 w-4" />
                <span>快速计分</span>
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>安排比赛</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">所有状态</option>
              <option value="scheduled">已安排</option>
              <option value="in_progress">进行中</option>
              <option value="completed">已完成</option>
            </select>
            <select
              value={filterTournament}
              onChange={(e) => setFilterTournament(e.target.value === '' ? '' : Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">所有锦标赛</option>
              {tournaments.map(tournament => (
                <option key={tournament.id} value={tournament.id}>{tournament.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Matches List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              比赛列表 ({filteredMatches.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    比赛信息
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    对阵
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    比分
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    时间/场地
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMatches.map((match) => (
                  <tr key={match.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">{match.tournament?.name}</div>
                        <div className="text-sm text-gray-500">{match.match_round}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {match.team1?.name} vs {match.team2?.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-bold text-gray-900">
                        {match.team1_score} - {match.team2_score}
                      </div>
                      {match.match_status === 'completed' && (() => {
                        const winningScore = 21
                        const team1Won = match.team1_score >= winningScore && match.team1_score - match.team2_score >= 2
                        const team2Won = match.team2_score >= winningScore && match.team2_score - match.team1_score >= 2
                        
                        if (team1Won || team2Won) {
                          const winnerName = team1Won ? match.team1?.name : match.team2?.name
                          return (
                            <div className="text-xs text-green-600 font-medium mt-1 flex items-center">
                              <span className="mr-1">🏆</span>
                              <span>获胜者: {winnerName}</span>
                            </div>
                          )
                        }
                        return null
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(match.match_status)}`}>
                        {getStatusIcon(match.match_status)}
                        <span className="ml-1">{getStatusLabel(match.match_status)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        {match.scheduled_time && (
                          <div>{new Date(match.scheduled_time).toLocaleString('zh-CN')}</div>
                        )}

                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleScoreEdit(match)}
                          className="text-green-600 hover:text-green-800"
                          title="更新比分"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(match)}
                          className="text-blue-600 hover:text-blue-800"
                          title="编辑比赛"
                        >
                          <Calendar className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(match)}
                          className="text-red-600 hover:text-red-800"
                          title="删除比赛"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredMatches.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">没有找到比赛</h3>
                <p className="mt-1 text-sm text-gray-500">开始安排第一场比赛吧</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Match Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingMatch ? '编辑比赛' : '安排比赛'}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {formErrors.teams && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-red-600 text-sm">{formErrors.teams}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  锦标赛
                </label>
                <select
                  value={formData.tournament_id}
                  onChange={(e) => setFormData({ ...formData, tournament_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                >
                  {tournaments.map(tournament => (
                    <option key={tournament.id} value={tournament.id}>{tournament.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  比赛轮次
                </label>
                <select
                  value={formData.match_round}
                  onChange={(e) => setFormData({ ...formData, match_round: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="qualification">资格赛</option>
                  <option value="semi_final">半决赛</option>
                  <option value="final">决赛</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  队伍1
                </label>
                <select
                  value={formData.team1_id}
                  onChange={(e) => setFormData({ ...formData, team1_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                >
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  队伍2
                </label>
                <select
                  value={formData.team2_id}
                  onChange={(e) => setFormData({ ...formData, team2_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                >
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>


              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingMatch ? '更新' : '安排'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Score Update Modal */}
      {showScoreModal && selectedMatch && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">更新比分</h3>
              <button
                onClick={() => setShowScoreModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <p className="font-medium text-gray-900">
                {selectedMatch.team1?.name} vs {selectedMatch.team2?.name}
              </p>
              <p className="text-sm text-gray-600">
                {selectedMatch.tournament?.name} - {selectedMatch.match_round}
              </p>
            </div>

            <form onSubmit={handleScoreUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {selectedMatch.team1?.name} 得分
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={scoreData.team1_score}
                    onChange={(e) => setScoreData({ ...scoreData, team1_score: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {selectedMatch.team2?.name} 得分
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={scoreData.team2_score}
                    onChange={(e) => setScoreData({ ...scoreData, team2_score: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  比赛状态
                </label>
                <select
                  value={scoreData.match_status}
                  onChange={(e) => setScoreData({ ...scoreData, match_status: e.target.value as 'scheduled' | 'in_progress' | 'completed' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="scheduled">已安排</option>
                  <option value="in_progress">进行中</option>
                  <option value="completed">已完成</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <Save className="h-4 w-4 mr-2" />
                  更新
                </button>
                <button
                  type="button"
                  onClick={() => setShowScoreModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Score Modal */}
      {showQuickScore && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">快速计分</h2>
              <button
                onClick={() => setShowQuickScore(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {quickScoreMatches.length === 0 ? (
                <p className="text-center text-gray-500 py-8">没有进行中或已安排的比赛</p>
              ) : (
                quickScoreMatches.map(match => (
                  <QuickScoreCard
                    key={match.id}
                    match={match}
                    onScoreUpdate={handleQuickScoreUpdate}
                  />
                ))
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowQuickScore(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Quick Score Card Component
interface QuickScoreCardProps {
  match: Match
  onScoreUpdate: (matchId: number, team1Score: number, team2Score: number, status: string) => void
}

function QuickScoreCard({ match, onScoreUpdate }: QuickScoreCardProps) {
  const [team1Score, setTeam1Score] = useState(match.team1_score || 0)
  const [team2Score, setTeam2Score] = useState(match.team2_score || 0)
  const [status, setStatus] = useState(match.match_status)

  const handleUpdate = () => {
    onScoreUpdate(match.id, team1Score, team2Score, status)
  }

  const incrementScore = (team: 'team1' | 'team2') => {
    if (team === 'team1') {
      setTeam1Score(prev => prev + 1)
    } else {
      setTeam2Score(prev => prev + 1)
    }
  }

  const decrementScore = (team: 'team1' | 'team2') => {
    if (team === 'team1') {
      setTeam1Score(prev => Math.max(0, prev - 1))
    } else {
      setTeam2Score(prev => Math.max(0, prev - 1))
    }
  }

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600">
          {match.tournament?.name} - {match.match_round}
        </div>
        <div className={`px-2 py-1 rounded text-xs font-medium ${
          status === 'completed' ? 'bg-green-100 text-green-800' :
          status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {status === 'completed' ? '已完成' : status === 'in_progress' ? '进行中' : '已安排'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Team 1 */}
        <div className="text-center">
          <h3 className="font-semibold text-gray-900 mb-2">{match.team1?.name}</h3>
          <div className="flex items-center justify-center space-x-2">
            <button
              onClick={() => decrementScore('team1')}
              className="w-8 h-8 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              -
            </button>
            <span className="text-2xl font-bold w-12 text-center">{team1Score}</span>
            <button
              onClick={() => incrementScore('team1')}
              className="w-8 h-8 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* VS and Controls */}
        <div className="text-center space-y-3">
          <div className="text-lg font-bold text-gray-500">VS</div>
          <select
             value={status}
             onChange={(e) => setStatus(e.target.value as 'scheduled' | 'in_progress' | 'completed' | 'cancelled')}
             className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
           >
            <option value="scheduled">已安排</option>
            <option value="in_progress">进行中</option>
            <option value="completed">已完成</option>
          </select>
          <button
            onClick={handleUpdate}
            className="w-full px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            更新
          </button>
        </div>

        {/* Team 2 */}
        <div className="text-center">
          <h3 className="font-semibold text-gray-900 mb-2">{match.team2?.name}</h3>
          <div className="flex items-center justify-center space-x-2">
            <button
              onClick={() => decrementScore('team2')}
              className="w-8 h-8 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              -
            </button>
            <span className="text-2xl font-bold w-12 text-center">{team2Score}</span>
            <button
              onClick={() => incrementScore('team2')}
              className="w-8 h-8 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}