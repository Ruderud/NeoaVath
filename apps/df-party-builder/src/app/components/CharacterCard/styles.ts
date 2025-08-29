import styled from '@emotion/styled';

const Container = styled.div<{ width?: number; height?: number; isBuffer?: boolean }>`
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: ${({ isBuffer }) => (isBuffer ? '#f0f8ff' : '#fff5f5')};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease-in-out;
  cursor: move;
  width: ${({ width }) => width || 160}px;
  height: ${({ height }) => height || 280}px;
  position: relative;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const DetailButton = styled.button`
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 100;

  &:hover {
    background: rgba(255, 255, 255, 1);
    transform: scale(1.1);
  }

  svg {
    width: 14px;
    height: 14px;
    color: #666;
  }
`;

const DeleteButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 100;

  &:hover {
    background: rgba(255, 255, 255, 1);
    transform: scale(1.1);
  }

  svg {
    width: 14px;
    height: 14px;
    color: black;
  }
`;

const ImageContainer = styled.div`
  width: 100%;
  border-radius: 4px;
  overflow: hidden;
  position: relative;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    pointer-events: none;
  }
`;

const Info = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-align: center;
  width: 100%;
`;

const MainInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: 100%;

  .level {
    font-size: 1em;
    font-weight: 600;
    color: #2196f3;
  }

  .name {
    font-size: 0.95em;
    font-weight: 600;
  }

  .adventure {
    color: #666;
    font-size: 0.85em;
  }

  .score {
    font-size: 0.8em;
    color: #666;
    word-break: break-all;
  }
`;

const Tooltip = styled.div<{ visible: boolean; top?: number; left?: number }>`
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  border-radius: 6px;
  font-size: 0.9em;
  white-space: pre-line;
  z-index: 99999;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  opacity: ${({ visible }) => (visible ? 1 : 0)};
  visibility: ${({ visible }) => (visible ? 'visible' : 'hidden')};
  transition: opacity 0.2s ease, visibility 0.2s ease;
  max-width: 300px;
  text-align: center;

  // for portal style
  position: absolute;
  top: ${({ top }) => top ?? 0}px;
  left: ${({ left }) => left ?? 0}px;
  transform: translate(-50%, 0);
`;

const Label = styled.span`
  font-size: 0.8em;
  color: #666;
  word-break: break-all;
`;

export const CharacterCard = {
  Container,
  DetailButton,
  DeleteButton,
  ImageContainer,
  Info,
  MainInfo,
  Tooltip,
  Label,
};

export default CharacterCard;
