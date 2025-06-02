import { useState } from 'react';
import styled from '@emotion/styled';
import { Pencil, X } from 'lucide-react';
import type { Party, CharacterData, PartySlot } from '../../types/types';
import { CharacterCard } from '../CharacterCard';
import {
  PartyCardContainer,
  PartyCardHeader,
  PartyCardContent,
  PartyCharacterPreview,
  ExpandButton,
  PartyCardDetails,
  PartySlots as PartySlotsContainer,
  PartySlot as PartySlotCard,
  PartyMemo,
  PartyTitle,
  CheckboxButton,
  DeletePartyButton,
} from './styles';

type PartyCardProps = {
  party: Party;
  isMobile: boolean;
  onTitleChange: (newTitle: string) => void;
  onMemoChange: (newMemo: string) => void;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, party: Party) => void;
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, party: Party) => void;
  onCharacterDragStart: (e: React.DragEvent<HTMLDivElement>, slotIndex: number, character: PartySlot) => void;
  onCharacterDragOver: (e: React.DragEvent) => void;
  onCharacterDragLeave: (e: React.DragEvent) => void;
  onCharacterDrop: (e: React.DragEvent, partyId: string, slotIndex: number) => void;
  onCharacterSelect: (character: CharacterData) => void;
  onCharacterDelete: (partyId: string, slotIndex: number) => void;
  onPartyDelete: (partyId: string) => void;
};

export function PartyCard({
  party,
  isMobile,
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
  onCharacterDelete,
  onPartyDelete,
}: PartyCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(party.title);
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editedTitle.trim() && editedTitle !== party.title) {
      onTitleChange(editedTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCharacterClick = (character: PartySlot) => {
    if (character !== 'empty') {
      onCharacterSelect(character as CharacterData);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, slotIndex: number) => {
    e.stopPropagation();
    onCharacterDelete(party.id, slotIndex);
  };

  const handlePartyDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPartyDelete(party.id);
  };

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      isCompleted={party.isCompleted}
    >
      <PartyCardHeader>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
          {isEditing ? (
            <TitleEditForm onSubmit={handleTitleSubmit}>
              <TitleInput type="text" value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} onBlur={handleTitleSubmit} autoFocus />
            </TitleEditForm>
          ) : (
            <>
              <PartyTitle>{party.title}</PartyTitle>
              <EditButton onClick={() => setIsEditing(true)}>
                <Pencil size={16} />
              </EditButton>
            </>
          )}

          {isHovered && (
            <DeletePartyButton style={{ marginLeft: 'auto' }} className="delete-party-button" onClick={handlePartyDelete}>
              <X size={16} />
            </DeletePartyButton>
          )}
        </div>
      </PartyCardHeader>

      {isExpanded ? (
        <PartyCardDetails>
          <PartySlotsContainer isMobile={isMobile}>
            {party.slots.map((slot, index) => (
              <PartySlotCard
                key={index}
                isMobile={isMobile}
                onDragOver={!isMobile ? onCharacterDragOver : undefined}
                onDragLeave={!isMobile ? onCharacterDragLeave : undefined}
                onDrop={!isMobile ? (e) => onCharacterDrop(e, party.id, index) : undefined}
                className={slot === 'empty' ? 'empty' : ''}
              >
                {slot !== 'empty' ? (
                  <>
                    <CharacterCard
                      cardProps={{ className: 'character-card' }}
                      character={slot as CharacterData}
                      onDragStart={!isMobile ? (e) => onCharacterDragStart(e, index, slot) : undefined}
                      onClick={() => handleCharacterClick(slot)}
                    />
                    <button className="delete-button" onClick={(e) => handleDeleteClick(e, index)}>
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <div className="empty-slot">빈 슬롯</div>
                )}
              </PartySlotCard>
            ))}
          </PartySlotsContainer>
          <PartyMemo isMobile={isMobile} value={party.memo} onChange={(e) => onMemoChange(e.target.value)} placeholder="파티 메모" />
        </PartyCardDetails>
      ) : (
        <PartyCardContent>
          {party.slots.map((slot, index) => {
            if (slot === 'empty') return null;
            const character = slot as CharacterData;
            if (!character?.name) return null;

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
      )}
      <ExpandButton onClick={handleToggleExpand}>{isExpanded ? '접기' : '펼치기'}</ExpandButton>
      {/* {(isHovered || party.isCompleted) && (
        <CheckboxButton
          type="checkbox"
          checked={party.isCompleted}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onCompletedChange(e.target.checked)}
        />
      )} */}
    </PartyCardContainer>
  );
}

const TitleEditForm = styled.form`
  display: flex;
  flex: 1;
`;

const TitleInput = styled.input`
  width: 100%;
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;

  &:focus {
    outline: none;
    border-color: #2196f3;
  }
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
