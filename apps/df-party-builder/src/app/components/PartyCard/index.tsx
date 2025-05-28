import { ChevronDown } from 'lucide-react';
import type { Party, CharacterData } from '../../types/types';
import { CharacterCard } from '../CharacterCard';
import {
  PartyCardContainer,
  PartyCardHeader,
  PartyCardContent,
  PartyCharacterPreview,
  ExpandButton,
  PartyCardDetails,
  PartySlots,
  PartySlot as PartySlotCard,
  PartyMemo,
} from './styles';

type PartyCardProps = {
  party: Party;
  isMobile: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onTitleChange: (newTitle: string) => void;
  onMemoChange: (newMemo: string) => void;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, party: Party) => void;
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, party: Party) => void;
  onCharacterDragStart?: (e: React.DragEvent<HTMLDivElement>, partyId: string, slotIndex: number, character: CharacterData) => void;
  onCharacterDragOver?: (e: React.DragEvent) => void;
  onCharacterDragLeave?: (e: React.DragEvent) => void;
  onCharacterDrop?: (e: React.DragEvent, partyId: string, slotIndex: number) => void;
  onCharacterSelect: (character: CharacterData) => void;
};

export function PartyCard({
  party,
  isMobile,
  isExpanded,
  onToggleExpand,
  onTitleChange,
  onMemoChange,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onCharacterDragStart,
  onCharacterDragOver,
  onCharacterDragLeave,
  onCharacterDrop,
  onCharacterSelect,
}: PartyCardProps) {
  return (
    <PartyCardContainer
      isMobile={isMobile}
      isExpanded={isExpanded}
      draggable={!isMobile}
      onDragStart={!isMobile ? (e) => onDragStart?.(e, party) : undefined}
      onDragEnd={!isMobile ? onDragEnd : undefined}
      onDragOver={!isMobile ? onDragOver : undefined}
      onDragLeave={!isMobile ? onDragLeave : undefined}
      onDrop={!isMobile ? (e) => onDrop?.(e, party) : undefined}
    >
      <PartyCardHeader>
        <input type="text" value={party.title} onChange={(e) => onTitleChange(e.target.value)} placeholder="파티 제목" />
      </PartyCardHeader>
      <PartyCardContent>
        {party.slots.map((slot, index) => {
          if (slot === 'empty') return null;
          const character = slot as CharacterData;
          return (
            <PartyCharacterPreview key={index}>
              <span className="name">{character.name}</span>
              <span className="level">명성 {character.level}</span>
              {character.buffScore ? (
                <span className="score">버프력 {character.buffScore}</span>
              ) : character.ozma ? (
                <span className="score">랭킹 {character.ozma}</span>
              ) : null}
            </PartyCharacterPreview>
          );
        })}
      </PartyCardContent>

      {isExpanded && (
        <PartyCardDetails>
          <PartySlots isMobile={isMobile}>
            {party.slots.map((slot, index) => (
              <PartySlotCard
                key={index}
                isMobile={isMobile}
                onDragOver={!isMobile ? onCharacterDragOver : undefined}
                onDragLeave={!isMobile ? onCharacterDragLeave : undefined}
                onDrop={!isMobile ? (e) => onCharacterDrop?.(e, party.id, index) : undefined}
                className={slot === 'empty' ? 'empty' : ''}
              >
                {slot !== 'empty' ? (
                  <div
                    draggable={!isMobile}
                    onDragStart={!isMobile ? (e) => onCharacterDragStart?.(e, party.id, index, slot as CharacterData) : undefined}
                    style={{ width: '100%', height: '100%' }}
                  >
                    <CharacterCard
                      character={slot as CharacterData}
                      onDragStart={!isMobile ? (e, char) => onCharacterDragStart?.(e, party.id, index, char) : undefined}
                      onClick={() => onCharacterSelect(slot as CharacterData)}
                    />
                  </div>
                ) : (
                  <div>빈 슬롯</div>
                )}
              </PartySlotCard>
            ))}
          </PartySlots>
          <PartyMemo isMobile={isMobile} value={party.memo} onChange={(e) => onMemoChange(e.target.value)} placeholder="파티 메모" />
        </PartyCardDetails>
      )}
      <ExpandButton onClick={onToggleExpand}>
        <ChevronDown />
      </ExpandButton>
    </PartyCardContainer>
  );
}
