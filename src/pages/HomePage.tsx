import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, Trophy, Calendar, TrendingUp } from 'lucide-react';
import { loadGroups, loadTournaments } from '../utils/storage';

const HomePage: React.FC = () => {
  const groups = loadGroups();
  const tournaments = loadTournaments();
  const recentTournaments = tournaments
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const stats = {
    totalGroups: groups.length,
    totalPlayers: groups.reduce((sum, group) => sum + group.players.length, 0),
    totalTournaments: tournaments.length,
    activeTournaments: tournaments.filter(t => !t.completed).length,
  };

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          테니스 동호회 대진표 생성기
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          복식 테니스 경기의 균형 잡힌 대진표를 자동으로 생성하고, 
          경기 결과를 체계적으로 관리할 수 있습니다.
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body text-center">
            <Users className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.totalGroups}</div>
            <div className="text-sm text-gray-600">활성 그룹</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <Trophy className="h-8 w-8 text-success mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.totalPlayers}</div>
            <div className="text-sm text-gray-600">총 참가자</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <Calendar className="h-8 w-8 text-warning mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.totalTournaments}</div>
            <div className="text-sm text-gray-600">총 토너먼트</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <TrendingUp className="h-8 w-8 text-error mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.activeTournaments}</div>
            <div className="text-sm text-gray-600">진행 중인 경기</div>
          </div>
        </div>
      </div>

      {/* 빠른 시작 */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">빠른 시작</h2>
        </div>
        <div className="card-body">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">1. 그룹 생성</h3>
              <p className="text-gray-600">
                테니스 동호회 멤버들을 그룹으로 등록하고 관리하세요. 
                각 멤버의 성별과 실력 레벨을 설정할 수 있습니다.
              </p>
              <Link to="/groups" className="btn btn-primary">
                <Users className="h-4 w-4" />
                그룹 관리하기
              </Link>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">2. 토너먼트 생성</h3>
              <p className="text-gray-600">
                그룹에서 참가자를 선택하고 경기 규칙을 설정한 후, 
                균형 잡힌 복식 대진표를 자동 생성하세요.
              </p>
              {groups.length > 0 ? (
                <Link to="/groups" className="btn btn-success">
                  <Plus className="h-4 w-4" />
                  토너먼트 시작하기
                </Link>
              ) : (
                <button disabled className="btn btn-secondary">
                  먼저 그룹을 생성하세요
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 최근 토너먼트 */}
      {recentTournaments.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">최근 토너먼트</h2>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {recentTournaments.map(tournament => {
                const group = groups.find(g => g.id === tournament.groupId);
                return (
                  <div key={tournament.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{tournament.name}</h4>
                      <p className="text-sm text-gray-600">
                        {group?.name} • {tournament.participants.length}명 참가 • {tournament.matches.length}경기
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
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 기능 소개 */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">주요 기능</h2>
        </div>
        <div className="card-body">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-light rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">스마트 대진 생성</h3>
              <p className="text-sm text-gray-600">
                성별과 실력 레벨을 고려하여 균형 잡힌 복식 대진표를 자동으로 생성합니다.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-success rounded-lg flex items-center justify-center mx-auto mb-3">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">경기 결과 관리</h3>
              <p className="text-sm text-gray-600">
                실시간 스코어 입력과 승점/포인트 기준의 자동 순위 계산 기능을 제공합니다.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-warning rounded-lg flex items-center justify-center mx-auto mb-3">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">유연한 규칙 설정</h3>
              <p className="text-sm text-gray-600">
                세트 수, 게임 수, 타이브레이크 등 다양한 테니스 경기 규칙을 설정할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;