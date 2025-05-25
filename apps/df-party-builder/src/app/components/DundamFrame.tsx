import styled from '@emotion/styled';
import type { CharacterData } from '../types/types';
import { CharacterCard } from './CharacterCard';

const ResultContainer = styled.div`
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  width: 100%;
  max-width: 180px;
  overflow-x: hidden;
`;

type DundamFrameProps = {
  characters: CharacterData[];
  onCharacterSelect?: (character: CharacterData) => void;
};

export function DundamFrame({ characters, onCharacterSelect }: DundamFrameProps) {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, char: CharacterData) => {
    e.dataTransfer.setData('character', JSON.stringify(char));
  };

  return (
    <ResultContainer>
      {characters.map((char) => (
        <CharacterCard key={char.key} character={char} onDragStart={handleDragStart} onClick={onCharacterSelect} />
      ))}
    </ResultContainer>
  );
}
