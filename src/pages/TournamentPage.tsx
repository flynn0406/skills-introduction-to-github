import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, AlertTriangle } from 'lucide-react';
import { getGroupById, createTournament } from '../utils/storage';
import { generateMatches, validateMatchBalance } from '../utils/matchGeneration';
import { Group, GameRules, Tournament } from '../types';
import { v4 as uuidv4 } from 'uuid';

const TournamentPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<Group | null>(null);
  const [step, setStep] = useState<'participants' | 'rules' | 'preview'>('participants');
  
  // 토너먼트 데이터
  const [tournamentName, setTournamentName] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [rules, setRules] = useState<GameRules>({
    matchCount: 4,
    setsPerMatch: 1,
    gamesPerSet: 4,
    deuceRule: 'no-ad',
    tiebreakRule: 'five-point',
  });
  
  const [previewMatches, setPreviewMatches] = useState<any[]>([]);
  const [balanceInfo, setBalanceInfo] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (groupId) {
      const groupData = getGroupById(groupId);
      if (groupData) {
        setGroup(groupData);
        setTournamentName(`${groupData.name} 토너먼트 ${new Date().toLocaleDateString('ko-KR')}`);
      } else {
        navigate('/groups');
      }
    }
  }, [groupId, navigate]);

  const handleParticipantToggle = (playerId: string) => {
    setSelectedParticipants(prev => 
      prev.includes(playerId) 
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
    setError('');
  };

  const handleSelectAll = () => {
    if (!group) return;
    setSelectedParticipants(group.players.map(p => p.id));
  };

  const handleDeselectAll = () => {
    setSelectedParticipants([]);
  };

  const generatePreview = () => {
    if (!group || selectedParticipants.length < 4) {
      setError('최소 4명의 참가자를 선택해주세요.');
      return;
    }

    const participants = group.players.filter(p => selectedParticipants.includes(p.id));
    
    try {
      const matches = generateMatches({
        players: participants,
        rules,
        timeLimit: 2, // 2시간 기본값
      });
      
      setPreviewMatches(matches);
      setBalanceInfo(validateMatchBalance(matches));
      setStep('preview');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '대진표 생성에 실패했습니다.');
    }
  };

  const createTournamentFromPreview = () => {
    if (!group || !previewMatches.length) return;

    const participants = group.players.filter(p => selectedParticipants.includes(p.id));
    
    const tournament: Omit<Tournament, 'createdAt' | 'updatedAt'> = {
      id: uuidv4(),
      name: tournamentName,
      groupId: group.id,
      participants,
      rules,
      matches: previewMatches,
      completed: false,
    };

    const createdTournament = createTournament(tournament);
    navigate(`/tournaments/${createdTournament.id}`);
  };

  const getParticipantStats = () => {
    if (!group) return { total: 0, males: 0, females: 0, levels: {} };
    
    const participants = group.players.filter(p => selectedParticipants.includes(p.id));
    const males = participants.filter(p => p.gender === 'male').length;
    const females = participants.filter(p => p.gender === 'female').length;
    const levels = participants.reduce((acc, p) => {
      acc[p.level] = (acc[p.level] || 0) + 1;
      return acc;
    }, {} as { [key: number]: number });

    return { total: participants.length, males, females, levels };
  };

  const getRulesText = () => {
    const gamesText = rules.gamesPerSet === 4 ? '4게임' : '6게임';
    const deuceText = rules.deuceRule === 'advantage' ? 'Advantage' : 'No-Ad';
    const tiebreakText = {
      'seven-point': '7점 타이브레이크',
      'five-point': '5점 타이브레이크',
      'no-tiebreak': '타이없이 승자결정',
      'draw': '무승부 종료'
    }[rules.tiebreakRule];

    return `${gamesText} • ${rules.setsPerMatch}세트 • ${deuceText} • ${tiebreakText}`;
  };

  if (!group) {
    return (
      <div className="text-center py-12">
        <div className="spinner mx-auto mb-4"></div>
        <p className="text-gray-600">그룹 정보를 불러오는 중...</p>
      </div>
    );
  }

  const stats = getParticipantStats();

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            if (step === 'participants') {
              navigate(`/groups/${groupId}`);
            } else if (step === 'rules') {
              setStep('participants');
            } else {
              setStep('rules');
            }
          }}
          className="btn btn-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
          {step === 'participants' ? '그룹으로 돌아가기' : '이전'}
        </button>
        
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">토너먼트 생성</h1>
          <p className="text-gray-600">{group.name}</p>
        </div>
      </div>

      {/* 진행 단계 */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 ${step === 'participants' ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'participants' ? 'bg-primary text-white' : 'bg-gray-200'
              }`}>
                1
              </div>
              <span className="font-medium">참가자 선택</span>
            </div>
            
            <div className="flex-1 h-px bg-gray-200 mx-4"></div>
            
            <div className={`flex items-center gap-2 ${step === 'rules' ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'rules' ? 'bg-primary text-white' : 'bg-gray-200'
              }`}>
                2
              </div>
              <span className="font-medium">경기 규칙</span>
            </div>
            
            <div className="flex-1 h-px bg-gray-200 mx-4"></div>
            
            <div className={`flex items-center gap-2 ${step === 'preview' ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'preview' ? 'bg-primary text-white' : 'bg-gray-200'
              }`}>
                3
              </div>
              <span className="font-medium">대진표 미리보기</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* 단계별 컨텐츠 */}
      {step === 'participants' && (
        <div className="space-y-6">
          {/* 토너먼트 이름 */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">토너먼트 정보</h2>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">토너먼트 이름</label>
                <input
                  type="text"
                  value={tournamentName}
                  onChange={(e) => setTournamentName(e.target.value)}
                  className="form-input"
                  placeholder="토너먼트 이름을 입력하세요"
                />
              </div>
            </div>
          </div>

          {/* 참가자 선택 */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h2 className="card-title">
                  참가자 선택 ({stats.total}명 선택됨)
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="btn btn-sm btn-secondary"
                  >
                    전체 선택
                  </button>
                  <button
                    onClick={handleDeselectAll}
                    className="btn btn-sm btn-secondary"
                  >
                    전체 해제
                  </button>
                </div>
              </div>
            </div>
            <div className="card-body">
              {stats.total > 0 && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">
                    선택된 참가자: 총 {stats.total}명 (남성 {stats.males}명, 여성 {stats.females}명)
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    레벨 분포: {Object.entries(stats.levels).map(([level, count]) => 
                      `Lv.${level} ${count}명`
                    ).join(', ')}
                  </div>
                </div>
              )}
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.players.map((player) => (
                  <label
                    key={player.id}
                    className={`
                      flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors
                      ${selectedParticipants.includes(player.id)
                        ? 'border-primary bg-primary bg-opacity-10'
                        : 'border-gray-300 hover:border-gray-400'
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={selectedParticipants.includes(player.id)}
                      onChange={() => handleParticipantToggle(player.id)}
                      className="hidden"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{player.name}</div>
                      <div className="text-sm text-gray-600">
                        {player.gender === 'male' ? '남성' : '여성'} • Lv.{player.level}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="card-footer">
              <button
                onClick={() => setStep('rules')}
                disabled={stats.total < 4}
                className="btn btn-primary"
              >
                다음 단계
                {stats.total < 4 && ' (최소 4명 필요)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'rules' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">경기 규칙 설정</h2>
          </div>
          <div className="card-body space-y-6">
            {/* 기본 설정 */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label">매치 수</label>
                <select
                  value={rules.matchCount}
                  onChange={(e) => setRules({ ...rules, matchCount: Number(e.target.value) })}
                  className="form-select"
                >
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <option key={num} value={num}>{num}개 매치</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">세트 수</label>
                <select
                  value={rules.setsPerMatch}
                  onChange={(e) => setRules({ ...rules, setsPerMatch: Number(e.target.value) })}
                  className="form-select"
                >
                  {[1, 2, 3, 4, 5].map(num => (
                    <option key={num} value={num}>{num}세트</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label">1세트 경기 수</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`
                    flex items-center justify-center p-3 border rounded-lg cursor-pointer
                    ${rules.gamesPerSet === 4 ? 'border-primary bg-primary bg-opacity-10' : 'border-gray-300'}
                  `}>
                    <input
                      type="radio"
                      name="gamesPerSet"
                      value={4}
                      checked={rules.gamesPerSet === 4}
                      onChange={(e) => setRules({ ...rules, gamesPerSet: Number(e.target.value) as 4 | 6 })}
                      className="hidden"
                    />
                    <span>4게임</span>
                  </label>
                  <label className={`
                    flex items-center justify-center p-3 border rounded-lg cursor-pointer
                    ${rules.gamesPerSet === 6 ? 'border-primary bg-primary bg-opacity-10' : 'border-gray-300'}
                  `}>
                    <input
                      type="radio"
                      name="gamesPerSet"
                      value={6}
                      checked={rules.gamesPerSet === 6}
                      onChange={(e) => setRules({ ...rules, gamesPerSet: Number(e.target.value) as 4 | 6 })}
                      className="hidden"
                    />
                    <span>6게임</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">듀스 규칙</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`
                    flex items-center justify-center p-3 border rounded-lg cursor-pointer
                    ${rules.deuceRule === 'advantage' ? 'border-primary bg-primary bg-opacity-10' : 'border-gray-300'}
                  `}>
                    <input
                      type="radio"
                      name="deuceRule"
                      value="advantage"
                      checked={rules.deuceRule === 'advantage'}
                      onChange={(e) => setRules({ ...rules, deuceRule: e.target.value as 'advantage' | 'no-ad' })}
                      className="hidden"
                    />
                    <span>Advantage</span>
                  </label>
                  <label className={`
                    flex items-center justify-center p-3 border rounded-lg cursor-pointer
                    ${rules.deuceRule === 'no-ad' ? 'border-primary bg-primary bg-opacity-10' : 'border-gray-300'}
                  `}>
                    <input
                      type="radio"
                      name="deuceRule"
                      value="no-ad"
                      checked={rules.deuceRule === 'no-ad'}
                      onChange={(e) => setRules({ ...rules, deuceRule: e.target.value as 'advantage' | 'no-ad' })}
                      className="hidden"
                    />
                    <span>No-Ad</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">타이브레이크 규칙</label>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  { value: 'seven-point', label: '7점 타이브레이크' },
                  { value: 'five-point', label: '5점 타이브레이크' },
                  { value: 'no-tiebreak', label: '타이없이 승자 종료' },
                  { value: 'draw', label: '무승부로 종료' },
                ].map(option => (
                  <label
                    key={option.value}
                    className={`
                      flex items-center justify-center p-3 border rounded-lg cursor-pointer
                      ${rules.tiebreakRule === option.value ? 'border-primary bg-primary bg-opacity-10' : 'border-gray-300'}
                    `}
                  >
                    <input
                      type="radio"
                      name="tiebreakRule"
                      value={option.value}
                      checked={rules.tiebreakRule === option.value}
                      onChange={(e) => setRules({ ...rules, tiebreakRule: e.target.value as any })}
                      className="hidden"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 예상 시간 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">예상 경기 시간</h4>
              <p className="text-sm text-gray-600">
                {rules.gamesPerSet === 4 ? '4게임 기준: 2시간당 약 6매치' : '6게임 기준: 2시간당 약 5매치'}
              </p>
              <p className="text-sm text-gray-600">
                현재 설정으로 약 {Math.ceil(rules.matchCount / (rules.gamesPerSet === 4 ? 6 : 5) * 2)}시간 소요 예상
              </p>
            </div>
          </div>
          <div className="card-footer">
            <div className="flex justify-between">
              <button
                onClick={() => setStep('participants')}
                className="btn btn-secondary"
              >
                이전 단계
              </button>
              <button
                onClick={generatePreview}
                className="btn btn-primary"
              >
                대진표 생성
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-6">
          {/* 토너먼트 요약 */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">토너먼트 요약</h2>
            </div>
            <div className="card-body">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">기본 정보</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>토너먼트명: {tournamentName}</li>
                    <li>참가자: {stats.total}명 (남성 {stats.males}명, 여성 {stats.females}명)</li>
                    <li>생성된 매치: {previewMatches.length}개</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">경기 규칙</h4>
                  <p className="text-sm text-gray-600">{getRulesText()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 대진 밸런스 정보 */}
          {balanceInfo && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">대진표 밸런스</h2>
              </div>
              <div className="card-body">
                {balanceInfo.isBalanced ? (
                  <div className="alert alert-success">
                    <Trophy className="h-4 w-4" />
                    균형 잡힌 대진표가 생성되었습니다!
                  </div>
                ) : (
                  <div className="alert alert-warning">
                    <AlertTriangle className="h-4 w-4" />
                    <div>
                      <p className="font-medium">대진표 밸런스 이슈:</p>
                      <ul className="mt-1 text-sm">
                        {balanceInfo.issues.map((issue: string, index: number) => (
                          <li key={index}>• {issue}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 대진표 미리보기 */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">대진표 미리보기</h2>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {previewMatches.map((match, index) => (
                  <div key={match.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">매치 {index + 1}</h4>
                      <span className={`badge ${
                        match.matchType === 'mens' ? 'badge-primary' :
                        match.matchType === 'womens' ? 'badge-warning' : 'badge-secondary'
                      }`}>
                        {match.matchType === 'mens' ? '남자복식' :
                         match.matchType === 'womens' ? '여자복식' : '혼성복식'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="font-medium text-gray-900">
                          {match.team1.player1.name} & {match.team1.player2.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          Lv.{match.team1.player1.level} & Lv.{match.team1.player2.level}
                        </div>
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
            </div>
            <div className="card-footer">
              <div className="flex justify-between">
                <button
                  onClick={() => setStep('rules')}
                  className="btn btn-secondary"
                >
                  경기 규칙 수정
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={generatePreview}
                    className="btn btn-secondary"
                  >
                    대진표 재생성
                  </button>
                  <button
                    onClick={createTournamentFromPreview}
                    className="btn btn-success"
                    disabled={!tournamentName.trim()}
                  >
                    토너먼트 생성
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentPage;