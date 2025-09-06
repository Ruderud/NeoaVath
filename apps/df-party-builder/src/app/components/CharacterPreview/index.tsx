import { CharacterData } from '../../types/types';
import { getCharacterColor } from '../../consts/character-colors';
import { PositionIcon } from '../PositionIcon';
import { CharacterPreviewContainer, CharacterInfo, CharacterName, CharacterLevel, CharacterScore, RemoveButton } from './styles';

type CharacterPreviewProps = {
  character: CharacterData;
  onRemove?: (characterKey: string) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, character: CharacterData) => void;
  showRemoveButton?: boolean;
};

export function CharacterPreview({ character, onRemove, draggable = false, onDragStart, showRemoveButton = true }: CharacterPreviewProps) {
  const characterColor = getCharacterColor(character.position);
  const isBuffer = 'buffScore' in character;
  const displayScore = isBuffer ? character.buffScore : character.rankDamage;

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (onDragStart) {
      onDragStart(e, character);
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove(character.key);
    }
  };

  return (
    <CharacterPreviewContainer
      characterColor={characterColor.gradient}
      hasRemoveButton={showRemoveButton && !!onRemove}
      draggable={draggable}
      onDragStart={handleDragStart}
    >
      <CharacterInfo>
        <PositionIcon position={character.position} size={14} />
        <CharacterName>{character.name}</CharacterName>
        <CharacterLevel>명성 {character.level}</CharacterLevel>
      </CharacterInfo>
      {displayScore && <CharacterScore>{displayScore}</CharacterScore>}
      {showRemoveButton && onRemove && <RemoveButton onClick={handleRemove}>×</RemoveButton>}
    </CharacterPreviewContainer>
  );
}
