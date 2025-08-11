import { DraggableDialog } from '../DraggableDialog';
import { useZIndex } from '../../hooks/useZIndex';
import { CharacterSearch } from '../CharacterSearch';
import { useCharacterDetail } from '../../context/CharacterDetailContext';
import type { CharacterData } from '../../types/types';

type DraggableCharacterSearchProps = {
  isOpen: boolean;
  onClose: () => void;
  groupName?: string;
  onCharacterDragStart: (e: React.DragEvent<HTMLDivElement>, character: CharacterData) => void;
};

export function DraggableCharacterSearch({ isOpen, onClose, groupName, onCharacterDragStart }: DraggableCharacterSearchProps) {
  const { zIndex, bringToFront } = useZIndex('character-search');
  const { showCharacterDetail } = useCharacterDetail();

  const handleCharacterSelect = (character: CharacterData) => {
    showCharacterDetail(character);
  };

  return (
    <DraggableDialog
      isOpen={isOpen}
      onClose={onClose}
      title="캐릭터 검색"
      dialogId="character-search"
      onFocus={bringToFront}
      zIndex={zIndex}
      initialPosition={{ x: 100, y: 100 }}
      initialSize={{ width: 600, height: 400 }}
    >
      <CharacterSearch isOpen={true} groupName={groupName} onCharacterSelect={handleCharacterSelect} onCharacterDragStart={onCharacterDragStart} />
    </DraggableDialog>
  );
}
