import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { X } from 'lucide-react';

type MemoModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (memo: string) => void;
  initialMemo?: string;
};

export function MemoModal({ isOpen, onClose, onSave, initialMemo = '' }: MemoModalProps) {
  const [memo, setMemo] = useState(initialMemo);

  useEffect(() => {
    setMemo(initialMemo);
  }, [initialMemo]);

  const handleSave = () => {
    onSave(memo);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>메모장</ModalTitle>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>
        <MemoTextarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="메모를 입력하세요..." />
        <ButtonGroup>
          <CancelButton onClick={onClose}>취소</CancelButton>
          <SaveButton onClick={handleSave}>저장</SaveButton>
        </ButtonGroup>
      </ModalContent>
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
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
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

const MemoTextarea = styled.textarea`
  width: 100%;
  height: 300px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  resize: vertical;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: #2196f3;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const Button = styled.button`
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
`;

const CancelButton = styled(Button)`
  background: #f5f5f5;
  border: 1px solid #ddd;
  color: #666;

  &:hover {
    background: #e0e0e0;
  }
`;

const SaveButton = styled(Button)`
  background: #2196f3;
  border: none;
  color: white;

  &:hover {
    background: #1976d2;
  }
`;
