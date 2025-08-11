import { useState } from 'react';
import { Plus, Pencil, X } from 'lucide-react';
import styled from '@emotion/styled';
import type { Party, CharacterData, PartySlot } from '../../types/types';
import { PartyCard } from '../PartyCard';

export type DungeonColumnProps = {
  id: string;
  name: string;
  parties: Party[];
  isMobile: boolean;
  expandedPartyId: string | null;
  onTogglePartyExpand: (partyId: string) => void;
  onPartyTitleChange: (partyId: string, newTitle: string) => void;
  onPartyMemoChange: (partyId: string, newMemo: string) => void;
  onPartyCompletedChange: (partyId: string, isCompleted: boolean) => void;
  onAddParty: (dungeonId: string) => void;
  onPartyDragStart: (e: React.DragEvent<HTMLDivElement>, party: Party) => void;
  onPartyDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
  onPartyDragOver: (e: React.DragEvent) => void;
  onPartyDragLeave: (e: React.DragEvent) => void;
  onPartyDrop: (e: React.DragEvent, targetParty: Party) => void;
  onCharacterDragStart: (e: React.DragEvent<HTMLDivElement>, partyId: string, slotIndex: number, character: PartySlot) => void;
  onCharacterDragOver: (e: React.DragEvent) => void;
  onCharacterDragLeave: (e: React.DragEvent) => void;
  onCharacterDrop: (e: React.DragEvent, targetDungeonId: string, targetPartyId: string, targetSlotIndex: number) => void;
  onCharacterSelect: (character: CharacterData) => void;
  onDungeonNameChange: (dungeonId: string, newName: string) => void;
  onDungeonDelete: (dungeonId: string) => void;
  onCharacterDelete: (partyId: string, slotIndex: number) => void;
  onPartyDelete: (partyId: string) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
};

export function DungeonColumn({
  id,
  name,
  parties,
  isMobile,
  expandedPartyId,
  onTogglePartyExpand,
  onPartyTitleChange,
  onPartyMemoChange,
  onPartyCompletedChange,
  onAddParty,
  onPartyDragStart,
  onPartyDragEnd,
  onPartyDragOver,
  onPartyDragLeave,
  onPartyDrop,
  onCharacterDragStart,
  onCharacterDragOver,
  onCharacterDragLeave,
  onCharacterDrop,
  onCharacterSelect,
  onDungeonNameChange,
  onDungeonDelete,
  onCharacterDelete,
  onPartyDelete,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: DungeonColumnProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(name);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editedName.trim() && editedName !== name) {
      onDungeonNameChange(id, editedName.trim());
    }
    setIsEditing(false);
  };

  return (
    <Column draggable onDragStart={onDragStart} onDragEnd={onDragEnd} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
      <ColumnHeader>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isEditing ? (
            <NameEditForm onSubmit={handleNameSubmit}>
              <NameInput type="text" value={editedName} onChange={(e) => setEditedName(e.target.value)} onBlur={handleNameSubmit} autoFocus />
            </NameEditForm>
          ) : (
            <>
              <ColumnTitle>{name}</ColumnTitle>
              <EditButton onClick={() => setIsEditing(true)}>
                <Pencil size={16} />
              </EditButton>
            </>
          )}
        </div>
        <DeleteDungeonButton onClick={() => onDungeonDelete(id)}>
          <X size={16} />
        </DeleteDungeonButton>
      </ColumnHeader>

      {parties.length > 0 && (
        <ColumnContent>
          {parties.map((party) => (
            <PartyCard
              key={party.id}
              party={party}
              isMobile={isMobile}
              onTitleChange={(newTitle) => onPartyTitleChange(party.id, newTitle)}
              onMemoChange={(newMemo) => onPartyMemoChange(party.id, newMemo)}
              onDragStart={(e) => onPartyDragStart(e, party)}
              onDragEnd={onPartyDragEnd}
              onDragOver={onPartyDragOver}
              onDragLeave={onPartyDragLeave}
              onDrop={(e) => onPartyDrop(e, party)}
              onCharacterDragStart={(e, slotIndex, character) => onCharacterDragStart(e, party.id, slotIndex, character)}
              onCharacterDragOver={onCharacterDragOver}
              onCharacterDragLeave={onCharacterDragLeave}
              onCharacterDrop={(e, targetPartyId, targetSlotIndex) => onCharacterDrop(e, id, targetPartyId, targetSlotIndex)}
              onCharacterSelect={onCharacterSelect}
              onCharacterDelete={onCharacterDelete}
              onPartyDelete={onPartyDelete}
            />
          ))}
        </ColumnContent>
      )}

      <AddPartyButton onClick={() => onAddParty(id)}>
        <Plus size={20} />
      </AddPartyButton>
    </Column>
  );
}

const Column = styled.div`
  background: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
  width: 600px;
  min-width: 600px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  cursor: move;
  transition: all 0.2s ease;

  &.dragging {
    opacity: 0.5;
  }

  &.drag-over {
    border: 2px dashed #2196f3;
  }

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
`;

const ColumnHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ColumnTitle = styled.h3`
  margin: 0;
  font-size: 1.2em;
  font-weight: 600;
`;

const EditButton = styled.button`
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;

  &:hover {
    color: #333;
  }
`;

const NameEditForm = styled.form`
  display: flex;
  flex: 1;
`;

const NameInput = styled.input`
  width: 100%;
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;

  &:focus {
    outline: none;
    border-color: #2196f3;
  }
`;

const ColumnContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const AddPartyButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: white;
  border: 2px dashed #ddd;
  border-radius: 8px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #2196f3;
    color: #2196f3;
  }
`;

const DeleteDungeonButton = styled.button`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #ff4d4f;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: none;
  padding: 0;

  &:hover {
    background: #ff7875;
  }
`;
