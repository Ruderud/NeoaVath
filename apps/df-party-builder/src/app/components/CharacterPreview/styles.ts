import styled from '@emotion/styled';

export const CharacterPreviewContainer = styled.div<{ characterColor?: string; hasRemoveButton?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 4px;
  padding-right: ${({ hasRemoveButton }) => (hasRemoveButton ? '24px' : '4px')};
  font-size: 0.9rem;
  color: #666;
  background: ${({ characterColor }) => characterColor || '#fff5f5'};
  border-radius: 4px;
  margin: 1px 0;
  position: relative;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &.dragging {
    opacity: 0.5;
    transform: rotate(5deg);
  }
`;

export const CharacterInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const CharacterName = styled.span`
  width: 80px;
  font-weight: 500;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const CharacterLevel = styled.span`
  color: #666;
  font-size: 0.8rem;
`;

export const CharacterScore = styled.span`
  color: #2196f3;
  font-weight: 500;
  font-size: 0.8rem;
`;

export const RemoveButton = styled.button`
  position: absolute;
  top: 50%;
  right: 4px;
  transform: translateY(-50%);
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  z-index: 10;
  transition: all 0.2s ease;
  opacity: 0.8;

  &:hover {
    background: #dc2626;
    opacity: 1;
    transform: translateY(-50%) scale(1.1);
  }

  &:active {
    transform: translateY(-50%) scale(0.95);
  }
`;
