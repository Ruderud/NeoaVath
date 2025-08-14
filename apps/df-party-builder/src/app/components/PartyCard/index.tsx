import { useState } from 'react';
import styled from '@emotion/styled';
import { Pencil, X, ChevronUp, ChevronDown } from 'lucide-react';
import type { Party, CharacterData, PartySlot, GroupConfig } from '../../types/types';
import { CharacterCard } from '../CharacterCard/index';
import { calculatePartyDamagePotential, formatDamagePotential } from '../../utils/partyDamagePotential';
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
  DeletePartyButton,
} from './styles';

type PartyCardProps = {
  party: Party;
  isMobile: boolean;
  groupConfig: GroupConfig;
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
  onCharacterDelete: (partyId: string, slotIndex: number) => void;
  onPartyDelete: (partyId: string) => void;
  onDungeonSelect?: (partyId: string, dungeon: string) => void;
  onTagSelect?: (partyId: string, tagId: string) => void;
};

export function PartyCard({
  party,
  isMobile,
  groupConfig,
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
  onCharacterDelete,
  onPartyDelete,
  onDungeonSelect,
  onTagSelect,
}: PartyCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(party.title);
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // 데미지 포텐셜 계산
  const damagePotentialResult = calculatePartyDamagePotential(party.slots);
  const damagePotentialText = formatDamagePotential(damagePotentialResult);

  // 계산식 생성
  const generateCalculationFormula = () => {
    const validSlots = party.slots.filter((slot) => slot !== 'empty');
    const rankDamageSlots = validSlots.filter((slot) => 'rankDamage' in slot && slot.rankDamage);
    const buffSlots = validSlots.filter((slot) => 'buffScore' in slot && slot.buffScore);

    if (rankDamageSlots.length === 0 || buffSlots.length === 0) {
      return '계산 불가';
    }

    const rankDamageValues = rankDamageSlots.map((slot) => {
      if ('rankDamage' in slot && slot.rankDamage) {
        const rankDamageValue = parseInt(slot.rankDamage.match(/(\d+)\s*억/)?.[1] || '0', 10);
        return `${rankDamageValue}억`;
      }
      return '0억';
    });

    const maxBuffValue = Math.max(
      ...buffSlots.map((slot) => {
        if ('buffScore' in slot && slot.buffScore) {
          const buffValue = Math.floor(parseInt(slot.buffScore.replace(/,/g, ''), 10) / 10000);
          return buffValue;
        }
        return 0;
      }),
    );

    const rankDamageFormula = rankDamageValues.join(' + ');
    return `(${rankDamageFormula}) × (${maxBuffValue}만)`;
  };

  const calculationFormula = generateCalculationFormula();

  // const { tags: groupTags } = groupConfig;

  // const { tags: partyTags } = party;

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editedTitle.trim() && editedTitle !== party.title) {
      onTitleChange(editedTitle.trim());
    }
    setIsEditing(false);
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
      {/* <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        {groupTags.map((tag) => (
          <Chip key={tag.id} color={tag.color} value={tag.name} isSelected={party.tags?.includes(tag.id)} onClick={() => onTagSelect?.(party.id, tag.id)} />
        ))}
      </div> */}

      {isExpanded ? (
        <PartyCardDetails>
          <DamagePotentialDisplay
            isCalculable={damagePotentialResult.isCalculable}
            data-tooltip={`${calculationFormula}\n버프력은 해당 파티에서 가장 큰 버프력 1인만 사용합니다.`}
          >
            {damagePotentialText.replace(' (억×만)', '')}
          </DamagePotentialDisplay>
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
                  <CharacterCard
                    className="character-card"
                    draggable
                    character={slot as CharacterData}
                    onDragStart={!isMobile ? (e) => onCharacterDragStart(e, index, slot) : undefined}
                    onDelete={() => onCharacterDelete(party.id, index)}
                    helperText={`${slot.name} 캐릭터 정보`}
                  />
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
                <div className="character-info">
                  <span className="name">{character.name}</span>
                  <span className="level">명성 {character.level}</span>
                </div>
                {character.buffScore ? (
                  <span className="score">버프력 {character.buffScore}</span>
                ) : character.rankDamage ? (
                  <span className="score">랭킹 {character.rankDamage}</span>
                ) : null}
              </PartyCharacterPreview>
            );
          })}
        </PartyCardContent>
      )}
      <ExpandButton onClick={handleToggleExpand}>{isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</ExpandButton>
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

const DamagePotentialDisplay = styled.div<{ isCalculable: boolean }>`
  padding: 8px 12px;
  margin-bottom: 12px;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  text-align: center;
  background: ${({ isCalculable }) => (isCalculable ? '#e8f5e8' : '#fff3cd')};
  color: ${({ isCalculable }) => (isCalculable ? '#2e7d32' : '#856404')};
  border: 1px solid ${({ isCalculable }) => (isCalculable ? '#c8e6c9' : '#ffeaa7')};
  cursor: help;
  position: relative;

  &:hover::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: -50px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 10px 12px;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: normal;
    white-space: pre-line;
    z-index: 1000;
    pointer-events: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    text-align: center;
    min-width: max-content;
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
