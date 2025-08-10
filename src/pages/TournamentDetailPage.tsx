import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Users, Edit, Eye } from 'lucide-react';
import { 
  getTournamentById, 
  updateTournament, 
  getGroupById 
} from '../utils/storage';
import { 
  calculateTournamentStats,
  getRankingByWinPoints,
  getRankingByGamePoints,
  determineMatchWinner,
  isMatchCompleted
} from '../utils/scoreCalculation';
import { Tournament, Group, Match, MatchScore } from '../types';
import ScoreModal from '../components/ScoreModal';

const TournamentDetailPage: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [activeTab, setActiveTab] = useState<'matches' | 'rankings'>('matches');
  const [rankingType, setRankingType] = useState<'winPoints' | 'gamePoints'>('winPoints');
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [viewingMatch, setViewingMatch] = useState<Match | null>(null);

  useEffect(() => {
    if (tournamentId) {
      loadTournamentData();
    }
  }, [tournamentId]);

  const loadTournamentData = () => {
    if (!tournamentId) return;
    
    const tournamentData = getTournamentById(tournamentId);
    if (tournamentData) {
      setTournament(tournamentData);
      
      const groupData = getGroupById(tournamentData.groupId);
      setGroup(groupData || null);
    }
  };

  const handleScoreUpdate = (matchId: string, scores: MatchScore) => {
    if (!tournament) return;

    const updatedMatches = tournament.matches.map(match => {
      if (match.id === matchId) {
        return {
          ...match,
          scores,
          completed: isMatchCompleted(match, tournament.rules)
        };
      }
      return match;
    });

    // 모든 매치가 완료되었는지 확인
    const allCompleted = updatedMatches.every(match => match.completed);

    updateTournament(tournament.id, {
      matches: updatedMatches,
      completed: allCompleted
    });

    loadTournamentData();
    setEditingMatch(null);
  };

  const getMatchTypeText = (type: 'mens' | 'womens' | 'mixed') => {
    return {
      mens: '남자복식',
      womens: '여자복식',
      mixed: '혼성복식'
    }[type];
  };

  const getMatchStatusBadge = (match: Match) => {
    if (!match.scores) {
      return <span className="badge badge-secondary">경기 전</span>;
    }
    
    if (match.completed) {
      const winner = determineMatchWinner(match.scores, tournament!.rules);
      if (winner === 'draw') {
        return <span className="badge badge-warning">무승부</span>;
      }
      return <span className="badge badge-success">완료</span>;
    }
    
    return <span className="badge badge-primary">진행중</span>;
  };

  const getMatchScoreText = (match: Match) => {
    if (!match.scores?.sets || match.scores.sets.length === 0) {
      return '-';
    }

    const setScores = match.scores.sets.map(set => {
      if (set.tiebreakPlayed) {
        return `${set.team1Games}-${set.team2Games} (${set.team1TiebreakPoints}-${set.team2TiebreakPoints})`;
      }
      return `${set.team1Games}-${set.team2Games}`;
    });

    return setScores.join(', ');
  };

  const getTournamentStats = () => {
    if (!tournament) return null;

    const stats = calculateTournamentStats(tournament);
    const completedMatches = tournament.matches.filter(m => m.completed).length;
    const totalMatches = tournament.matches.length;

    return {
      completedMatches,
      totalMatches,
      progress: (completedMatches / totalMatches) * 100,
      winPointsRanking: getRankingByWinPoints(stats),
      gamePointsRanking: getRankingByGamePoints(stats)
    };
  };

  if (!tournament || !group) {
    return (
      <div className="text-center py-12">
        <div className="spinner mx-auto mb-4"></div>
        <p className="text-gray-600">토너먼트 정보를 불러오는 중...</p>
      </div>
    );
  }

  const stats = getTournamentStats();

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Link to={`/groups/${group.id}`} className="btn btn-secondary">
          <ArrowLeft className="h-4 w-4" />
          그룹으로 돌아가기
        </Link>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">{tournament.name}</h1>
            {tournament.completed && (
              <span className="badge badge-success">
                <Trophy className="h-3 w-3" />
                완료
              </span>
            )}
          </div>
          <p className="text-gray-600">
            {group.name} • {tournament.participants.length}명 참가 • {tournament.matches.length}경기
          </p>
        </div>
      </div>

      {/* 진행 상황 */}
      {stats && (
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">진행 상황</h3>
              <div className="text-sm text-gray-600">
                {stats.completedMatches} / {stats.totalMatches} 경기 완료
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-primary h-3 rounded-full transition-all duration-300"
                style={{ width: `${stats.progress}%` }}
              ></div>
            </div>
            
            <div className="mt-2 text-sm text-gray-600">
              {stats.progress.toFixed(1)}% 완료
            </div>
          </div>
        </div>
      )}

      {/* 탭 네비게이션 */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('matches')}
              className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                activeTab === 'matches' 
                  ? 'bg-primary text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="h-4 w-4 inline mr-2" />
              경기 관리
            </button>
            <button
              onClick={() => setActiveTab('rankings')}
              className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                activeTab === 'rankings' 
                  ? 'bg-primary text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Trophy className="h-4 w-4 inline mr-2" />
              순위표
            </button>
          </div>
        </div>

        <div className="card-body">
          {activeTab === 'matches' && (
            <div className="space-y-4">
              {tournament.matches.map((match, index) => (
                <div key={match.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium">매치 {index + 1}</h4>
                      <span className={`badge ${
                        match.matchType === 'mens' ? 'badge-primary' :
                        match.matchType === 'womens' ? 'badge-warning' : 'badge-secondary'
                      }`}>
                        {getMatchTypeText(match.matchType)}
                      </span>
                      {getMatchStatusBadge(match)}
                      {match.courtNumber && (
                        <span className="text-sm text-gray-600">코트 {match.courtNumber}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {match.scores && (
                        <button
                          onClick={() => setViewingMatch(match)}
                          className="btn btn-sm btn-secondary"
                        >
                          <Eye className="h-3 w-3" />
                          상세
                        </button>
                      )}
                      <button
                        onClick={() => setEditingMatch(match)}
                        className="btn btn-sm btn-primary"
                      >
                        <Edit className="h-3 w-3" />
                        {match.scores ? '수정' : '입력'}
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div className="text-center">
                      <div className="font-medium text-gray-900">
                        {match.team1.player1.name} & {match.team1.player2.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        Lv.{match.team1.player1.level} & Lv.{match.team1.player2.level}
                      </div>
                    </div>
                    
                    <div className="text-center font-mono text-lg font-bold">
                      {getMatchScoreText(match)}
                    </div>
                    
                    <div className="text-center">
                      <div className="font-medium text-gray-900">
                        {match.team2.player1.name} & {match.team2.player2.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        Lv.{match.team2.player1.level} & Lv.{match.team2.player2.level}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'rankings' && stats && (
            <div className="space-y-6">
              {/* 순위 타입 선택 */}
              <div className="flex items-center gap-4">
                <span className="font-medium text-gray-900">순위 기준:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setRankingType('winPoints')}
                    className={`btn btn-sm ${
                      rankingType === 'winPoints' ? 'btn-primary' : 'btn-secondary'
                    }`}
                  >
                    승점 기준
                  </button>
                  <button
                    onClick={() => setRankingType('gamePoints')}
                    className={`btn btn-sm ${
                      rankingType === 'gamePoints' ? 'btn-primary' : 'btn-secondary'
                    }`}
                  >
                    게임 포인트 기준
                  </button>
                </div>
              </div>

              {/* 순위표 */}
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>순위</th>
                      <th>선수명</th>
                      <th>경기수</th>
                      <th>승-무-패</th>
                      <th>승점</th>
                      <th>게임포인트</th>
                      <th>게임승-패</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(rankingType === 'winPoints' ? stats.winPointsRanking : stats.gamePointsRanking)
                      .map((playerStat, index) => (
                        <tr key={playerStat.playerId} className={index < 3 ? 'bg-yellow-50' : ''}>
                          <td>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{index + 1}</span>
                              {index === 0 && <Trophy className="h-4 w-4 text-yellow-500" />}
                              {index === 1 && <Trophy className="h-4 w-4 text-gray-400" />}
                              {index === 2 && <Trophy className="h-4 w-4 text-orange-600" />}
                            </div>
                          </td>
                          <td className="font-medium">{playerStat.playerName}</td>
                          <td>{playerStat.matchesPlayed}</td>
                          <td>{playerStat.wins}-{playerStat.draws}-{playerStat.losses}</td>
                          <td className="font-bold text-primary">{playerStat.winPoints}</td>
                          <td className="font-bold text-success">{playerStat.gamePoints > 0 ? '+' : ''}{playerStat.gamePoints}</td>
                          <td>{playerStat.gamesWon}-{playerStat.gamesLost}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* 순위 설명 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">순위 계산 방식</h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <p className="font-medium mb-1">승점 기준</p>
                    <ul className="space-y-1">
                      <li>• 승리: 3점</li>
                      <li>• 무승부: 2점</li>
                      <li>• 패배: 0점</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium mb-1">게임 포인트 기준</p>
                    <ul className="space-y-1">
                      <li>• 게임 승리 시: +1점</li>
                      <li>• 게임 패배 시: -1점</li>
                      <li>• 예: 4-2 승리 = +2점 (+4-2)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 스코어 입력/수정 모달 */}
      {editingMatch && (
        <ScoreModal
          match={editingMatch}
          rules={tournament.rules}
          onClose={() => setEditingMatch(null)}
          onSave={handleScoreUpdate}
        />
      )}

      {/* 스코어 상세 보기 모달 */}
      {viewingMatch && (
        <div className="modal-overlay" onClick={() => setViewingMatch(null)}>
          <div className="modal modal-md">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h3 className="card-title">매치 상세</h3>
                <button
                  onClick={() => setViewingMatch(null)}
                  className="btn btn-sm btn-secondary"
                >
                  닫기
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div className="text-center">
                  <h4 className="font-semibold text-lg">
                    {viewingMatch.team1.player1.name} & {viewingMatch.team1.player2.name}
                    <span className="mx-4 text-gray-400">vs</span>
                    {viewingMatch.team2.player1.name} & {viewingMatch.team2.player2.name}
                  </h4>
                  <p className="text-gray-600">{getMatchTypeText(viewingMatch.matchType)}</p>
                </div>
                
                {viewingMatch.scores?.sets && (
                  <div className="space-y-2">
                    {viewingMatch.scores.sets.map((set, index) => (
                      <div key={index} className="flex items-center justify-center gap-4 p-2 border rounded">
                        <span>세트 {index + 1}:</span>
                        <span className="font-mono font-bold">
                          {set.team1Games} - {set.team2Games}
                          {set.tiebreakPlayed && (
                            <span className="text-sm ml-2">
                              ({set.team1TiebreakPoints} - {set.team2TiebreakPoints})
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                
                {viewingMatch.completed && viewingMatch.scores && (
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">
                      승자: {
                        (() => {
                          const winner = determineMatchWinner(viewingMatch.scores, tournament.rules);
                          if (winner === 'team1') {
                            return `${viewingMatch.team1.player1.name} & ${viewingMatch.team1.player2.name}`;
                          } else if (winner === 'team2') {
                            return `${viewingMatch.team2.player1.name} & ${viewingMatch.team2.player2.name}`;
                          } else if (winner === 'draw') {
                            return '무승부';
                          }
                          return '경기 진행중';
                        })()
                      }
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentDetailPage;