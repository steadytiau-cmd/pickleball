import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, Team, Match, Tournament } from '@/lib/supabase'
import { 
  Trophy, 
  Users, 
  Calendar, 
  BarChart3, 
  Settings, 
  LogOut,
  Plus,
  Play,
  Pause,
  CheckCircle
} from 'lucide-react'

interface AdminUser {
  id: number
  username: string
  role: string
  loginTime: string
}

interface DashboardStats {
  totalTeams: number
  activeMatches: number
  completedMatches: number
  totalTournaments: number
}

export default function AdminDashboard() {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalTeams: 0,
    activeMatches: 0,
    completedMatches: 0,
    totalTournaments: 0
  })
  const [recentMatches, setRecentMatches] = useState<Match[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // Check if admin is logged in
    const adminData = localStorage.getItem('admin_user')
    if (!adminData) {
      navigate('/admin/login')
      return
    }

    const admin = JSON.parse(adminData)
    setAdminUser(admin)
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const [teamsResult, matchesResult, tournamentsResult] = await Promise.all([
        supabase.from('teams').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('matches').select('id, match_status', { count: 'exact' }),
        supabase.from('tournaments').select('*')
      ])

      const activeMatches = matchesResult.data?.filter(m => m.match_status === 'in_progress').length || 0
      const completedMatches = matchesResult.data?.filter(m => m.match_status === 'completed').length || 0

      setStats({
        totalTeams: teamsResult.count || 0,
        activeMatches,
        completedMatches,
        totalTournaments: tournamentsResult.data?.length || 0
      })

      setTournaments(tournamentsResult.data || [])

      // Fetch recent matches
      const { data: matches } = await supabase
        .from('matches')
        .select(`
          *,
          team1:teams!matches_team1_id_fkey(*),
          team2:teams!matches_team2_id_fkey(*),
          tournament:tournaments(*)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      setRecentMatches(matches || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    if (adminUser) {
      // Log the logout
      await supabase
        .from('audit_logs')
        .insert({
          admin_user_id: adminUser.id,
          action: 'logout',
          details: { username: adminUser.username, timestamp: new Date().toISOString() }
        })
    }

    localStorage.removeItem('admin_user')
    navigate('/admin/login')
  }

  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getMatchStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return '已完成'
      case 'in_progress': return '进行中'
      case 'scheduled': return '已安排'
      default: return status
    }
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
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Trophy className="h-8 w-8 text-yellow-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">管理员控制台</h1>
                <p className="text-sm text-gray-600">匹克球挑战赛管理系统</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">欢迎，{adminUser?.username}</p>
                <p className="text-xs text-gray-500">{adminUser?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>退出</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">总队伍数</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalTeams}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Play className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">进行中比赛</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.activeMatches}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">已完成比赛</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.completedMatches}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Trophy className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">锦标赛数</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalTournaments}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">快速操作</h2>
              </div>
              <div className="p-6 space-y-4">
                <button
                  onClick={() => navigate('/admin/teams')}
                  className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">管理队伍</span>
                  </div>
                  <span className="text-blue-600">→</span>
                </button>

                <button
                  onClick={() => navigate('/admin/matches')}
                  className="w-full flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-900">管理比赛</span>
                  </div>
                  <span className="text-green-600">→</span>
                </button>

                <button
                  onClick={() => navigate('/admin/tournaments')}
                  className="w-full flex items-center justify-between p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Trophy className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-purple-900">管理锦标赛</span>
                  </div>
                  <span className="text-purple-600">→</span>
                </button>

                <button
                  onClick={() => navigate('/')}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-900">查看计分板</span>
                  </div>
                  <span className="text-gray-600">→</span>
                </button>
              </div>
            </div>
          </div>

          {/* Recent Matches */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">最近比赛</h2>
                  <button
                    onClick={() => navigate('/admin/matches')}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    查看全部
                  </button>
                </div>
              </div>
              <div className="p-6">
                {recentMatches.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">暂无比赛记录</p>
                ) : (
                  <div className="space-y-4">
                    {recentMatches.map((match) => (
                      <div key={match.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className={`px-2 py-1 rounded-full text-xs font-semibold ${getMatchStatusColor(match.match_status)}`}>
                            {getMatchStatusLabel(match.match_status)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {match.team1?.name} vs {match.team2?.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {match.tournament?.name} - {match.match_round}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
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
          </div>
        </div>
      </div>
    </div>
  )
}