import { useState, useEffect } from 'react';
import styled from '@emotion/styled';

type MemoContentProps = {
  onSave: (memo: string) => void;
  initialMemo?: string;
};

export function MemoContent({ onSave, initialMemo = '' }: MemoContentProps) {
  const [memo, setMemo] = useState(initialMemo);

  useEffect(() => {
    setMemo(initialMemo);
  }, [initialMemo]);

  const handleSave = () => {
    onSave(memo);
  };

  return (
    <ContentContainer>
      <MemoTextarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="메모를 입력하세요..." />
      <ButtonGroup>
        <SaveButton onClick={handleSave}>저장</SaveButton>
      </ButtonGroup>
    </ContentContainer>
  );
}

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  height: 100%;
`;

const MemoTextarea = styled.textarea`
  width: 100%;
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  resize: none;
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

const SaveButton = styled.button`
  padding: 8px 16px;
  background: #2196f3;
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #1976d2;
  }
`;
