import styled from '@emotion/styled';
import type { CharacterData } from '../types/types';

const ResultContainer = styled.div`
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  width: 100%;
  overflow-x: hidden;
`;

const CharacterCard = styled.div`
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
  min-height: 240px;
  width: 100%;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const CharacterImage = styled.div`
  width: auto;
  height: 100px;
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

const CharacterInfo = styled.div`
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

interface DundamFrameProps {
  characters: CharacterData[];
  onCharacterSelect?: (character: CharacterData) => void;
}

export function DundamFrame({ characters, onCharacterSelect }: DundamFrameProps) {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, char: CharacterData) => {
    e.dataTransfer.setData('character', JSON.stringify(char));
  };

  return (
    <ResultContainer>
      {characters.map((char) => (
        <CharacterCard key={char.key} draggable onDragStart={(e) => handleDragStart(e, char)} onClick={() => onCharacterSelect?.(char)}>
          <CharacterImage>
            <img
              src={`https://img-api.neople.co.kr/df/servers/${char.server}/characters/${char.key}?zoom=1`}
              alt={`${char.name} 캐릭터 이미지`}
              draggable="false"
            />
          </CharacterImage>
          <CharacterInfo>
            <MainInfo>
              <div className="level">명성 {char.level}</div>
              <div className="name">{char.name}</div>
              <div className="adventure">{char.adventureName}</div>
              {char.buffScore ? <div className="score">버프력 {char.buffScore}</div> : char.ozma ? <div className="score">랭킹 {char.ozma}</div> : null}
            </MainInfo>
          </CharacterInfo>
        </CharacterCard>
      ))}
    </ResultContainer>
  );
}
