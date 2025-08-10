import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Users, Trophy } from 'lucide-react';
import { 
  getGroupById, 
  updateGroup, 
  addPlayerToGroup, 
  removePlayerFromGroup, 
  updatePlayerInGroup,
  getTournamentsByGroupId 
} from '../utils/storage';
import { Group, Player } from '../types';
import { v4 as uuidv4 } from 'uuid';
import PlayerModal from '../components/PlayerModal';

const GroupDetailPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<Group | null>(null);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [groupNameEdit, setGroupNameEdit] = useState(false);
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    if (groupId) {
      loadGroupData();
    }
  }, [groupId]);

  const loadGroupData = () => {
    if (groupId) {
      const groupData = getGroupById(groupId);
      if (groupData) {
        setGroup(groupData);
        setGroupName(groupData.name);
      } else {
        navigate('/groups');
      }
    }
  };

  const handleUpdateGroupName = () => {
    if (groupId && groupName.trim() && groupName.trim() !== group?.name) {
      updateGroup(groupId, { name: groupName.trim() });
      loadGroupData();
    }
    setGroupNameEdit(false);
  };

  const handleAddPlayer = (playerData: Omit<Player, 'id'>) => {
    if (groupId) {
      try {
        const newPlayer: Player = {
          ...playerData,
          id: uuidv4(),
        };
        addPlayerToGroup(groupId, newPlayer);
        loadGroupData();
        setIsPlayerModalOpen(false);
      } catch (error) {
        alert(error instanceof Error ? error.message : '플레이어 추가에 실패했습니다.');
      }
    }
  };

  const handleEditPlayer = (playerData: Omit<Player, 'id'>) => {
    if (groupId && editingPlayer) {
      updatePlayerInGroup(groupId, editingPlayer.id, playerData);
      loadGroupData();
      setEditingPlayer(null);
    }
  };

  const handleDeletePlayer = (playerId: string) => {
    if (deleteConfirm === playerId && groupId) {
      removePlayerFromGroup(groupId, playerId);
      loadGroupData();
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(playerId);
    }
  };

  const getLevelText = (level: number) => {
    const levels = ['', '초급', '초중급', '중급', '중상급', '상급'];
    return levels[level] || '';
  };

  const getGenderText = (gender: 'male' | 'female') => {
    return gender === 'male' ? '남성' : '여성';
  };

  const groupStats = () => {
    if (!group) return { males: 0, females: 0, tournaments: 0 };
    
    const males = group.players.filter(p => p.gender === 'male').length;
    const females = group.players.filter(p => p.gender === 'female').length;
    const tournaments = getTournamentsByGroupId(group.id).length;
    
    return { males, females, tournaments };
  };

  if (!group) {
    return (
      <div className="text-center py-12">
        <div className="spinner mx-auto mb-4"></div>
        <p className="text-gray-600">그룹 정보를 불러오는 중...</p>
      </div>
    );
  }

  const stats = groupStats();

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Link to="/groups" className="btn btn-secondary">
          <ArrowLeft className="h-4 w-4" />
          그룹 목록
        </Link>
        
        <div className="flex-1">
          {groupNameEdit ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="form-input text-xl font-bold"
                onBlur={handleUpdateGroupName}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUpdateGroupName();
                  if (e.key === 'Escape') {
                    setGroupName(group.name);
                    setGroupNameEdit(false);
                  }
                }}
                autoFocus
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
              <button
                onClick={() => setGroupNameEdit(true)}
                className="btn btn-sm btn-secondary"
              >
                <Edit className="h-3 w-3" />
              </button>
            </div>
          )}
          <p className="text-gray-600">
            멤버 {group.players.length}명 • 
            남성 {stats.males}명, 여성 {stats.females}명 • 
            토너먼트 {stats.tournaments}개
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setIsPlayerModalOpen(true)}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4" />
            멤버 추가
          </button>
          
          {group.players.length >= 4 ? (
            <Link
              to={`/groups/${group.id}/tournaments/new`}
              className="btn btn-success"
            >
              <Trophy className="h-4 w-4" />
              토너먼트 생성
            </Link>
          ) : (
            <button disabled className="btn btn-secondary" title="최소 4명의 멤버가 필요합니다">
              <Trophy className="h-4 w-4" />
              토너먼트 생성
            </button>
          )}
        </div>
      </div>

      {/* 멤버 목록 */}
      {group.players.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              등록된 멤버가 없습니다
            </h3>
            <p className="text-gray-600 mb-6">
              첫 번째 멤버를 추가하여 그룹을 구성해보세요
            </p>
            <button
              onClick={() => setIsPlayerModalOpen(true)}
              className="btn btn-primary"
            >
              <Plus className="h-4 w-4" />
              멤버 추가하기
            </button>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">멤버 목록</h2>
          </div>
          <div className="card-body p-0">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>이름</th>
                    <th>성별</th>
                    <th>실력 레벨</th>
                    <th>등록일</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {group.players.map((player) => (
                    <tr key={player.id}>
                      <td className="font-medium">{player.name}</td>
                      <td>
                        <span className={`badge ${
                          player.gender === 'male' ? 'badge-primary' : 'badge-warning'
                        }`}>
                          {getGenderText(player.gender)}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-secondary">
                          {getLevelText(player.level)} (Lv.{player.level})
                        </span>
                      </td>
                      <td className="text-sm text-gray-600">
                        {new Date(group.createdAt).toLocaleDateString('ko-KR')}
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingPlayer(player)}
                            className="btn btn-sm btn-secondary"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDeletePlayer(player.id)}
                            className={`btn btn-sm ${
                              deleteConfirm === player.id ? 'btn-error' : 'btn-secondary'
                            }`}
                            title={deleteConfirm === player.id ? '다시 클릭하여 확인' : '멤버 삭제'}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 토너먼트 미리보기 */}
      {stats.tournaments > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">이 그룹의 토너먼트</h2>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {getTournamentsByGroupId(group.id)
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                .slice(0, 5)
                .map(tournament => (
                  <div key={tournament.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{tournament.name}</h4>
                      <p className="text-sm text-gray-600">
                        {tournament.participants.length}명 참가 • {tournament.matches.length}경기
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(tournament.updatedAt).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${tournament.completed ? 'badge-success' : 'badge-warning'}`}>
                        {tournament.completed ? '완료' : '진행중'}
                      </span>
                      <Link to={`/tournaments/${tournament.id}`} className="btn btn-sm btn-secondary">
                        보기
                      </Link>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* 도움말 */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">멤버 관리 가이드</h3>
        </div>
        <div className="card-body">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">실력 레벨 설정</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li><strong>1 (초급):</strong> 테니스를 시작한 지 얼마 안된 분</li>
                <li><strong>2 (초중급):</strong> 기본 스트로크가 가능한 분</li>
                <li><strong>3 (중급):</strong> 안정적인 랠리가 가능한 분</li>
                <li><strong>4 (중상급):</strong> 전술적 플레이가 가능한 분</li>
                <li><strong>5 (상급):</strong> 대회 출전 경험이 있는 분</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">대진 생성 규칙</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 같은 성별끼리 복식을 우선 구성합니다</li>
                <li>• 실력 레벨이 비슷한 팀끼리 매치됩니다</li>
                <li>• 성비가 맞지 않을 경우 혼성 복식으로 구성합니다</li>
                <li>• 최소 4명의 멤버가 있어야 토너먼트를 생성할 수 있습니다</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 플레이어 추가/수정 모달 */}
      {(isPlayerModalOpen || editingPlayer) && (
        <PlayerModal
          player={editingPlayer}
          onClose={() => {
            setIsPlayerModalOpen(false);
            setEditingPlayer(null);
          }}
          onSubmit={editingPlayer ? handleEditPlayer : handleAddPlayer}
        />
      )}
    </div>
  );
};

export default GroupDetailPage;