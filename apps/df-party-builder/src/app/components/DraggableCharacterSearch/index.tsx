import { DraggableDialog } from '../DraggableDialog';
import { useZIndex } from '../../hooks/useZIndex';
import { CharacterSearch } from '../CharacterSearch';
import type { CharacterData, Dungeon } from '../../types/types';

type DraggableCharacterSearchProps = {
  isOpen: boolean;
  onClose: () => void;
  onCharacterSelect: (character: CharacterData) => void;
  onCharacterDragStart: (e: React.DragEvent<HTMLDivElement>, character: CharacterData) => void;
  dungeons: Dungeon[];
};

export function DraggableCharacterSearch({ isOpen, onClose, onCharacterSelect, onCharacterDragStart, dungeons }: DraggableCharacterSearchProps) {
  const { zIndex, bringToFront } = useZIndex('character-search');

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
      <CharacterSearch isOpen={true} onCharacterSelect={onCharacterSelect} onCharacterDragStart={onCharacterDragStart} dungeons={dungeons} />
    </DraggableDialog>
  );
}
