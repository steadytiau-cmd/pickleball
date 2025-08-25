import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, Tournament, Match, Team } from '@/lib/supabase'
import EightTeamDraw from '@/components/EightTeamDraw'
import { 
  Trophy, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  ArrowLeft,
  Users,
  Calendar,
  Award,
  Target,
  Play,
  CheckCircle,
  Crown
} from 'lucide-react'

interface TournamentFormData {
  name: string
  tournament_type: 'group_stage' | 'elimination'
  description: string
  start_date: string
  end_date: string
  max_teams: number
  is_active: boolean
}

interface TournamentStats {
  total_teams: number
  total_matches: number
  completed_matches: number
  in_progress_matches: number
  scheduled_matches: number
}

export default function TournamentManagement() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null)
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const [tournamentStats, setTournamentStats] = useState<Record<number, TournamentStats>>({})
  const [formData, setFormData] = useState<TournamentFormData>({
    name: '',
    tournament_type: 'group_stage',
    description: '',
    start_date: '',
    end_date: '',
    max_teams: 18,
    is_active: true
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [showEightTeamDraw, setShowEightTeamDraw] = useState(false)
  const [selectedTournamentForDraw, setSelectedTournamentForDraw] = useState<Tournament | null>(null)
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
      const [tournamentsResult, matchesResult, teamsResult] = await Promise.all([
        supabase
          .from('tournaments')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('matches')
          .select(`
            *,
            team1:teams!matches_team1_id_fkey(name),
            team2:teams!matches_team2_id_fkey(name),
            tournament:tournaments(name)
          `)
          .order('scheduled_time', { ascending: false }),
        supabase
          .from('teams')
          .select('*')
          .eq('is_active', true)
          .order('name')
      ])

      const tournamentsData = tournamentsResult.data || []
      const matchesData = matchesResult.data || []
      const teamsData = teamsResult.data || []

      setTournaments(tournamentsData)
      setMatches(matchesData)
      setTeams(teamsData)

      // Calculate stats for each tournament
      const stats: Record<number, TournamentStats> = {}
      tournamentsData.forEach(tournament => {
        const tournamentMatches = matchesData.filter(match => match.tournament_id === tournament.id)
        const tournamentTeams = teamsData.filter(team => team.tournament_id === tournament.id)
        
        stats[tournament.id] = {
          total_teams: tournamentTeams.length,
          total_matches: tournamentMatches.length,
          completed_matches: tournamentMatches.filter(match => match.match_status === 'completed').length,
          in_progress_matches: tournamentMatches.filter(match => match.match_status === 'in_progress').length,
          scheduled_matches: tournamentMatches.filter(match => match.match_status === 'scheduled').length
        }
      })
      setTournamentStats(stats)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = '请输入锦标赛名称'
    }
    if (!formData.start_date) {
      errors.start_date = '请选择开始日期'
    }
    if (!formData.end_date) {
      errors.end_date = '请选择结束日期'
    }
    if (formData.start_date && formData.end_date && new Date(formData.start_date) > new Date(formData.end_date)) {
      errors.end_date = '结束日期不能早于开始日期'
    }
    if (formData.max_teams < 2) {
      errors.max_teams = '最少需要2支队伍'
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
      if (editingTournament) {
        // Update existing tournament
        const { error } = await supabase
          .from('tournaments')
          .update({
            name: formData.name,
            tournament_type: formData.tournament_type,
            description: formData.description,
            start_date: formData.start_date,
            end_date: formData.end_date,
            max_teams: formData.max_teams,
            is_active: formData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingTournament.id)

        if (error) throw error
      } else {
        // Create new tournament
        const { error } = await supabase
          .from('tournaments')
          .insert({
            name: formData.name,
            tournament_type: formData.tournament_type,
            description: formData.description,
            start_date: formData.start_date,
            end_date: formData.end_date,
            max_teams: formData.max_teams,
            is_active: formData.is_active
          })

        if (error) throw error
      }

      // Reset form and refresh data
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Error saving tournament:', error)
      alert('保存失败，请重试')
    }
  }

  const handleEdit = (tournament: Tournament) => {
    setEditingTournament(tournament)
    setFormData({
      name: tournament.name,
      tournament_type: tournament.tournament_type as 'group_stage' | 'elimination',
      description: tournament.description || '',
      start_date: tournament.start_date ? new Date(tournament.start_date).toISOString().slice(0, 10) : '',
      end_date: tournament.end_date ? new Date(tournament.end_date).toISOString().slice(0, 10) : '',
      max_teams: tournament.max_teams || 18,
      is_active: tournament.is_active
    })
    setShowAddForm(true)
  }

  const handleDelete = async (tournament: Tournament) => {
    if (!confirm(`确定要删除锦标赛 "${tournament.name}" 吗？这将删除所有相关的比赛和数据。`)) {
      return
    }

    try {
      // First delete all matches in this tournament
      await supabase
        .from('matches')
        .delete()
        .eq('tournament_id', tournament.id)

      // Then delete the tournament
      const { error } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', tournament.id)

      if (error) throw error

      fetchData()
    } catch (error) {
      console.error('Error deleting tournament:', error)
      alert('删除失败，请重试')
    }
  }

  const handleToggleActive = async (tournament: Tournament) => {
    try {
      const { error } = await supabase
        .from('tournaments')
        .update({ 
          is_active: !tournament.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', tournament.id)

      if (error) throw error

      fetchData()
    } catch (error) {
      console.error('Error updating tournament status:', error)
      alert('更新失败，请重试')
    }
  }

  const generateGroupStageMatches = async (tournament: Tournament) => {
    if (!confirm(`确定要为 "${tournament.name}" 生成小组赛比赛吗？`)) {
      return
    }

    try {
      // Get teams for this tournament
      const { data: tournamentTeams } = await supabase
        .from('teams')
        .select('*')
        .eq('tournament_id', tournament.id)
        .eq('is_active', true)

      if (!tournamentTeams || tournamentTeams.length < 2) {
        alert('至少需要2支队伍才能生成比赛')
        return
      }

      // Generate round-robin matches for each group
      const groups = ['A', 'B', 'C', 'D', 'E', 'F']
      const matchesToCreate = []
      
      for (const groupName of groups) {
        const groupTeams = tournamentTeams.filter(team => team.group_id === groupName)
        
        // Generate all possible pairs within the group
        for (let i = 0; i < groupTeams.length; i++) {
          for (let j = i + 1; j < groupTeams.length; j++) {
            matchesToCreate.push({
              tournament_id: tournament.id,
              team1_id: groupTeams[i].id,
              team2_id: groupTeams[j].id,
              match_round: 'qualification',
              match_status: 'scheduled',
              team1_score: 0,
              team2_score: 0
            })
          }
        }
      }

      if (matchesToCreate.length > 0) {
        const { error } = await supabase
          .from('matches')
          .insert(matchesToCreate)

        if (error) throw error

        alert(`成功生成 ${matchesToCreate.length} 场小组赛比赛`)
        fetchData()
      }
    } catch (error) {
      console.error('Error generating matches:', error)
      alert('生成比赛失败，请重试')
    }
  }

  const generateEliminationMatches = async (tournament: Tournament) => {
    if (!confirm(`确定要为 "${tournament.name}" 生成淘汰赛比赛吗？`)) {
      return
    }

    try {
      // Get teams for this tournament
      const { data: tournamentTeams } = await supabase
        .from('teams')
        .select('*')
        .eq('tournament_id', tournament.id)
        .eq('is_active', true)
        .order('wins', { ascending: false })
        .order('points_for', { ascending: false })

      if (!tournamentTeams || tournamentTeams.length < 2) {
        alert('至少需要2支队伍才能生成比赛')
        return
      }

      // For single elimination, pair teams
      const matchesToCreate = []
      const teamsCount = tournamentTeams.length
      
      // Generate first round matches
      for (let i = 0; i < teamsCount; i += 2) {
        if (i + 1 < teamsCount) {
          matchesToCreate.push({
            tournament_id: tournament.id,
            team1_id: tournamentTeams[i].id,
            team2_id: tournamentTeams[i + 1].id,
            match_round: teamsCount <= 4 ? 'semi_final' : 'qualification',
            match_status: 'scheduled',
            team1_score: 0,
            team2_score: 0
          })
        }
      }

      if (matchesToCreate.length > 0) {
        const { error } = await supabase
          .from('matches')
          .insert(matchesToCreate)

        if (error) throw error

        alert(`成功生成 ${matchesToCreate.length} 场淘汰赛比赛`)
        fetchData()
      }
    } catch (error) {
      console.error('Error generating elimination matches:', error)
      alert('生成比赛失败，请重试')
    }
  }

  const handleEightTeamDraw = (tournament: Tournament) => {
    setSelectedTournamentForDraw(tournament)
    setShowEightTeamDraw(true)
  }

  const handleDrawSave = async (drawPositions: { [position: number]: Team }) => {
    if (!selectedTournamentForDraw) return

    try {
      // Create 8-team elimination matches based on draw positions
      const matchesToCreate = []
      
      // Quarter-finals (4 matches)
      const quarterFinalPairs = [
        [1, 8], // Position 1 vs Position 8
        [2, 7], // Position 2 vs Position 7
        [3, 6], // Position 3 vs Position 6
        [4, 5]  // Position 4 vs Position 5
      ]

      quarterFinalPairs.forEach((pair, index) => {
        const team1 = drawPositions[pair[0]]
        const team2 = drawPositions[pair[1]]
        
        if (team1 && team2) {
          matchesToCreate.push({
            tournament_id: selectedTournamentForDraw.id,
            team1_id: team1.id,
            team2_id: team2.id,
            match_round: 'quarter_final',
            match_status: 'scheduled',
            team1_score: 0,
            team2_score: 0
          })
        }
      })

      // Create placeholder matches for semi-finals and final
      // Semi-final 1: Winner of QF1 vs Winner of QF2
      matchesToCreate.push({
        tournament_id: selectedTournamentForDraw.id,
        team1_id: null,
        team2_id: null,
        match_round: 'semi_final',
        match_status: 'pending',
        team1_score: 0,
        team2_score: 0
      })

      // Semi-final 2: Winner of QF3 vs Winner of QF4
      matchesToCreate.push({
        tournament_id: selectedTournamentForDraw.id,
        team1_id: null,
        team2_id: null,
        match_round: 'semi_final',
        match_status: 'pending',
        team1_score: 0,
        team2_score: 0
      })

      // Final: Winner of SF1 vs Winner of SF2
      matchesToCreate.push({
        tournament_id: selectedTournamentForDraw.id,
        team1_id: null,
        team2_id: null,
        match_round: 'final',
        match_status: 'pending',
        team1_score: 0,
        team2_score: 0
      })

      const { error } = await supabase
        .from('matches')
        .insert(matchesToCreate)

      if (error) throw error

      alert(`成功生成8队淘汰赛！包含4场四分之一决赛、2场半决赛和1场决赛`)
      setShowEightTeamDraw(false)
      setSelectedTournamentForDraw(null)
      fetchData()
    } catch (error) {
      console.error('Error creating 8-team elimination:', error)
      alert('生成8队淘汰赛失败，请重试')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      tournament_type: 'group_stage',
      description: '',
      start_date: '',
      end_date: '',
      max_teams: 18,
      is_active: true
    })
    setFormErrors({})
    setEditingTournament(null)
    setShowAddForm(false)
  }

  const getTournamentTypeLabel = (type: string) => {
    switch (type) {
      case 'group_stage': return '小组赛'
      case 'elimination': return '淘汰赛'
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

  const getProgressPercentage = (stats: TournamentStats) => {
    if (stats.total_matches === 0) return 0
    return Math.round((stats.completed_matches / stats.total_matches) * 100)
  }

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
                <Trophy className="h-8 w-8 text-green-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">锦标赛管理</h1>
                  <p className="text-sm text-gray-600">管理所有锦标赛和比赛流程</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>创建锦标赛</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tournaments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((tournament) => {
            const stats = tournamentStats[tournament.id] || {
              total_teams: 0,
              total_matches: 0,
              completed_matches: 0,
              in_progress_matches: 0,
              scheduled_matches: 0
            }
            const progress = getProgressPercentage(stats)

            return (
              <div key={tournament.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Tournament Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{tournament.name}</h3>
                        {!tournament.is_active && (
                          <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-600 rounded-full">
                            已停用
                          </span>
                        )}
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getTournamentTypeColor(tournament.tournament_type)}`}>
                        {getTournamentTypeLabel(tournament.tournament_type)}
                      </span>
                      {tournament.description && (
                        <p className="text-sm text-gray-600 mt-2">{tournament.description}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleEdit(tournament)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="编辑"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(tournament)}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="删除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tournament Stats */}
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Users className="h-4 w-4 text-blue-500 mr-1" />
                        <span className="text-2xl font-bold text-gray-900">{stats.total_teams}</span>
                      </div>
                      <p className="text-xs text-gray-600">参赛队伍</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Calendar className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-2xl font-bold text-gray-900">{stats.total_matches}</span>
                      </div>
                      <p className="text-xs text-gray-600">总比赛数</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">比赛进度</span>
                      <span className="text-sm text-gray-600">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Match Status */}
                  <div className="grid grid-cols-3 gap-2 text-xs mb-4">
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <div className="font-semibold text-blue-800">{stats.scheduled_matches}</div>
                      <div className="text-blue-600">已安排</div>
                    </div>
                    <div className="text-center p-2 bg-yellow-50 rounded">
                      <div className="font-semibold text-yellow-800">{stats.in_progress_matches}</div>
                      <div className="text-yellow-600">进行中</div>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded">
                      <div className="font-semibold text-green-800">{stats.completed_matches}</div>
                      <div className="text-green-600">已完成</div>
                    </div>
                  </div>

                  {/* Tournament Dates */}
                  {(tournament.start_date || tournament.end_date) && (
                    <div className="text-xs text-gray-600 mb-4">
                      {tournament.start_date && (
                        <div>开始: {new Date(tournament.start_date).toLocaleDateString('zh-CN')}</div>
                      )}
                      {tournament.end_date && (
                        <div>结束: {new Date(tournament.end_date).toLocaleDateString('zh-CN')}</div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <button
                      onClick={() => handleToggleActive(tournament)}
                      className={`w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        tournament.is_active
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {tournament.is_active ? '停用锦标赛' : '启用锦标赛'}
                    </button>
                    
                    {tournament.is_active && (
                      <div className="grid grid-cols-1 gap-2">
                        {tournament.tournament_type === 'group_stage' && (
                          <button
                            onClick={() => generateGroupStageMatches(tournament)}
                            className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                          >
                            <Target className="h-4 w-4 mr-1" />
                            生成小组赛
                          </button>
                        )}
                        {tournament.tournament_type === 'elimination' && (
                          <>
                            <button
                              onClick={() => generateEliminationMatches(tournament)}
                              className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
                            >
                              <Award className="h-4 w-4 mr-1" />
                              生成淘汰赛
                            </button>
                            <button
                              onClick={() => handleEightTeamDraw(tournament)}
                              className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-md hover:from-yellow-600 hover:to-orange-700 transition-all duration-200 shadow-lg"
                            >
                              <Crown className="h-4 w-4 mr-1" />
                              8队淘汰赛
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {tournaments.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">没有锦标赛</h3>
            <p className="mt-1 text-sm text-gray-500">创建第一个锦标赛开始比赛吧</p>
          </div>
        )}
      </div>

      {/* Eight Team Draw Modal */}
      {showEightTeamDraw && selectedTournamentForDraw && (
        <EightTeamDraw
          tournamentId={selectedTournamentForDraw.id}
          teams={teams.filter(team => 
            team.is_active && 
            team.tournament_type === 'mixed_double_championship'
          )}
          onSave={handleDrawSave}
          onCancel={() => {
            setShowEightTeamDraw(false)
            setSelectedTournamentForDraw(null)
          }}
        />
      )}

      {/* Add/Edit Tournament Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingTournament ? '编辑锦标赛' : '创建锦标赛'}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  锦标赛名称
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${
                    formErrors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="输入锦标赛名称"
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  锦标赛类型
                </label>
                <select
                  value={formData.tournament_type}
                  onChange={(e) => setFormData({ ...formData, tournament_type: e.target.value as 'group_stage' | 'elimination' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="group_stage">小组赛</option>
                  <option value="elimination">淘汰赛</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  placeholder="输入锦标赛描述（可选）"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    开始日期
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${
                      formErrors.start_date ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.start_date && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.start_date}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    结束日期
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${
                      formErrors.end_date ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.end_date && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.end_date}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  最大队伍数
                </label>
                <input
                  type="number"
                  min="2"
                  value={formData.max_teams}
                  onChange={(e) => setFormData({ ...formData, max_teams: Number(e.target.value) })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${
                    formErrors.max_teams ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {formErrors.max_teams && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.max_teams}</p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  启用锦标赛
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingTournament ? '更新' : '创建'}
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
    </div>
  )
}