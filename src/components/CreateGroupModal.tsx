import React, { useState } from 'react';
import { X } from 'lucide-react';

interface CreateGroupModalProps {
  onClose: () => void;
  onSubmit: (groupData: { name: string }) => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('그룹명을 입력해주세요.');
      return;
    }

    if (name.trim().length < 2) {
      setError('그룹명은 최소 2자 이상이어야 합니다.');
      return;
    }

    onSubmit({ name: name.trim() });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className="modal modal-sm">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="card-title">새 그룹 만들기</h3>
            <button
              onClick={onClose}
              className="btn btn-sm btn-secondary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="card-body">
            <div className="form-group">
              <label htmlFor="groupName" className="form-label">
                그룹명 *
              </label>
              <input
                id="groupName"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                className="form-input"
                placeholder="예: 테니스 동호회 A팀"
                maxLength={50}
                autoFocus
              />
              {error && <div className="form-error">{error}</div>}
            </div>
            
            <div className="text-sm text-gray-600">
              <p className="mb-2">그룹 생성 후 다음 작업을 진행할 수 있습니다:</p>
              <ul className="space-y-1">
                <li>• 그룹 멤버 추가 및 관리</li>
                <li>• 멤버별 성별 및 실력 레벨 설정</li>
                <li>• 토너먼트 생성 및 대진표 자동 생성</li>
              </ul>
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
                그룹 생성
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;