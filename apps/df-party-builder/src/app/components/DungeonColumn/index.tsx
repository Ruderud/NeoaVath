import { useState } from 'react';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import styled from '@emotion/styled';
import type { Party, PartySlot, CharacterData } from '../../types/types';
import { CharacterCard } from '../CharacterCard';
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
  onAddParty: (dungeonId: string) => void;
  onPartyDragStart: (e: React.DragEvent<HTMLDivElement>, party: Party) => void;
  onPartyDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
  onPartyDragOver: (e: React.DragEvent) => void;
  onPartyDragLeave: (e: React.DragEvent) => void;
  onPartyDrop: (e: React.DragEvent, targetParty: Party) => void;
  onCharacterDragStart: (e: React.DragEvent<HTMLDivElement>, partyId: string, slotIndex: number, character: CharacterData) => void;
  onCharacterDragOver: (e: React.DragEvent) => void;
  onCharacterDragLeave: (e: React.DragEvent) => void;
  onCharacterDrop: (e: React.DragEvent, targetPartyId: string, targetSlotIndex: number) => void;
  onCharacterSelect: (character: CharacterData) => void;
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
}: DungeonColumnProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Column>
      <ColumnHeader>
        <ColumnTitle>{name}</ColumnTitle>
        <ExpandButton onClick={toggleExpand}>{isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</ExpandButton>
      </ColumnHeader>
      {isExpanded && (
        <ColumnContent>
          {parties.map((party) => (
            <PartyCard
              key={party.id}
              party={party}
              isExpanded={expandedPartyId === party.id}
              onToggleExpand={() => onTogglePartyExpand(party.id)}
              onTitleChange={(newTitle) => onPartyTitleChange(party.id, newTitle)}
              onMemoChange={(newMemo) => onPartyMemoChange(party.id, newMemo)}
              onDragStart={(e) => onPartyDragStart(e, party)}
              onDragEnd={onPartyDragEnd}
              onDragOver={onPartyDragOver}
              onDragLeave={onPartyDragLeave}
              onDrop={(e) => onPartyDrop(e, party)}
              onCharacterDragStart={onCharacterDragStart}
              onCharacterDragOver={onCharacterDragOver}
              onCharacterDragLeave={onCharacterDragLeave}
              onCharacterDrop={onCharacterDrop}
              onCharacterSelect={onCharacterSelect}
            />
          ))}
          <AddPartyButton onClick={() => onAddParty(id)}>
            <Plus size={20} /> 파티 추가
          </AddPartyButton>
        </ColumnContent>
      )}
    </Column>
  );
}

const Column = styled.div`
  background: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
  min-width: 300px;
  max-width: 300px;
  height: fit-content;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
`;

const ColumnHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const ColumnTitle = styled.h3`
  margin: 0;
  font-size: 1.2em;
  font-weight: 600;
`;

const ExpandButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #000;
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
