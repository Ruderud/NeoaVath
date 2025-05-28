import { X } from 'lucide-react';
import styled from '@emotion/styled';
import type { Party } from '../../types/types';

type PartyModalProps = {
  isOpen: boolean;
  party: Party;
  onClose: () => void;
  onSave: (updatedParty: Party) => void;
};

export function PartyModal({ isOpen, party, onClose, onSave }: PartyModalProps) {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const updatedParty: Party = {
      ...party,
      title: formData.get('title') as string,
      memo: formData.get('memo') as string,
    };
    onSave(updatedParty);
  };

  return (
    <ModalOverlay>
      <ModalContent>
        <ModalHeader>
          <h2>파티 정보</h2>
          <ModalCloseButton onClick={onClose}>
            <X size={24} />
          </ModalCloseButton>
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <div>
              <FormGroup>
                <label htmlFor="title">파티 이름</label>
                <input type="text" id="title" name="title" defaultValue={party.title} />
              </FormGroup>
              <FormGroup>
                <label htmlFor="memo">메모</label>
                <textarea id="memo" name="memo" defaultValue={party.memo} />
              </FormGroup>
            </div>
          </ModalBody>
          <ModalActions>
            <ActionButton type="button" onClick={onClose}>
              취소
            </ActionButton>
            <ActionButton type="submit" variant="primary">
              저장
            </ActionButton>
          </ModalActions>
        </form>
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
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 8px;
  padding: 24px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;

  h2 {
    font-size: 1.5em;
    font-weight: 600;
  }
`;

const ModalCloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #000;
  }

  svg {
    width: 24px;
    height: 24px;
  }
`;

const ModalBody = styled.div`
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 24px;
`;

const FormGroup = styled.div`
  margin-bottom: 16px;

  label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
  }

  input,
  textarea {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1em;
  }

  textarea {
    min-height: 100px;
    resize: vertical;
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #eee;
`;

const ActionButton = styled.button<{ variant?: 'primary' }>`
  padding: 8px 16px;
  border-radius: 4px;
  border: 1px solid ${({ variant }) => (variant === 'primary' ? '#2196f3' : '#ddd')};
  background: ${({ variant }) => (variant === 'primary' ? '#2196f3' : 'white')};
  color: ${({ variant }) => (variant === 'primary' ? 'white' : '#666')};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ variant }) => (variant === 'primary' ? '#1976d2' : '#f5f5f5')};
  }
`;
