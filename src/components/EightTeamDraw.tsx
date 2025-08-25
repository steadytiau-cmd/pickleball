import React, { useState, useEffect } from 'react';
import { supabase, Team } from '../lib/supabase';
import { Shuffle, Save, X, Trophy, Users } from 'lucide-react';

interface EightTeamDrawProps {
  tournamentId: number;
  teams: Team[];
  onSave: (drawPositions: { [position: number]: Team }) => Promise<void>;
  onCancel: () => void;
}

function EightTeamDraw({ tournamentId, teams, onSave, onCancel }: EightTeamDrawProps) {
  const [drawPositions, setDrawPositions] = useState<{ [position: number]: Team | null }>(
    Object.fromEntries(Array.from({ length: 8 }, (_, i) => [i + 1, null]))
  );

  const handleRandomDraw = () => {
    if (availableTeams.length < 8) {
      alert('需要至少8支队伍才能进行抽签');
      return;
    }

    // 随机打乱队伍顺序
    const shuffledTeams = [...availableTeams].sort(() => Math.random() - 0.5);
    const newDrawPositions: { [position: number]: Team | null } = {};
    
    for (let i = 1; i <= 8; i++) {
      newDrawPositions[i] = shuffledTeams[i - 1] || null;
    }
    
    setDrawPositions(newDrawPositions);
  };

  const handleTeamAssign = (position: number, team: Team) => {
    // 检查该队伍是否已经被分配到其他位置
    const currentPosition = Object.entries(drawPositions).find(
      ([pos, assignedTeam]) => assignedTeam?.id === team.id
    )?.[0];

    if (currentPosition) {
      // 如果队伍已经在其他位置，先清除
      setDrawPositions(prev => ({
        ...prev,
        [currentPosition]: null
      }));
    }

    // 分配队伍到新位置
    setDrawPositions(prev => ({
      ...prev,
      [position]: team
    }));
  };

  const handleRemoveTeam = (position: number) => {
    setDrawPositions(prev => ({
      ...prev,
      [position]: null
    }));
  };

  // 获取可用的队伍（过滤掉已经分配的队伍）
  const getAvailableTeams = () => {
    const assignedTeamIds = Object.values(drawPositions)
      .filter(team => team !== null)
      .map(team => team!.id);
    
    return teams.filter(team => 
      team.is_active &&
      !assignedTeamIds.includes(team.id)
    );
  };

  const availableTeams = getAvailableTeams();

  const isDrawComplete = () => {
    return Object.values(drawPositions).every(team => team !== null);
  };

  const handleSave = () => {
    if (!isDrawComplete()) {
      alert('请为所有8个位置分配队伍');
      return;
    }
    // 确保所有位置都有队伍（类型转换）
    const completeDrawPositions = Object.fromEntries(
      Object.entries(drawPositions).filter(([_, team]) => team !== null)
    ) as { [position: number]: Team };
    onSave(completeDrawPositions);
  };

  const getTeamTypeLabel = (teamType: string) => {
    switch (teamType) {
      case 'mens': return '男双';
      case 'womens': return '女双';
      case 'mixed': return '混双';
      default: return teamType;
    }
  };



  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Trophy className="h-8 w-8 text-yellow-500" />
            <div>
              <h3 className="text-xl font-bold text-gray-900">8队淘汰赛抽签</h3>
              <p className="text-sm text-gray-600">为8支队伍分配对战位置</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {availableTeams.length < 8 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-yellow-600" />
              <p className="text-yellow-800">
                当前只有 {availableTeams.length} 支队伍，需要至少8支队伍才能进行8队淘汰赛
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 可用队伍列表 */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">可用队伍</h4>
                <button
                  onClick={handleRandomDraw}
                  disabled={availableTeams.length < 8}
                  className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                >
                  <Shuffle className="h-4 w-4" />
                  <span>随机抽签</span>
                </button>
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableTeams.map((team) => (
                  <div
                    key={team.id}
                    className="bg-white p-3 rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer transition-colors"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('team', JSON.stringify(team));
                    }}
                  >
                    <div className="font-medium text-gray-900">{team.name}</div>
                    <div className="text-sm text-gray-600">
                      {team.player1_name} / {team.player2_name}
                    </div>
                    <div className="text-xs text-blue-600">
                      {getTeamTypeLabel(team.team_type)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 抽签位置 */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4">对战位置分配</h4>
              
              <div className="grid grid-cols-2 gap-4">
                {/* 左侧四分之一决赛位置 */}
                <div className="space-y-4">
                  <h5 className="text-sm font-medium text-gray-700 text-center">四分之一决赛 (左侧)</h5>
                  {[1, 2, 3, 4].map((position) => (
                    <div
                      key={position}
                      className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-4 min-h-[80px] flex items-center justify-center hover:border-blue-400 transition-colors"
                      onDrop={(e) => {
                        e.preventDefault();
                        const teamData = e.dataTransfer.getData('team');
                        if (teamData) {
                          const team = JSON.parse(teamData);
                          handleTeamAssign(position, team);
                        }
                      }}
                      onDragOver={(e) => e.preventDefault()}
                    >
                      {drawPositions[position] ? (
                        <div className="text-center w-full">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              #{position}
                            </span>
                            <button
                              onClick={() => handleRemoveTeam(position)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="font-medium text-gray-900">
                            {drawPositions[position]!.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {drawPositions[position]!.player1_name} / {drawPositions[position]!.player2_name}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-400">
                          <div className="text-xs mb-1">位置 #{position}</div>
                          <div className="text-sm">拖拽队伍到此处</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* 右侧四分之一决赛位置 */}
                <div className="space-y-4">
                  <h5 className="text-sm font-medium text-gray-700 text-center">四分之一决赛 (右侧)</h5>
                  {[5, 6, 7, 8].map((position) => (
                    <div
                      key={position}
                      className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-4 min-h-[80px] flex items-center justify-center hover:border-blue-400 transition-colors"
                      onDrop={(e) => {
                        e.preventDefault();
                        const teamData = e.dataTransfer.getData('team');
                        if (teamData) {
                          const team = JSON.parse(teamData);
                          handleTeamAssign(position, team);
                        }
                      }}
                      onDragOver={(e) => e.preventDefault()}
                    >
                      {drawPositions[position] ? (
                        <div className="text-center w-full">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              #{position}
                            </span>
                            <button
                              onClick={() => handleRemoveTeam(position)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="font-medium text-gray-900">
                            {drawPositions[position]!.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {drawPositions[position]!.player1_name} / {drawPositions[position]!.player2_name}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-400">
                          <div className="text-xs mb-1">位置 #{position}</div>
                          <div className="text-sm">拖拽队伍到此处</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            已分配: {Object.values(drawPositions).filter(team => team !== null).length} / 8
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={!isDrawComplete()}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>保存抽签结果</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EightTeamDraw;