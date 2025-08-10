import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, Trophy, Edit, Trash2 } from 'lucide-react';
import { loadGroups, createGroup, deleteGroup, getTournamentsByGroupId } from '../utils/storage';
import { Group } from '../types';
import CreateGroupModal from '../components/CreateGroupModal';

const GroupsPage: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadGroupData();
  }, []);

  const loadGroupData = () => {
    setGroups(loadGroups());
  };

  const handleCreateGroup = (groupData: { name: string }) => {
    createGroup({
      id: Date.now().toString(),
      name: groupData.name,
      players: [],
    });
    loadGroupData();
    setIsCreateModalOpen(false);
  };

  const handleDeleteGroup = (groupId: string) => {
    if (deleteConfirm === groupId) {
      deleteGroup(groupId);
      loadGroupData();
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(groupId);
    }
  };

  const getGroupStats = (group: Group) => {
    const tournaments = getTournamentsByGroupId(group.id);
    return {
      playerCount: group.players.length,
      tournamentCount: tournaments.length,
      activeTournaments: tournaments.filter(t => !t.completed).length,
      lastActivity: tournaments.length > 0 
        ? Math.max(...tournaments.map(t => new Date(t.updatedAt).getTime()))
        : new Date(group.updatedAt).getTime()
    };
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">그룹 관리</h1>
          <p className="text-gray-600 mt-1">
            테니스 동호회 그룹을 생성하고 멤버를 관리하세요
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4" />
          새 그룹 만들기
        </button>
      </div>

      {/* 그룹 목록 */}
      {groups.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              생성된 그룹이 없습니다
            </h3>
            <p className="text-gray-600 mb-6">
              첫 번째 그룹을 생성하여 테니스 동호회 멤버들을 관리해보세요
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn btn-primary"
            >
              <Plus className="h-4 w-4" />
              그룹 생성하기
            </button>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => {
            const stats = getGroupStats(group);
            return (
              <div key={group.id} className="card">
                <div className="card-header">
                  <div className="flex items-center justify-between">
                    <h3 className="card-title">{group.name}</h3>
                    <div className="flex items-center gap-1">
                      <Link
                        to={`/groups/${group.id}`}
                        className="btn btn-sm btn-secondary"
                      >
                        <Edit className="h-3 w-3" />
                      </Link>
                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        className={`btn btn-sm ${
                          deleteConfirm === group.id ? 'btn-error' : 'btn-secondary'
                        }`}
                        title={deleteConfirm === group.id ? '다시 클릭하여 확인' : '그룹 삭제'}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="card-body">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">멤버 수</span>
                      <span className="font-medium">{stats.playerCount}명</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">토너먼트</span>
                      <span className="font-medium">{stats.tournamentCount}개</span>
                    </div>
                    
                    {stats.activeTournaments > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">진행 중</span>
                        <span className="font-medium text-warning">
                          {stats.activeTournaments}개
                        </span>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500 border-t pt-2">
                      최근 활동: {new Date(stats.lastActivity).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                </div>
                
                <div className="card-footer">
                  <div className="flex gap-2">
                    <Link
                      to={`/groups/${group.id}`}
                      className="btn btn-primary flex-1"
                    >
                      <Users className="h-4 w-4" />
                      멤버 관리
                    </Link>
                    
                    {stats.playerCount >= 4 ? (
                      <Link
                        to={`/groups/${group.id}/tournaments/new`}
                        className="btn btn-success flex-1"
                      >
                        <Trophy className="h-4 w-4" />
                        토너먼트
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="btn btn-secondary flex-1"
                        title="최소 4명의 멤버가 필요합니다"
                      >
                        <Trophy className="h-4 w-4" />
                        토너먼트
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 도움말 */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">그룹 관리 가이드</h3>
        </div>
        <div className="card-body">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">그룹 생성</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 테니스 동호회나 팀 단위로 그룹을 생성하세요</li>
                <li>• 그룹명은 구분하기 쉬운 이름으로 설정하세요</li>
                <li>• 토너먼트 생성을 위해 최소 4명의 멤버가 필요합니다</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">멤버 관리</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 각 멤버의 성별과 실력 레벨을 정확히 설정하세요</li>
                <li>• 실력 레벨은 대진 균형에 중요한 요소입니다</li>
                <li>• 멤버 정보는 언제든지 수정할 수 있습니다</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 그룹 생성 모달 */}
      {isCreateModalOpen && (
        <CreateGroupModal
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateGroup}
        />
      )}
    </div>
  );
};

export default GroupsPage;