import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Player } from '../types';

interface PlayerModalProps {
  player?: Player | null;
  onClose: () => void;
  onSubmit: (playerData: Omit<Player, 'id'>) => void;
}

const PlayerModal: React.FC<PlayerModalProps> = ({ player, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [level, setLevel] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (player) {
      setName(player.name);
      setGender(player.gender);
      setLevel(player.level);
    } else {
      setName('');
      setGender('male');
      setLevel(3);
    }
    setErrors({});
  }, [player]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    } else if (name.trim().length < 2) {
      newErrors.name = '이름은 최소 2자 이상이어야 합니다.';
    } else if (name.trim().length > 20) {
      newErrors.name = '이름은 최대 20자까지 가능합니다.';
    }

    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      name: name.trim(),
      gender,
      level,
    });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getLevelDescription = (level: number) => {
    const descriptions = {
      1: '테니스를 시작한 지 얼마 안된 분',
      2: '기본 스트로크가 가능한 분',
      3: '안정적인 랠리가 가능한 분',
      4: '전술적 플레이가 가능한 분',
      5: '대회 출전 경험이 있는 분',
    };
    return descriptions[level as keyof typeof descriptions] || '';
  };

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className="modal modal-md">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="card-title">
              {player ? '멤버 정보 수정' : '새 멤버 추가'}
            </h3>
            <button
              onClick={onClose}
              className="btn btn-sm btn-secondary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="card-body space-y-4">
            {/* 이름 입력 */}
            <div className="form-group">
              <label htmlFor="playerName" className="form-label">
                이름 *
              </label>
              <input
                id="playerName"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) {
                    setErrors({ ...errors, name: '' });
                  }
                }}
                className="form-input"
                placeholder="멤버 이름을 입력하세요"
                maxLength={20}
                autoFocus
              />
              {errors.name && <div className="form-error">{errors.name}</div>}
            </div>

            {/* 성별 선택 */}
            <div className="form-group">
              <label className="form-label">성별 *</label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`
                  flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors
                  ${gender === 'male' 
                    ? 'border-primary bg-primary bg-opacity-10 text-primary' 
                    : 'border-gray-300 hover:border-gray-400'
                  }
                `}>
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={gender === 'male'}
                    onChange={(e) => setGender(e.target.value as 'male')}
                    className="hidden"
                  />
                  <span className="font-medium">남성</span>
                </label>
                
                <label className={`
                  flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors
                  ${gender === 'female' 
                    ? 'border-warning bg-warning bg-opacity-10 text-warning' 
                    : 'border-gray-300 hover:border-gray-400'
                  }
                `}>
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={gender === 'female'}
                    onChange={(e) => setGender(e.target.value as 'female')}
                    className="hidden"
                  />
                  <span className="font-medium">여성</span>
                </label>
              </div>
            </div>

            {/* 실력 레벨 선택 */}
            <div className="form-group">
              <label className="form-label">실력 레벨 *</label>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((levelOption) => (
                  <label
                    key={levelOption}
                    className={`
                      flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors
                      ${level === levelOption 
                        ? 'border-primary bg-primary bg-opacity-10' 
                        : 'border-gray-300 hover:border-gray-400'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="level"
                        value={levelOption}
                        checked={level === levelOption}
                        onChange={(e) => setLevel(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                        className="hidden"
                      />
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Level {levelOption}</span>
                        <span className="text-sm text-gray-600">
                          {levelOption === 1 && '초급'}
                          {levelOption === 2 && '초중급'}
                          {levelOption === 3 && '중급'}
                          {levelOption === 4 && '중상급'}
                          {levelOption === 5 && '상급'}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {getLevelDescription(levelOption)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* 안내 메시지 */}
            <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
              <p className="font-medium mb-1">💡 실력 레벨 설정 가이드</p>
              <p>
                정확한 실력 레벨 설정은 균형 잡힌 대진표 생성에 중요합니다. 
                자신의 실력을 객관적으로 평가하여 적절한 레벨을 선택해주세요.
              </p>
            </div>
          </div>
          
          <div className="card-footer">
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
              >
                취소
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!name.trim()}
              >
                {player ? '수정 완료' : '멤버 추가'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlayerModal;