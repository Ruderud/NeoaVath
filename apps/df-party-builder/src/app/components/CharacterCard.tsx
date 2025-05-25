import styled from '@emotion/styled';
import type { CharacterData } from '../types/types';

const Card = styled.div`
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
  width: 180px;
  aspect-ratio: 3/4;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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

interface CharacterCardProps {
  character: CharacterData;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, character: CharacterData) => void;
  onClick?: (character: CharacterData) => void;
}

export function CharacterCard({ character, onDragStart, onClick }: CharacterCardProps) {
  return (
    <Card draggable onDragStart={(e) => onDragStart?.(e, character)} onClick={() => onClick?.(character)}>
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
          {character.buffScore ? (
            <div className="score">버프력 {character.buffScore}</div>
          ) : character.ozma ? (
            <div className="score">랭킹 {character.ozma}</div>
          ) : null}
        </MainInfo>
      </Info>
    </Card>
  );
}
