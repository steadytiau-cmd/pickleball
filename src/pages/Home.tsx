import { useEffect, useState } from 'react'
import { supabase, Group, Team, Match } from '@/lib/supabase'
import { Trophy, Users, Clock } from 'lucide-react'

export default function Scoreboard() {
  const [groups, setGroups] = useState<Group[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [matches, setMatches] = useState<Match[]>([])
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
      })
      .subscribe()

    return () => {
      supabase.removeChannel(teamsSubscription)
      supabase.removeChannel(matchesSubscription)
    }
  }, [])

  const fetchData = async () => {
    await Promise.all([fetchGroups(), fetchTeams(), fetchMatches()])
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Trophy className="h-8 w-8 text-yellow-500" />
              <h1 className="text-3xl font-bold text-gray-900">匹克球挑战赛计分板</h1>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>实时更新</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Groups Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {groups.map((group) => {
            const groupTeams = getTeamsByGroup(group.id)
            return (
              <div key={group.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-blue-500 px-6 py-4">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    {group.name}
                  </h2>
                </div>
                <div className="p-6">
                  {groupTeams.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">暂无队伍</p>
                  ) : (
                    <div className="space-y-3">
                      {['mens', 'womens', 'mixed'].map((teamType) => {
                        const typeTeams = groupTeams.filter(team => team.team_type === teamType)
                        return (
                          <div key={teamType}>
                            <h3 className={`text-sm font-semibold px-2 py-1 rounded-full inline-block mb-2 ${getTeamTypeColor(teamType)}`}>
                              {getTeamTypeLabel(teamType)}
                            </h3>
                            {typeTeams.length === 0 ? (
                              <p className="text-gray-400 text-sm ml-2">暂无队伍</p>
                            ) : (
                              <div className="space-y-2">
                                {typeTeams.map((team, index) => (
                                  <div key={team.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                      <span className="text-lg font-bold text-gray-600">#{index + 1}</span>
                                      <div>
                                        <p className="font-semibold text-gray-900">{team.name}</p>
                                        <p className="text-sm text-gray-600">{team.player1_name} / {team.player2_name}</p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-lg font-bold text-green-600">{team.wins}胜</p>
                                      <p className="text-sm text-gray-500">{team.losses}负</p>
                                    </div>
                                  </div>
                                ))}
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

        {/* Recent Matches */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">最近比赛</h2>
          </div>
          <div className="p-6">
            {matches.length === 0 ? (
              <p className="text-gray-500 text-center py-8">暂无比赛记录</p>
            ) : (
              <div className="space-y-4">
                {matches.map((match) => (
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
      </div>
    </div>
  )
}