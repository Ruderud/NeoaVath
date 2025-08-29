import { useState } from 'react';
import styled from '@emotion/styled';
import { Pencil, X, ChevronUp, ChevronDown } from 'lucide-react';
import type { Party, CharacterData, PartySlot, GroupConfig, BufferCharacterData } from '../../types/types';
import { CharacterCard } from '../CharacterCard/index';
import { calculatePartyDamagePotential, formatDamagePotential, calculateSynergyDamagePotential } from '../../utils/partyDamagePotential';
import { getCharacterColor } from '../../consts/character-colors';
import { PositionIcon } from '../PositionIcon';
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

const isBufferCharacter = (character: CharacterData): character is BufferCharacterData => {
  return 'buffScore' in character;
};

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
  onTextInputBlur?: () => void;
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
  onTextInputBlur,
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
    onTextInputBlur?.();
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
          <CollapsedDamagePotential
            isCalculable={damagePotentialResult.isCalculable}
            data-tooltip={`${calculationFormula}\n버프력은 해당 파티에서 가장 큰 버프력 1인만 사용합니다.`}
          >
            {damagePotentialText.replace(' (억×만)', '')}
          </CollapsedDamagePotential>
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
                  />
                ) : (
                  <div className="empty-slot">빈 슬롯</div>
                )}
              </PartySlotCard>
            ))}
          </PartySlotsContainer>
          <PartyMemo isMobile={isMobile} value={party.memo} onChange={(e) => onMemoChange(e.target.value)} onBlur={onTextInputBlur} placeholder="파티 메모" />
        </PartyCardDetails>
      ) : (
        <PartyCardContent>
          <CollapsedDamagePotential
            isCalculable={damagePotentialResult.isCalculable}
            data-tooltip={`${calculationFormula}\n버프력은 해당 파티에서 가장 큰 버프력 1인만 사용합니다.`}
          >
            {damagePotentialText.replace(' (억×만)', '')}
          </CollapsedDamagePotential>
          {party.slots.map((slot, index) => {
            if (slot === 'empty') return null;
            const character = slot as CharacterData;
            if (!character?.name) return null;

            const characterColor = getCharacterColor(character.position);

            // 버퍼의 경우 파티원 수에 따라 버프력 표시
            const getBufferDisplayScore = (character: CharacterData) => {
              if (!isBufferCharacter(character)) return null;

              // 현재 파티의 파티원 수 계산 (빈 슬롯 제외)
              const partyMemberCount = party.slots.filter((slot) => slot !== 'empty').length;

              // buffScore3, buffScore4가 모두 있는 경우에만 파티원 수에 따라 표시
              if (character.buffScore3 && character.buffScore4) {
                if (partyMemberCount === 4 && character.buffScore4) {
                  return `(4인) ${character.buffScore4}`;
                } else if (partyMemberCount === 3 && character.buffScore3) {
                  return `(3인) ${character.buffScore3}`;
                } else if (character.buffScore) {
                  return character.buffScore;
                }
              }

              // buffScore3, buffScore4가 없는 경우 기본 buffScore만 표시
              if (character.buffScore) {
                return character.buffScore;
              }

              return null;
            };

            // 시너지의 경우 4인 데미지 우선 표시
            const getSynergyDisplayScore = (character: CharacterData) => {
              if (character.position !== '시너지') return null;
              const synergyDamage = calculateSynergyDamagePotential(character);
              if (synergyDamage) return `(4인) ${synergyDamage}`;
              if (character.rankDamage) return `랭킹 ${character.rankDamage}`;
              return null;
            };

            const displayScore =
              getBufferDisplayScore(character) ||
              getSynergyDisplayScore(character) ||
              (!isBufferCharacter(character) && character.rankDamage ? `랭킹 ${character.rankDamage}` : null);

            // 툴팁용 전체 정보 생성
            const getTooltipText = (character: CharacterData) => {
              const lines = [];
              if (isBufferCharacter(character)) {
                if (character.buffScore) lines.push(`(2인) ${character.buffScore}`);
                if (character.buffScore3) lines.push(`(3인) ${character.buffScore3}`);
                if (character.buffScore4) lines.push(`(4인) ${character.buffScore4}`);
              } else if (character.position === '시너지') {
                if (character.rankDamage) lines.push(`랭킹: ${character.rankDamage}`);
                const synergyDamage = calculateSynergyDamagePotential(character);
                if (synergyDamage) lines.push(`(4인) ${synergyDamage}`);
              } else if (character.rankDamage) {
                lines.push(`랭킹: ${character.rankDamage}`);
              }
              return lines.join('\n');
            };

            return (
              <PartyCharacterPreview key={index} characterColor={characterColor.gradient} title={getTooltipText(character)}>
                <div className="character-info">
                  <PositionIcon position={character.position} size={14} />
                  <span className="name">{character.name}</span>
                  <span className="level">명성 {character.level}</span>
                </div>
                {displayScore && <span className="score">{displayScore}</span>}
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

const CollapsedDamagePotential = styled.div`
  padding: 4px 8px;
  margin-bottom: 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  text-align: center;
  background: ${({ isCalculable }: { isCalculable: boolean }) => (isCalculable ? '#e8f5e8' : '#fff3cd')};
  color: ${({ isCalculable }: { isCalculable: boolean }) => (isCalculable ? '#2e7d32' : '#856404')};
  border: 1px solid ${({ isCalculable }: { isCalculable: boolean }) => (isCalculable ? '#c8e6c9' : '#ffeaa7')};
  cursor: help;
  position: relative;

  &:hover::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: -40px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 8px 10px;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: normal;
    white-space: pre-line;
    z-index: 1000;
    pointer-events: none;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
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
