import styled from '@emotion/styled';

type PartyCardContainerProps = {
  isMobile: boolean;
  isExpanded: boolean;
};

export const PartyCardContainer = styled.div<PartyCardContainerProps>`
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
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

  input {
    flex: 1;
    border: none;
    font-size: 1.1em;
    font-weight: 600;
    color: #333;
    background: transparent;
    padding: 4px 8px;
    border-radius: 4px;

    &:focus {
      outline: none;
      background: #f5f5f5;
    }
  }
`;

export const PartyCardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const PartyCharacterPreview = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 0.9em;

  .name {
    font-weight: 500;
    color: #333;
  }

  .level {
    color: #666;
  }

  .score {
    margin-left: auto;
    color: #2196f3;
    font-weight: 500;
  }
`;

export const PartyCardDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid #e0e0e0;
`;

export const PartySlots = styled.div<{ isMobile: boolean }>`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
`;

export const PartySlot = styled.div<{ isMobile: boolean }>`
  aspect-ratio: 1;
  background: #f8f9fa;
  border: 2px dashed #e0e0e0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 0.9em;
  transition: all 0.2s ease;

  &.empty {
    &:hover {
      border-color: #2196f3;
      color: #2196f3;
    }
  }

  &.drag-over {
    border: 2px dashed #2196f3;
    background: #e3f2fd;
  }
`;

export const PartyMemo = styled.textarea<{ isMobile: boolean }>`
  width: 100%;
  min-height: 80px;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  resize: vertical;
  font-size: 0.9em;
  color: #333;
  background: #f8f9fa;

  &:focus {
    outline: none;
    border-color: #2196f3;
    background: white;
  }

  &::placeholder {
    color: #999;
  }
`;

export const ExpandButton = styled.button`
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  transition: transform 0.2s ease;
  border-top: 1px solid #e0e0e0;
  margin-top: 12px;

  &:hover {
    color: #333;
  }
`;
