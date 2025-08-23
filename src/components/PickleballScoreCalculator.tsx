import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { RotateCcw, Play, Pause, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface GameState {
  team1Score: number
  team2Score: number
  team1Games: number
  team2Games: number
  servingTeam: 1 | 2  // 当前发球队伍
  serverNumber: 1 | 2  // 发球队伍中的第几个发球员（1或2）
  isGameActive: boolean
  gameHistory: Array<{
    team1Score: number
    team2Score: number
    team1Games: number
    team2Games: number
  }>
}

interface Team {
  id: number
  name: string
  team_type: 'mens' | 'womens' | 'mixed'
  player1_name: string
  player2_name: string
  wins: number
  losses: number
  points_for: number
  points_against: number
}

interface Match {
  id: number
  tournament_id?: number
  team1_id?: number
  team2_id?: number
  team1?: Team
  team2?: Team
  match_round?: 'qualification' | 'semi_final' | 'final' | 'round_16' | 'quarter_final'
  match_status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  scheduled_time?: string
  team1_score: number
  team2_score: number
  winner_id?: number
  actual_start_time?: string
  actual_end_time?: string
  created_at: string
  updated_at: string
}

export default function PickleballScoreCalculator() {
  const { matchId } = useParams<{ matchId: string }>()
  const navigate = useNavigate()
  
  const [match, setMatch] = useState<Match | null>(null)
  const [loading, setLoading] = useState(true)
  const [team1Name, setTeam1Name] = useState('队伍 1')
  const [team2Name, setTeam2Name] = useState('队伍 2')
  const [gameState, setGameState] = useState<GameState>({
    team1Score: 0,
    team2Score: 0,
    team1Games: 0,
    team2Games: 0,
    servingTeam: 1,
    serverNumber: 1,
    isGameActive: false,
    gameHistory: []
  })

  const [matchFormat, setMatchFormat] = useState<'single' | 'best-of-3'>('single')
  const [winningScore, setWinningScore] = useState(21)
  const [initialServingTeam, setInitialServingTeam] = useState<1 | 2>(1)

  // 获取比赛数据
  const fetchMatchData = async (id: string) => {
    try {
      const matchIdNum = parseInt(id)
      if (isNaN(matchIdNum)) {
        console.error('无效的比赛ID:', id)
        return
      }
      
      const { data: matchData, error } = await supabase
        .from('matches')
        .select(`
          *,
          team1:teams!matches_team1_id_fkey(*),
          team2:teams!matches_team2_id_fkey(*),
          tournament:tournaments(*)
        `)
        .eq('id', matchIdNum)
        .single()
      
      if (error) {
        console.error('获取比赛数据失败:', error)
        return
      }
      
      if (matchData) {
        setMatch(matchData)
        
        // 设置队伍名称
        if (matchData.team1) {
          setTeam1Name(matchData.team1.name)
        }
        if (matchData.team2) {
          setTeam2Name(matchData.team2.name)
        }
        
        // 如果比赛已经有分数，加载现有分数
        if (matchData.team1_score !== null && matchData.team2_score !== null) {
          setGameState(prev => ({
            ...prev,
            team1Games: matchData.team1_score || 0,
            team2Games: matchData.team2_score || 0
          }))
        }
      }
    } catch (error) {
      console.error('获取比赛数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 更新比赛结果到数据库
  const updateMatchResult = async () => {
    if (!match || !matchId) return
    
    const winner = getMatchWinner()
    if (!winner) return
    
    try {
      const winnerId = winner === team1Name ? match.team1_id : match.team2_id
      
      const matchIdNum = parseInt(matchId)
      if (isNaN(matchIdNum)) {
        console.error('无效的比赛ID:', matchId)
        return
      }
      
      const { error } = await supabase
        .from('matches')
        .update({
          team1_score: gameState.team1Games,
          team2_score: gameState.team2Games,
          winner_id: winnerId,
          match_status: 'completed',
          actual_end_time: new Date().toISOString()
        })
        .eq('id', matchIdNum)
      
      if (error) {
        console.error('更新比赛结果失败:', error)
      } else {
        console.log('比赛结果已更新')
        
        // 更新队伍胜负记录
        const loser_id = winnerId === match.team1_id ? match.team2_id : match.team1_id
        
        // 更新获胜队伍
        await supabase.rpc('increment_team_wins', { team_id: winnerId })
        
        // 更新失败队伍
        await supabase.rpc('increment_team_losses', { team_id: loser_id })
        
        // 更新积分
        if (match.team1_id && match.team2_id) {
          await supabase
            .from('teams')
            .update({ 
              points_for: (match.team1?.points_for || 0) + gameState.team1Games,
              points_against: (match.team1?.points_against || 0) + gameState.team2Games
            })
            .eq('id', match.team1_id)
          
          await supabase
            .from('teams')
            .update({ 
              points_for: (match.team2?.points_for || 0) + gameState.team2Games,
              points_against: (match.team2?.points_against || 0) + gameState.team1Games
            })
            .eq('id', match.team2_id)
        }
      }
    } catch (error) {
      console.error('更新比赛结果失败:', error)
    }
  }

  // 加载比赛数据
  useEffect(() => {
    if (matchId) {
      fetchMatchData(matchId)
    } else {
      setLoading(false)
    }
  }, [matchId])

  // 当比赛结束时自动更新结果
  useEffect(() => {
    const winner = getMatchWinner()
    if (winner && match && matchId) {
      updateMatchResult()
    }
  }, [gameState.team1Games, gameState.team2Games, match, matchId, team1Name, team2Name])

  // 处理得分 - 只有发球方得分才有效
  const handlePoint = () => {
    if (!gameState.isGameActive) return

    setGameState(prev => {
      // 匹克球规则：只有发球方可以得分
      const newTeam1Score = prev.servingTeam === 1 ? prev.team1Score + 1 : prev.team1Score;
      const newTeam2Score = prev.servingTeam === 2 ? prev.team2Score + 1 : prev.team2Score;
      
      // 检查是否有队伍获胜
      const isWinning = (score: number, opponentScore: number) => {
        return score >= winningScore && score - opponentScore >= 2;
      };
      
      const team1Wins = isWinning(newTeam1Score, newTeam2Score);
      const team2Wins = isWinning(newTeam2Score, newTeam1Score);
      
      let newState = {
        ...prev,
        team1Score: newTeam1Score,
        team2Score: newTeam2Score
      };
      
      // 处理游戏结束逻辑
      if (team1Wins || team2Wins) {
        if (matchFormat === 'single') {
          newState = {
            ...newState,
            isGameActive: false,
            team1Games: team1Wins ? 1 : 0,
            team2Games: team2Wins ? 1 : 0
          };
        } else if (matchFormat === 'best-of-3') {
          const newTeam1Games = team1Wins ? prev.team1Games + 1 : prev.team1Games;
          const newTeam2Games = team2Wins ? prev.team2Games + 1 : prev.team2Games;
          
          newState = {
            ...newState,
            team1Games: newTeam1Games,
            team2Games: newTeam2Games
          };
          
          // 保存局数历史
          newState.gameHistory.push({
            team1Score: newState.team1Score,
            team2Score: newState.team2Score,
            team1Games: newState.team1Games,
            team2Games: newState.team2Games
          });
          
          // 检查是否有队伍赢得整场比赛
          if (newTeam1Games >= 2 || newTeam2Games >= 2) {
            newState.isGameActive = false;
          } else {
            // 重置下一局
            newState.team1Score = 0;
            newState.team2Score = 0;
            newState.servingTeam = 1;
            newState.serverNumber = 1;
          }
        }
      }
      // 发球方得分后继续发球，不需要换发球权

      return newState
    })
  }

  // 处理换发球权 - Side Out
  const handleSideOut = () => {
    if (!gameState.isGameActive) return

    setGameState(prev => {
      // 匹克球发球权轮换规则：
      // 1. 比赛开始时，第一个发球方（队伍1）只有1次发球机会（特殊规则）
      // 2. 第一次Side Out后，发球权直接转给队伍2的第1发球员
      // 3. 之后所有情况：第1发球员失误后，轮到第2发球员
      // 4. 第2发球员失误后，发球权转给对方队伍的第1发球员
      
      // 判断是否是比赛的真正开始（第一次发球）
      // 只有在0-0-1的状态下才是真正的第一次发球
      const isVeryFirstServe = prev.team1Score === 0 && prev.team2Score === 0 && 
                               prev.servingTeam === 1 && prev.serverNumber === 1;
      
      if (isVeryFirstServe) {
        // 比赛开始时的特殊规则：第一个发球方只有1次发球机会
        // 第一次Side Out后，发球权直接转给队伍2的第1发球员
        return {
          ...prev,
          servingTeam: 2,
          serverNumber: 1
        };
      }
      
      // 正常的发球权轮换逻辑
      if (prev.serverNumber === 1) {
        // 从第1发球员切换到第2发球员
        return {
          ...prev,
          serverNumber: 2
        };
      } else {
        // 从第2发球员切换到对方队伍的第1发球员
        return {
          ...prev,
          servingTeam: prev.servingTeam === 1 ? 2 : 1,
          serverNumber: 1
        };
      }
    })
  }

  const resetGame = () => {
    setGameState({
      team1Score: 0,
      team2Score: 0,
      team1Games: 0,
      team2Games: 0,
      servingTeam: initialServingTeam,
      serverNumber: 1,
      isGameActive: false,
      gameHistory: []
    })
  }

  // 切换开球方
  const toggleInitialServingTeam = () => {
    if (gameState.isGameActive) return
    
    const newServingTeam = initialServingTeam === 1 ? 2 : 1
    setInitialServingTeam(newServingTeam)
    
    // 同时更新当前游戏状态中的发球方
    setGameState(prev => ({
      ...prev,
      servingTeam: newServingTeam,
      serverNumber: 1
    }))
  }

  const toggleGame = () => {
    setGameState(prev => ({
      ...prev,
      isGameActive: !prev.isGameActive
    }))
  }

  const getMatchWinner = () => {
    if (matchFormat === 'single') {
      if (gameState.team1Games > 0) return team1Name
      if (gameState.team2Games > 0) return team2Name
    } else {
      if (gameState.team1Games >= 2) return team1Name
      if (gameState.team2Games >= 2) return team2Name
    }
    return null
  }

  const matchWinner = getMatchWinner()

  // 加载状态
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-blue-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-white hover:text-gray-200 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              返回
            </button>
            <h2 className="text-2xl font-bold text-white">
              {match ? `${match.team1?.name || 'TBD'} vs ${match.team2?.name || 'TBD'}` : '匹克球计分器'}
            </h2>
            <div className="w-16"></div> {/* 占位符保持居中 */}
          </div>
          {match && (
            <div className="text-center mt-2">
              <span className="text-sm text-blue-100">
                第{match.match_round}轮 · {new Date(match.scheduled_time).toLocaleString('zh-CN')}
              </span>
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">比赛格式</label>
              <select
                value={matchFormat}
                onChange={(e) => setMatchFormat(e.target.value as 'single' | 'best-of-3')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={gameState.isGameActive}
              >
                <option value="single">单局制</option>
                <option value="best-of-3">三局两胜</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">获胜分数</label>
              <select
                value={winningScore}
                onChange={(e) => setWinningScore(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={gameState.isGameActive}
              >
                <option value={11}>11分</option>
                <option value={15}>15分</option>
                <option value={21}>21分</option>
              </select>
            </div>
            <div className="flex items-end space-x-2">
              {!gameState.isGameActive && (
                <button
                  onClick={toggleInitialServingTeam}
                  className="flex items-center px-4 py-2 rounded-md font-medium bg-blue-500 hover:bg-blue-600 text-white"
                  title="切换开球方"
                >
                  🔄 {initialServingTeam === 1 ? team1Name : team2Name} 开球
                </button>
              )}
              <button
                onClick={toggleGame}
                className={`flex items-center px-4 py-2 rounded-md font-medium ${
                  gameState.isGameActive
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {gameState.isGameActive ? (
                  <><Pause className="h-4 w-4 mr-2" />暂停</>
                ) : (
                  <><Play className="h-4 w-4 mr-2" />开始</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Team Names */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">队伍1名称</label>
              <input
                type="text"
                value={team1Name}
                onChange={(e) => setTeam1Name(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={gameState.isGameActive || !!match}
                placeholder={match ? "来自比赛数据" : "输入队伍1名称"}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">队伍2名称</label>
              <input
                type="text"
                value={team2Name}
                onChange={(e) => setTeam2Name(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={gameState.isGameActive || !!match}
                placeholder={match ? "来自比赛数据" : "输入队伍2名称"}
              />
            </div>
          </div>
        </div>

        {/* Match Winner */}
        {matchWinner && (
          <div className="p-6 bg-yellow-50 border-b border-gray-200">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-yellow-800">🏆 比赛结束！</h3>
              <p className="text-xl text-yellow-700 mt-2">{matchWinner} 获胜！</p>
            </div>
          </div>
        )}

        {/* Scoreboard */}
        <div className="p-6">
          {/* 匹克球分数显示 x-x-x 格式 */}
          <div className="text-center mb-8">
            <div className="text-8xl font-bold text-gray-900 mb-4">
              {gameState.team1Score} - {gameState.team2Score} - {gameState.serverNumber}
            </div>
            <div className="text-lg text-gray-600 mb-2">
              {gameState.servingTeam === 1 ? team1Name : team2Name} 发球
            </div>
            <div className="text-sm text-gray-500">
              第{gameState.serverNumber}发球员
            </div>
          </div>

          {/* 队伍信息 */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            {/* Team 1 */}
            <div className="text-center">
              <div className={`p-6 rounded-lg border-2 ${
                gameState.servingTeam === 1 ? 'border-green-500 bg-green-50' : 'border-gray-200'
              }`}>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{team1Name}</h3>
                {gameState.servingTeam === 1 && (
                  <div className="text-sm text-green-600 font-medium mb-2">
                    🏓 发球方
                  </div>
                )}
                <div className="text-4xl font-bold text-gray-900 mb-2">{gameState.team1Score}</div>
                {matchFormat === 'best-of-3' && (
                  <div className="text-lg text-gray-600">局数: {gameState.team1Games}</div>
                )}
              </div>
            </div>

            {/* Team 2 */}
            <div className="text-center">
              <div className={`p-6 rounded-lg border-2 ${
                gameState.servingTeam === 2 ? 'border-green-500 bg-green-50' : 'border-gray-200'
              }`}>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{team2Name}</h3>
                {gameState.servingTeam === 2 && (
                  <div className="text-sm text-green-600 font-medium mb-2">
                    🏓 发球方
                  </div>
                )}
                <div className="text-4xl font-bold text-gray-900 mb-2">{gameState.team2Score}</div>
                {matchFormat === 'best-of-3' && (
                  <div className="text-lg text-gray-600">局数: {gameState.team2Games}</div>
                )}
              </div>
            </div>
          </div>

          {/* 匹克球操作按钮 */}
          <div className="flex justify-center space-x-4 mb-8">
            <button
              onClick={handleSideOut}
              disabled={!gameState.isGameActive}
              className="px-8 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
            >
              Side Out
            </button>
            <button
              onClick={handlePoint}
              disabled={!gameState.isGameActive}
              className="px-8 py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
            >
              Point
            </button>
          </div>

          {/* Reset Button */}
          <div className="text-center mt-8">
            <button
              onClick={resetGame}
              className="flex items-center mx-auto px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              重置比赛
            </button>
          </div>
        </div>

        {/* Game History */}
        {gameState.gameHistory.length > 0 && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <h3 className="text-lg font-bold text-gray-900 mb-4">比赛历史</h3>
            <div className="space-y-2">
              {gameState.gameHistory.map((game, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="font-medium">第 {index + 1} 局</span>
                  <span className="text-lg font-bold">
                    {game.team1Score} - {game.team2Score}
                  </span>
                  <span className="text-sm text-gray-600">
                    {game.team1Score > game.team2Score ? team1Name : team2Name} 获胜
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}