import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, Team, Group } from '@/lib/supabase'
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  ArrowLeft,
  Search,
  Filter
} from 'lucide-react'

interface TeamFormData {
  name: string
  player1_name: string
  player2_name: string
  team_type: 'mens' | 'womens' | 'mixed'
  group_id: number
  tournament_type: 'group_stage' | 'mixed_double_championship'
}

export default function TeamManagement() {
  const [teams, setTeams] = useState<Team[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterGroup, setFilterGroup] = useState<number | ''>('')
  const [filterType, setFilterType] = useState<string>('')
  const [filterTournamentType, setFilterTournamentType] = useState<string>('')
  const [formData, setFormData] = useState<TeamFormData>({
    name: '',
    player1_name: '',
    player2_name: '',
    team_type: 'mens',
    group_id: 1,
    tournament_type: 'group_stage'
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [showBulkEdit, setShowBulkEdit] = useState(false)
  const [bulkEditData, setBulkEditData] = useState<{[key: number]: {player1_name: string, player2_name: string}}>({})
  const [selectedTeams, setSelectedTeams] = useState<Set<number>>(new Set())
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
      const [teamsResult, groupsResult] = await Promise.all([
        supabase
          .from('teams')
          .select(`
            *,
            group:groups(*)
          `)
          .eq('is_active', true)
          .order('group_id')
          .order('team_type')
          .order('name'),
        supabase
          .from('groups')
          .select('*')
          .order('name')
      ])

      setTeams(teamsResult.data || [])
      setGroups(groupsResult.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = '队伍名称不能为空'
    }
    if (!formData.player1_name.trim()) {
      errors.player1_name = '选手1姓名不能为空'
    }
    if (!formData.player2_name.trim()) {
      errors.player2_name = '选手2姓名不能为空'
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
      if (editingTeam) {
        // Update existing team
        const { error } = await supabase
          .from('teams')
          .update({
            name: formData.name,
            player1_name: formData.player1_name,
            player2_name: formData.player2_name,
            team_type: formData.team_type,
            group_id: formData.group_id,
            tournament_type: formData.tournament_type,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingTeam.id)

        if (error) throw error
      } else {
        // Create new team
        const { error } = await supabase
          .from('teams')
          .insert({
            name: formData.name,
            player1_name: formData.player1_name,
            player2_name: formData.player2_name,
            team_type: formData.team_type,
            group_id: formData.group_id,
            tournament_type: formData.tournament_type,
            wins: 0,
            losses: 0,
            points_for: 0,
            points_against: 0,
            is_active: true
          })

        if (error) throw error
      }

      // Reset form and refresh data
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Error saving team:', error)
      alert('保存失败，请重试')
    }
  }

  const handleEdit = (team: Team) => {
    setEditingTeam(team)
    setFormData({
      name: team.name,
      player1_name: team.player1_name,
      player2_name: team.player2_name,
      team_type: team.team_type as 'mens' | 'womens' | 'mixed',
      group_id: team.group_id || 1,
      tournament_type: team.tournament_type
    })
    setShowAddForm(true)
  }

  const handleDelete = async (team: Team) => {
    if (!confirm(`确定要删除队伍 "${team.name}" 吗？`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('teams')
        .update({ is_active: false })
        .eq('id', team.id)

      if (error) throw error

      fetchData()
    } catch (error) {
      console.error('Error deleting team:', error)
      alert('删除失败，请重试')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      player1_name: '',
      player2_name: '',
      team_type: 'mens',
      group_id: groups.length > 0 ? groups[0].id : 1,
      tournament_type: 'group_stage'
    })
    setFormErrors({})
    setEditingTeam(null)
    setShowAddForm(false)
  }

  const handleBulkEditSubmit = async () => {
    try {
      const updates = Object.entries(bulkEditData).map(([teamId, data]) => 
        supabase
          .from('teams')
          .update({
            player1_name: data.player1_name,
            player2_name: data.player2_name,
            updated_at: new Date().toISOString()
          })
          .eq('id', parseInt(teamId))
      )

      await Promise.all(updates)
      
      setShowBulkEdit(false)
      setBulkEditData({})
      setSelectedTeams(new Set())
      fetchData()
      alert('批量更新成功！')
    } catch (error) {
      console.error('Error bulk updating teams:', error)
      alert('批量更新失败，请重试')
    }
  }

  const initializeBulkEdit = () => {
    const initialData: {[key: number]: {player1_name: string, player2_name: string}} = {}
    teams.forEach(team => {
      initialData[team.id] = {
        player1_name: team.player1_name,
        player2_name: team.player2_name
      }
    })
    setBulkEditData(initialData)
    setShowBulkEdit(true)
  }

  const updateBulkEditData = (teamId: number, field: 'player1_name' | 'player2_name', value: string) => {
    setBulkEditData(prev => ({
      ...prev,
      [teamId]: {
        ...prev[teamId],
        [field]: value
      }
    }))
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

  const getTournamentTypeColor = (type: string) => {
    switch (type) {
      case 'group_stage':
        return 'bg-green-100 text-green-800'
      case 'mixed_double_championship':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTournamentTypeLabel = (type: string) => {
    switch (type) {
      case 'group_stage':
        return '小组赛'
      case 'mixed_double_championship':
        return '混双淘汰赛'
      default:
        return type
    }
  }

  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.player1_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.player2_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGroup = filterGroup === '' || team.group_id === filterGroup
    const matchesType = filterType === '' || team.team_type === filterType
    const matchesTournamentType = filterTournamentType === '' || team.tournament_type === filterTournamentType
    
    return matchesSearch && matchesGroup && matchesType && matchesTournamentType
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
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">队伍管理</h1>
                  <p className="text-sm text-gray-600">管理所有参赛队伍</p>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                 onClick={initializeBulkEdit}
                 className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
               >
                 <Edit className="h-4 w-4" />
                 <span>批量编辑选手</span>
               </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>添加队伍</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索队伍或选手..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value === '' ? '' : Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">所有小组</option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">所有类型</option>
              <option value="mens">男双</option>
              <option value="womens">女双</option>
              <option value="mixed">混双</option>
            </select>
            <select
              value={filterTournamentType}
              onChange={(e) => setFilterTournamentType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">所有比赛类型</option>
              <option value="group_stage">小组赛</option>
              <option value="mixed_double_championship">混双淘汰赛</option>
            </select>
          </div>
        </div>

        {/* Teams List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              队伍列表 ({filteredTeams.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    队伍信息
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    选手
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    类型
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    比赛类型
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    小组
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    战绩
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTeams.map((team) => (
                  <tr key={team.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{team.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {team.player1_name} / {team.player2_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTeamTypeColor(team.team_type)}`}>
                        {getTeamTypeLabel(team.team_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTournamentTypeColor(team.tournament_type)}`}>
                        {getTournamentTypeLabel(team.tournament_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {team.group?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {team.wins}胜 {team.losses}负
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(team)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(team)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredTeams.length === 0 && (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">没有找到队伍</h3>
                <p className="mt-1 text-sm text-gray-500">开始添加第一个队伍吧</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Team Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingTeam ? '编辑队伍' : '添加队伍'}
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
                  队伍名称
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${
                    formErrors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="输入队伍名称"
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  选手1姓名
                </label>
                <input
                  type="text"
                  value={formData.player1_name}
                  onChange={(e) => setFormData({ ...formData, player1_name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${
                    formErrors.player1_name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="输入选手1姓名"
                />
                {formErrors.player1_name && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.player1_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  选手2姓名
                </label>
                <input
                  type="text"
                  value={formData.player2_name}
                  onChange={(e) => setFormData({ ...formData, player2_name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${
                    formErrors.player2_name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="输入选手2姓名"
                />
                {formErrors.player2_name && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.player2_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  队伍类型
                </label>
                <select
                  value={formData.team_type}
                  onChange={(e) => setFormData({ ...formData, team_type: e.target.value as 'mens' | 'womens' | 'mixed' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="mens">男双</option>
                  <option value="womens">女双</option>
                  <option value="mixed">混双</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  比赛类型
                </label>
                <select
                  value={formData.tournament_type}
                  onChange={(e) => setFormData({ ...formData, tournament_type: e.target.value as 'group_stage' | 'mixed_double_championship' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="group_stage">小组赛</option>
                  <option value="mixed_double_championship">混双淘汰赛</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  所属小组
                </label>
                <select
                  value={formData.group_id}
                  onChange={(e) => setFormData({ ...formData, group_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                >
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingTeam ? '更新' : '添加'}
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

      {/* 批量编辑模态框 */}
      {showBulkEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">批量编辑选手姓名</h2>
              <button
                onClick={() => setShowBulkEdit(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {groups.map(group => {
                const groupTeams = teams.filter(team => team.group_id === group.id)
                if (groupTeams.length === 0) return null
                
                return (
                  <div key={group.id} className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">{group.name}</h3>
                    <div className="grid gap-4">
                      {groupTeams.map(team => (
                        <div key={team.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center p-3 bg-gray-50 rounded">
                          <div className="font-medium">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getTeamTypeColor(team.team_type)}`}>
                              {team.team_type === 'mens' ? '男双' : team.team_type === 'womens' ? '女双' : '混双'}
                            </span>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">选手1</label>
                            <input
                              type="text"
                              value={bulkEditData[team.id]?.player1_name || ''}
                              onChange={(e) => updateBulkEditData(team.id, 'player1_name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="输入选手1姓名"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">选手2</label>
                            <input
                              type="text"
                              value={bulkEditData[team.id]?.player2_name || ''}
                              onChange={(e) => updateBulkEditData(team.id, 'player2_name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="输入选手2姓名"
                            />
                          </div>
                          <div className="text-sm text-gray-600">
                            当前: {team.player1_name || '未设置'} & {team.player2_name || '未设置'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowBulkEdit(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleBulkEditSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                保存所有更改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}