import styled from '@emotion/styled';

export type PartyCardContainerProps = {
  isMobile: boolean;
  isExpanded: boolean;
  isCompleted?: boolean;
};

export type PartySlotProps = {
  isMobile: boolean;
};

export const PartyCardContainer = styled.div<PartyCardContainerProps>`
  position: relative;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: all 0.2s ease;
  opacity: ${({ isCompleted }) => (isCompleted ? 0.7 : 1)};

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  &:hover .delete-party-button {
    opacity: 1;
  }

  &.dragging {
    opacity: 0.5;
  }

  &.drag-over {
    border: 2px dashed #2196f3;
  }
`;

export const PartyCardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const PartyCardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const PartyCharacterPreview = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;

  .name {
    font-weight: 500;
    color: #333;
  }

  .level {
    font-size: 0.9em;
    color: #666;
  }

  .score {
    font-size: 0.9em;
    color: #2196f3;
  }
`;

export const ExpandButton = styled.button`
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
  width: 100%;
  border-top: 1px solid #e0e0e0;
  margin-top: 8px;

  &:hover {
    color: #333;
  }
`;

export const PartyCardDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const PartySlots = styled.div<{ isMobile: boolean }>`
  display: flex;
  flex-direction: row;
  gap: 8px;
  width: 100%;
`;

export const PartyTitle = styled.input`
  width: 100%;
  padding: 4px 8px;
  border: 1px solid transparent;
  border-radius: 4px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  background: transparent;

  &:focus {
    outline: none;
    border-color: #2196f3;
    background: white;
  }
`;

export const CheckboxButton = styled.input`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  cursor: pointer;
  z-index: 2;
`;

export const PartySlot = styled.div<PartySlotProps>`
  position: relative;
  height: 80px;
  background: #f5f5f5;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  flex: 1;

  &:hover .delete-button {
    opacity: 1;
  }

  .delete-button {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #ff4d4f;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s ease;
    z-index: 2;
    border: none;
    padding: 0;

    &:hover {
      background: #ff7875;
    }
  }
`;

export const PartyMemo = styled.textarea<{ isMobile: boolean }>`
  width: 100%;
  min-height: 60px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  font-size: 0.9rem;
  color: #333;

  &:focus {
    outline: none;
    border-color: #2196f3;
  }
`;

export const DeletePartyButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #ff4d4f;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 2;
  border: none;
  padding: 0;

  &:hover {
    background: #ff7875;
  }
`;
