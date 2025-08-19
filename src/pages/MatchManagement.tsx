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
  Clock,
  MapPin
} from 'lucide-react'

interface MatchFormData {
  team1_id: number
  team2_id: number
  tournament_id: number
  match_round: string
  court_number: number
  scheduled_time: string
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
    match_round: 'qualification',
    court_number: 1,
    scheduled_time: ''
  })
  const [scoreData, setScoreData] = useState<ScoreUpdateData>({
    team1_score: 0,
    team2_score: 0,
    match_status: 'scheduled'
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
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
    if (!formData.scheduled_time) {
      errors.scheduled_time = '请选择比赛时间'
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
            court_number: formData.court_number,
            scheduled_time: formData.scheduled_time,
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
            court_number: formData.court_number,
            scheduled_time: formData.scheduled_time,
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
      const { error } = await supabase
        .from('matches')
        .update({
          team1_score: scoreData.team1_score,
          team2_score: scoreData.team2_score,
          match_status: scoreData.match_status,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedMatch.id)

      if (error) throw error

      // Update team records if match is completed
      if (scoreData.match_status === 'completed') {
        const winner_id = scoreData.team1_score > scoreData.team2_score ? selectedMatch.team1_id : selectedMatch.team2_id
        const loser_id = scoreData.team1_score > scoreData.team2_score ? selectedMatch.team2_id : selectedMatch.team1_id

        // Update winner
        await supabase.rpc('increment_team_wins', { team_id: winner_id })
        
        // Update loser
        await supabase.rpc('increment_team_losses', { team_id: loser_id })

        // Update points
        await supabase
          .from('teams')
          .update({ 
            points_for: selectedMatch.team1?.points_for + scoreData.team1_score,
            points_against: selectedMatch.team1?.points_against + scoreData.team2_score
          })
          .eq('id', selectedMatch.team1_id)

        await supabase
          .from('teams')
          .update({ 
            points_for: selectedMatch.team2?.points_for + scoreData.team2_score,
            points_against: selectedMatch.team2?.points_against + scoreData.team1_score
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
      match_round: match.match_round,
      court_number: match.court_number || 1,
      scheduled_time: match.scheduled_time ? new Date(match.scheduled_time).toISOString().slice(0, 16) : ''
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
      match_round: 'qualification',
      court_number: 1,
      scheduled_time: ''
    })
    setFormErrors({})
    setEditingMatch(null)
    setShowAddForm(false)
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
                        {match.court_number && (
                          <div className="flex items-center text-gray-500">
                            <MapPin className="h-3 w-3 mr-1" />
                            场地 {match.court_number}
                          </div>
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
                  <option value="semifinal">半决赛</option>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  场地号
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.court_number}
                  onChange={(e) => setFormData({ ...formData, court_number: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  比赛时间
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${
                    formErrors.scheduled_time ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {formErrors.scheduled_time && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.scheduled_time}</p>
                )}
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
    </div>
  )
}