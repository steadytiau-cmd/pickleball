import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Minus, RotateCcw, Play, Pause, ArrowLeft } from 'lucide-react'

interface GameState {
  team1Score: number
  team2Score: number
  team1Games: number
  team2Games: number
  currentServer: 1 | 2
  serverNumber: 1 | 2
  isGameActive: boolean
  gameHistory: Array<{
    team1Score: number
    team2Score: number
    team1Games: number
    team2Games: number
  }>
}

interface Team {
  id: string
  name: string
  team_type: string
  player1_name: string
  player2_name: string
}

interface Match {
  id: string
  tournament_id: string
  team1_id: string
  team2_id: string
  team1?: Team
  team2?: Team
  match_round: number
  match_status: 'scheduled' | 'in_progress' | 'completed'
  scheduled_time: string
  team1_score?: number
  team2_score?: number
  winner_id?: string
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
    currentServer: 1,
    serverNumber: 1,
    isGameActive: false,
    gameHistory: []
  })

  const [matchFormat, setMatchFormat] = useState<'single' | 'best-of-3'>('single')
  const [winningScore, setWinningScore] = useState(21)

  // 获取比赛数据
  const fetchMatchData = async (id: string) => {
    try {
      const response = await fetch(`/api/matches/${id}`)
      if (response.ok) {
        const matchData = await response.json()
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
      
      const response = await fetch(`/api/matches/${matchId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          team1_score: gameState.team1Games,
          team2_score: gameState.team2Games,
          winner_id: winnerId,
          match_status: 'completed'
        })
      })
      
      if (response.ok) {
        console.log('比赛结果已更新')
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

  const addPoint = (team: 1 | 2) => {
    if (!gameState.isGameActive) return

    setGameState(prev => {
      const newState = { ...prev }
      
      if (team === 1) {
        newState.team1Score += 1
      } else {
        newState.team2Score += 1
      }

      // Check for game win
      const team1Won = newState.team1Score >= winningScore && newState.team1Score - newState.team2Score >= 2
      const team2Won = newState.team2Score >= winningScore && newState.team2Score - newState.team1Score >= 2

      if (team1Won || team2Won) {
        if (team1Won) newState.team1Games += 1
        if (team2Won) newState.team2Games += 1

        // Save game to history
        newState.gameHistory.push({
          team1Score: newState.team1Score,
          team2Score: newState.team2Score,
          team1Games: newState.team1Games,
          team2Games: newState.team2Games
        })

        // Check for match win
        if (matchFormat === 'single' || 
            (matchFormat === 'best-of-3' && (newState.team1Games >= 2 || newState.team2Games >= 2))) {
          newState.isGameActive = false
        } else {
          // Reset for next game
          newState.team1Score = 0
          newState.team2Score = 0
          newState.currentServer = 1
          newState.serverNumber = 1
        }
      } else {
        // Switch server if the serving team didn't score
        if (team !== newState.currentServer) {
          if (newState.serverNumber === 1) {
            newState.serverNumber = 2
          } else {
            newState.currentServer = newState.currentServer === 1 ? 2 : 1
            newState.serverNumber = 1
          }
        }
      }

      return newState
    })
  }

  const subtractPoint = (team: 1 | 2) => {
    if (!gameState.isGameActive) return

    setGameState(prev => {
      const newState = { ...prev }
      
      if (team === 1 && newState.team1Score > 0) {
        newState.team1Score -= 1
      } else if (team === 2 && newState.team2Score > 0) {
        newState.team2Score -= 1
      }

      return newState
    })
  }

  const resetGame = () => {
    setGameState({
      team1Score: 0,
      team2Score: 0,
      team1Games: 0,
      team2Games: 0,
      currentServer: 1,
      serverNumber: 1,
      isGameActive: false,
      gameHistory: []
    })
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
            <div className="flex items-end">
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
          <div className="grid grid-cols-2 gap-8">
            {/* Team 1 */}
            <div className="text-center">
              <div className={`p-6 rounded-lg border-2 ${
                gameState.currentServer === 1 ? 'border-green-500 bg-green-50' : 'border-gray-200'
              }`}>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{team1Name}</h3>
                {gameState.currentServer === 1 && (
                  <div className="text-sm text-green-600 font-medium mb-2">
                    发球方 (第{gameState.serverNumber}发球)
                  </div>
                )}
                <div className="text-6xl font-bold text-gray-900 mb-4">{gameState.team1Score}</div>
                {matchFormat === 'best-of-3' && (
                  <div className="text-lg text-gray-600 mb-4">局数: {gameState.team1Games}</div>
                )}
                <div className="flex justify-center space-x-2">
                  <button
                    onClick={() => subtractPoint(1)}
                    disabled={!gameState.isGameActive || gameState.team1Score === 0}
                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => addPoint(1)}
                    disabled={!gameState.isGameActive}
                    className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-6 w-6" />
                  </button>
                </div>
              </div>
            </div>

            {/* Team 2 */}
            <div className="text-center">
              <div className={`p-6 rounded-lg border-2 ${
                gameState.currentServer === 2 ? 'border-green-500 bg-green-50' : 'border-gray-200'
              }`}>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{team2Name}</h3>
                {gameState.currentServer === 2 && (
                  <div className="text-sm text-green-600 font-medium mb-2">
                    发球方 (第{gameState.serverNumber}发球)
                  </div>
                )}
                <div className="text-6xl font-bold text-gray-900 mb-4">{gameState.team2Score}</div>
                {matchFormat === 'best-of-3' && (
                  <div className="text-lg text-gray-600 mb-4">局数: {gameState.team2Games}</div>
                )}
                <div className="flex justify-center space-x-2">
                  <button
                    onClick={() => subtractPoint(2)}
                    disabled={!gameState.isGameActive || gameState.team2Score === 0}
                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => addPoint(2)}
                    disabled={!gameState.isGameActive}
                    className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-6 w-6" />
                  </button>
                </div>
              </div>
            </div>
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