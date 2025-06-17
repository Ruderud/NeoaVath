import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { X } from 'lucide-react';
import type { GroupConfig } from '../../types/types';
import { GroupConfigComponent } from '../GroupConfig';

const INITIAL_CONFIG: GroupConfig = {
  id: '',
  name: '',
  tags: [],
  createdAt: '',
  updatedAt: '',
};

type GroupConfigModalProps = {
  isOpen: boolean;
  onClose: () => void;
  groupName: string;
  onSave: (config: GroupConfig) => Promise<void>;
};

export function GroupConfigModal({ isOpen, onClose, groupName, onSave }: GroupConfigModalProps) {
  const [config, setConfig] = useState<GroupConfig>(INITIAL_CONFIG);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfig(INITIAL_CONFIG);
    }
  }, [isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(config);
      onClose();
    } catch (error) {
      console.error('그룹 설정 저장 실패:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay>
      <ModalContainer>
        <ModalHeader>
          <ModalTitle>{groupName} 그룹 설정</ModalTitle>
          <CloseButton onClick={onClose}>
            <X size={24} />
          </CloseButton>
        </ModalHeader>
        <ModalContent>
          <GroupConfigComponent config={config} onConfigChange={setConfig} />
        </ModalContent>
        <ModalFooter>
          <CancelButton onClick={onClose}>취소</CancelButton>
          <SaveButton onClick={handleSave} disabled={isSaving}>
            {isSaving ? '저장 중...' : '저장'}
          </SaveButton>
        </ModalFooter>
      </ModalContainer>
    </ModalOverlay>
  );
}

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;

  &:hover {
    color: #333;
  }
`;

const ModalContent = styled.div`
  padding: 16px;
  overflow-y: auto;
`;

const ModalFooter = styled.div`
  padding: 16px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const Button = styled.button`
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CancelButton = styled(Button)`
  background: #f5f5f5;
  color: #666;
  border: none;

  &:hover {
    background: #e0e0e0;
  }
`;

const SaveButton = styled(Button)`
  background: #2196f3;
  color: white;
  border: none;

  &:hover:not(:disabled) {
    background: #1976d2;
  }
`;
