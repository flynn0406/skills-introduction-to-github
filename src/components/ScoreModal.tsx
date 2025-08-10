import React, { useState, useEffect } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { Match, MatchScore, SetScore, GameRules } from '../types';
import { 
  determineSetWinner, 
  determineMatchWinner, 
  validateScore
} from '../utils/scoreCalculation';

interface ScoreModalProps {
  match: Match;
  rules: GameRules;
  onClose: () => void;
  onSave: (matchId: string, scores: MatchScore) => void;
}

const ScoreModal: React.FC<ScoreModalProps> = ({ match, rules, onClose, onSave }) => {
  const [sets, setSets] = useState<SetScore[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    // 기존 스코어가 있으면 로드, 없으면 첫 번째 세트 초기화
    if (match.scores?.sets && match.scores.sets.length > 0) {
      setSets([...match.scores.sets]);
    } else {
      setSets([{
        team1Games: 0,
        team2Games: 0,
        team1TiebreakPoints: 0,
        team2TiebreakPoints: 0,
        tiebreakPlayed: false
      }]);
    }
  }, [match]);

  const updateSetScore = (setIndex: number, field: keyof SetScore, value: number | boolean) => {
    setSets(prev => {
      const newSets = [...prev];
      newSets[setIndex] = { ...newSets[setIndex], [field]: value };
      return newSets;
    });
    setErrors({});
  };

  const addSet = () => {
    if (sets.length < rules.setsPerMatch) {
      setSets(prev => [...prev, {
        team1Games: 0,
        team2Games: 0,
        team1TiebreakPoints: 0,
        team2TiebreakPoints: 0,
        tiebreakPlayed: false
      }]);
    }
  };

  const removeSet = (setIndex: number) => {
    if (sets.length > 1) {
      setSets(prev => prev.filter((_, index) => index !== setIndex));
    }
  };

  const needsTiebreak = (setScore: SetScore): boolean => {
    if (setScore.tiebreakPlayed) return false;
    
    if (rules.tiebreakRule === 'seven-point' || rules.tiebreakRule === 'five-point') {
      if (rules.gamesPerSet === 4 && setScore.team1Games === 4 && setScore.team2Games === 4) {
        return true;
      }
      if (rules.gamesPerSet === 6 && setScore.team1Games === 6 && setScore.team2Games === 6) {
        return true;
      }
    }
    
    return false;
  };

  const enableTiebreak = (setIndex: number) => {
    updateSetScore(setIndex, 'tiebreakPlayed', true);
    updateSetScore(setIndex, 'team1TiebreakPoints', 0);
    updateSetScore(setIndex, 'team2TiebreakPoints', 0);
  };

  const validateAllSets = (): { isValid: boolean; errors: { [key: string]: string } } => {
    const newErrors: { [key: string]: string } = {};

    sets.forEach((set, index) => {
      const validation = validateScore(set, rules);
      if (!validation.isValid) {
        newErrors[`set${index}`] = validation.error || '유효하지 않은 스코어입니다.';
      }
    });

    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
  };

  const handleSave = () => {
    const validation = validateAllSets();
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    const matchScore: MatchScore = {
      sets: sets.filter(set => {
        // 완료된 세트만 포함 (0-0인 세트는 제외)
        return set.team1Games > 0 || set.team2Games > 0 || set.tiebreakPlayed;
      }),
      winner: undefined
    };

    // 승자 결정
    if (matchScore.sets.length > 0) {
      const winner = determineMatchWinner(matchScore, rules);
      matchScore.winner = winner || undefined;
    }

    onSave(match.id, matchScore);
  };

  const getSetWinnerText = (set: SetScore): string => {
    const winner = determineSetWinner(set, rules);
    if (winner === 'team1') return `${match.team1.player1.name} & ${match.team1.player2.name}`;
    if (winner === 'team2') return `${match.team2.player1.name} & ${match.team2.player2.name}`;
    if (winner === 'draw') return '무승부';
    return '진행중';
  };

  const getMatchStatusText = (): string => {
    if (sets.length === 0) return '경기 시작 전';
    
    const matchScore: MatchScore = { sets };
    const winner = determineMatchWinner(matchScore, rules);
    
    if (winner === 'team1') return `승자: ${match.team1.player1.name} & ${match.team1.player2.name}`;
    if (winner === 'team2') return `승자: ${match.team2.player1.name} & ${match.team2.player2.name}`;
    if (winner === 'draw') return '무승부';
    
    return '경기 진행중';
  };

  const canAddSet = (): boolean => {
    if (sets.length >= rules.setsPerMatch) return false;
    if (sets.length === 0) return true;
    
    // 마지막 세트가 완료되었는지 확인
    const lastSet = sets[sets.length - 1];
    const setWinner = determineSetWinner(lastSet, rules);
    return setWinner !== null;
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="card-title">스코어 입력</h3>
            <button onClick={onClose} className="btn btn-sm btn-secondary">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="card-body space-y-6">
          {/* 매치 정보 */}
          <div className="text-center bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-lg mb-2">
              {match.team1.player1.name} & {match.team1.player2.name}
              <span className="mx-4 text-gray-400">vs</span>
              {match.team2.player1.name} & {match.team2.player2.name}
            </h4>
            <p className="text-gray-600 mb-2">
              {match.matchType === 'mens' ? '남자복식' : 
               match.matchType === 'womens' ? '여자복식' : '혼성복식'}
            </p>
            <p className="font-medium text-primary">{getMatchStatusText()}</p>
          </div>

          {/* 경기 규칙 요약 */}
          <div className="bg-blue-50 p-3 rounded-lg text-sm">
            <p className="font-medium text-blue-900 mb-1">경기 규칙</p>
            <p className="text-blue-700">
              {rules.gamesPerSet}게임 {rules.setsPerMatch}세트 • {rules.deuceRule === 'advantage' ? 'Advantage' : 'No-Ad'} • 
              {rules.tiebreakRule === 'seven-point' ? '7점 타이브레이크' :
               rules.tiebreakRule === 'five-point' ? '5점 타이브레이크' :
               rules.tiebreakRule === 'no-tiebreak' ? '타이없이 승자결정' : '무승부 종료'}
            </p>
          </div>

          {/* 세트별 스코어 입력 */}
          <div className="space-y-4">
            {sets.map((set, setIndex) => (
              <div key={setIndex} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">세트 {setIndex + 1}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      승자: {getSetWinnerText(set)}
                    </span>
                    {sets.length > 1 && (
                      <button
                        onClick={() => removeSet(setIndex)}
                        className="btn btn-sm btn-error"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>

                {errors[`set${setIndex}`] && (
                  <div className="alert alert-error mb-4 text-sm">
                    {errors[`set${setIndex}`]}
                  </div>
                )}

                {/* 게임 스코어 */}
                <div className="grid grid-cols-3 gap-4 items-center mb-4">
                  <div className="text-center">
                    <div className="font-medium mb-2">
                      {match.team1.player1.name} & {match.team1.player2.name}
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => updateSetScore(setIndex, 'team1Games', Math.max(0, set.team1Games - 1))}
                        className="btn btn-sm btn-secondary"
                        disabled={set.team1Games === 0}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <div className="w-16 text-center">
                        <input
                          type="number"
                          value={set.team1Games}
                          onChange={(e) => updateSetScore(setIndex, 'team1Games', Math.max(0, parseInt(e.target.value) || 0))}
                          className="form-input text-center text-xl font-bold"
                          min="0"
                          max="20"
                        />
                      </div>
                      <button
                        onClick={() => updateSetScore(setIndex, 'team1Games', set.team1Games + 1)}
                        className="btn btn-sm btn-secondary"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  <div className="text-center text-gray-400 font-bold text-xl">
                    -
                  </div>

                  <div className="text-center">
                    <div className="font-medium mb-2">
                      {match.team2.player1.name} & {match.team2.player2.name}
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => updateSetScore(setIndex, 'team2Games', Math.max(0, set.team2Games - 1))}
                        className="btn btn-sm btn-secondary"
                        disabled={set.team2Games === 0}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <div className="w-16 text-center">
                        <input
                          type="number"
                          value={set.team2Games}
                          onChange={(e) => updateSetScore(setIndex, 'team2Games', Math.max(0, parseInt(e.target.value) || 0))}
                          className="form-input text-center text-xl font-bold"
                          min="0"
                          max="20"
                        />
                      </div>
                      <button
                        onClick={() => updateSetScore(setIndex, 'team2Games', set.team2Games + 1)}
                        className="btn btn-sm btn-secondary"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 타이브레이크 필요/진행 */}
                {needsTiebreak(set) && (
                  <div className="text-center mb-4">
                    <button
                      onClick={() => enableTiebreak(setIndex)}
                      className="btn btn-warning"
                    >
                      타이브레이크 시작
                    </button>
                  </div>
                )}

                {/* 타이브레이크 스코어 */}
                {set.tiebreakPlayed && (
                  <div className="border-t pt-4">
                    <h5 className="font-medium text-center mb-3">타이브레이크</h5>
                    <div className="grid grid-cols-3 gap-4 items-center">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => updateSetScore(setIndex, 'team1TiebreakPoints', Math.max(0, (set.team1TiebreakPoints || 0) - 1))}
                            className="btn btn-sm btn-secondary"
                            disabled={(set.team1TiebreakPoints || 0) === 0}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <div className="w-16 text-center">
                            <input
                              type="number"
                              value={set.team1TiebreakPoints || 0}
                              onChange={(e) => updateSetScore(setIndex, 'team1TiebreakPoints', Math.max(0, parseInt(e.target.value) || 0))}
                              className="form-input text-center text-lg font-bold"
                              min="0"
                              max="50"
                            />
                          </div>
                          <button
                            onClick={() => updateSetScore(setIndex, 'team1TiebreakPoints', (set.team1TiebreakPoints || 0) + 1)}
                            className="btn btn-sm btn-secondary"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      <div className="text-center text-gray-400 font-bold">
                        -
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => updateSetScore(setIndex, 'team2TiebreakPoints', Math.max(0, (set.team2TiebreakPoints || 0) - 1))}
                            className="btn btn-sm btn-secondary"
                            disabled={(set.team2TiebreakPoints || 0) === 0}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <div className="w-16 text-center">
                            <input
                              type="number"
                              value={set.team2TiebreakPoints || 0}
                              onChange={(e) => updateSetScore(setIndex, 'team2TiebreakPoints', Math.max(0, parseInt(e.target.value) || 0))}
                              className="form-input text-center text-lg font-bold"
                              min="0"
                              max="50"
                            />
                          </div>
                          <button
                            onClick={() => updateSetScore(setIndex, 'team2TiebreakPoints', (set.team2TiebreakPoints || 0) + 1)}
                            className="btn btn-sm btn-secondary"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* 세트 추가 버튼 */}
            {canAddSet() && (
              <div className="text-center">
                <button
                  onClick={addSet}
                  className="btn btn-secondary"
                  disabled={sets.length >= rules.setsPerMatch}
                >
                  <Plus className="h-4 w-4" />
                  세트 추가
                </button>
              </div>
            )}
          </div>

          {/* 도움말 */}
          <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
            <p className="font-medium mb-1">💡 스코어 입력 가이드</p>
            <ul className="space-y-1">
              <li>• +/- 버튼을 클릭하거나 직접 숫자를 입력할 수 있습니다</li>
              <li>• 타이브레이크 조건이 되면 '타이브레이크 시작' 버튼이 나타납니다</li>
              <li>• 세트가 완료되면 다음 세트를 추가할 수 있습니다</li>
              <li>• 모든 세트가 완료되면 자동으로 매치 승자가 결정됩니다</li>
            </ul>
          </div>
        </div>

        <div className="card-footer">
          <div className="flex justify-between">
            <button onClick={onClose} className="btn btn-secondary">
              취소
            </button>
            <button
              onClick={handleSave}
              className="btn btn-primary"
              disabled={sets.length === 0 || Object.keys(errors).length > 0}
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreModal;