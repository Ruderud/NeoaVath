import styled from '@emotion/styled';
import { Info as InfoIcon, X } from 'lucide-react';
import type { CharacterData } from '../../types/types';
import { useCharacterDetail } from '../../context/CharacterDetailContext';

type CharacterCardProps = {
  character: CharacterData;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, character: CharacterData) => void;
  cardProps?: React.HTMLAttributes<HTMLDivElement>;
  helperText?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  width?: number;
  height?: number;
  onDelete?: () => void;
};

const Card = styled.div<{ width?: number; height?: number }>`
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
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

  &[title] {
    position: relative;
  }

  &[title]:hover::after {
    content: attr(helperText);
    position: fixed;
    bottom: auto;
    left: 50%;
    transform: translateX(-50%);
    padding: 8px 12px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    border-radius: 4px;
    font-size: 0.9em;
    white-space: pre-line;
    z-index: 9999;
    pointer-events: none;
    margin-bottom: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
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

const Image = styled.div`
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
    margin-top: 2px;
    font-weight: 500;
    color: #e91e63;
    font-size: 0.9em;
  }
`;

const Tooltip = styled.div`
  position: fixed;
  bottom: auto;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  border-radius: 4px;
  font-size: 0.9em;
  white-space: pre-line;
  z-index: 9999;
  pointer-events: none;
  margin-bottom: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
`;

export function CharacterCard({ character, onDragStart, cardProps, helperText, onMouseEnter, onMouseLeave, width, height, onDelete }: CharacterCardProps) {
  const { showCharacterDetail } = useCharacterDetail();

  const handleDetailClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    showCharacterDetail(character);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // 카드 클릭 시 아무것도 하지 않음
  };

  // cardProps에서 onClick을 제거
  const { onClick: cardPropsOnClick, ...restCardProps } = cardProps || {};

  return (
    <Card
      {...restCardProps}
      width={width}
      height={height}
      draggable
      onDragStart={(e) => onDragStart?.(e, character)}
      onClick={handleCardClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      title={helperText}
    >
      <DetailButton onClick={handleDetailClick}>
        <InfoIcon size={14} />
      </DetailButton>
      {onDelete && (
        <DeleteButton onClick={handleDeleteClick}>
          <X size={14} />
        </DeleteButton>
      )}
      <Image>
        <img
          src={`https://img-api.neople.co.kr/df/servers/${character.server}/characters/${character.key}?zoom=1`}
          alt={`${character.name} 캐릭터 이미지`}
          draggable="false"
        />
      </Image>
      <Info>
        <MainInfo>
          <div className="level">명성 {character.level}</div>
          <div className="name">{character.name}</div>
          <div className="adventure">{character.adventureName}</div>
        </MainInfo>
        {character.buffScore ? (
          <div className="score">버프력 {character.buffScore}</div>
        ) : character.ozma ? (
          <div className="score">랭킹 {character.ozma}</div>
        ) : null}
      </Info>
      {helperText && <Tooltip>{helperText}</Tooltip>}
    </Card>
  );
}
