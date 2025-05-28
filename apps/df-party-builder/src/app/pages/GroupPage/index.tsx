import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useErrorBoundary } from 'react-error-boundary';
import { PasswordDialog } from '../../components/PasswordDialog';
import { useFirebase } from '../../context/FirebaseContext';
import { throttle } from 'es-toolkit';
import { getLocalStorageItem, setLocalStorageItem } from '../../utils/localStorage';
import type { Party, PartySlot, CharacterData } from '../../types/types';
import { Plus } from 'lucide-react';
import { Drawer } from '../../components/Drawer';
import { DungeonColumn } from '../../components/DungeonColumn';
import { PartyModal } from '../../components/PartyModal';
import { ActionSheet } from '../../components/ActionSheet';
import { CharacterSearch } from '../../components/CharacterSearch';
import {
  PageContainer,
  MainContent,
  Section,
  SectionTitle,
  KanbanBoard,
  AddDungeonColumn,
  AddDungeonForm,
  AddDungeonInput,
  AddGroupButton,
  AddGroupButtonRow,
  CancelButton,
  AddDungeonButton,
  Button,
} from './styles';

const isExistGroupLoginData = (groupName?: string): boolean => {
  if (!groupName) return false;

  const storedGroups =
    getLocalStorageItem<{
      recentGroups?: {
        name: string;
        id: string;
        lastVisited: string;
      }[];
    }>('recentGroups')?.recentGroups || [];

  const result = Boolean(storedGroups.find((group) => group.name === groupName));

  return !result;
};

type Dungeon = {
  id: string;
  name: string;
  parties: Party[];
};

export function GroupPage() {
  const { groupName } = useParams<{ groupName: string }>();
  const [showPasswordDialog, setShowPasswordDialog] = useState(isExistGroupLoginData(groupName));
  const [dungeons, setDungeons] = useState<Dungeon[]>([
    { id: '1', name: '발할라', parties: [] },
    { id: '2', name: '오즈마', parties: [] },
    { id: '3', name: '이스핀즈', parties: [] },
  ]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [expandedPartyId, setExpandedPartyId] = useState<string | null>(null);
  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(null);
  const [showAddGroupInput, setShowAddGroupInput] = useState(false);
  const [newDungeonName, setNewDungeonName] = useState('');
  const { showBoundary } = useErrorBoundary();
  const { writeData, readData } = useFirebase();
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterData | null>(null);
  const [showCharacterSearch, setShowCharacterSearch] = useState(false);

  // Drawer 토글 함수
  const handleToggleDrawer = useCallback(() => {
    setIsDrawerOpen((prev) => !prev);
  }, []);

  // 모바일 여부 감지
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 로컬스토리지에 방문 정보 저장
  useEffect(() => {
    if (!groupName) return;

    const addToRecentGroups = () => {
      const storedGroups = localStorage.getItem('recentGroups');
      let recentGroups = storedGroups ? JSON.parse(storedGroups) : [];

      // 이미 존재하는 그룹이면 제거
      recentGroups = recentGroups.filter((g: unknown) => (g as { id: string }).id !== groupName);

      // 새로운 그룹 정보를 맨 앞에 추가
      recentGroups.unshift({
        id: groupName,
        name: groupName,
        lastVisited: new Date().toISOString(),
      });

      // 최대 5개까지만 저장
      recentGroups = recentGroups.slice(0, 5);

      localStorage.setItem('recentGroups', JSON.stringify(recentGroups));
    };

    // 인증이 완료된 경우에만 방문 정보 저장
    const isAuthenticated = sessionStorage.getItem(`auth_${groupName}`);
    if (isAuthenticated) {
      addToRecentGroups();
    }
  }, [groupName]);

  // 파티 데이터 저장을 위한 debounce 함수 (텍스트 입력)
  const savePartyDataDebounced = useCallback(
    async (groupName: string, parties: Party[]) => {
      await writeData(`groups/${groupName}/parties`, parties);
      console.log('savePartyDataDebounced', groupName, parties);
    },
    [writeData],
  );

  // 파티 데이터 저장을 위한 throttle 함수 (드래그 앤 드롭)
  const savePartyDataThrottled = useCallback(
    (groupName: string, parties: Party[]) => {
      throttle(async (groupName: string, parties: Party[]) => {
        await writeData(`groups/${groupName}/parties`, parties);
        console.log('savePartyDataThrottled', groupName, parties);
      }, 2000);
    },
    [writeData],
  );

  // 파티 데이터 변경 감지 및 저장
  useEffect(() => {
    if (!groupName || !dungeons.length) return;

    // 파티 데이터 저장 전 slots 배열 검증 및 수정
    const validatedDungeons = dungeons.map((dungeon) => ({
      ...dungeon,
      parties: dungeon.parties.map((party) => ({
        ...party,
        slots:
          party.slots?.length === 4
            ? (party.slots.map((slot) => (slot === null ? 'empty' : slot)) as [PartySlot, PartySlot, PartySlot, PartySlot])
            : (Array(4).fill('empty') as [PartySlot, PartySlot, PartySlot, PartySlot]),
      })),
    }));

    // 마지막 저장 시점과 현재 시점의 데이터 비교
    const lastSavedData = sessionStorage.getItem(`lastSavedParties_${groupName}`);
    const currentData = JSON.stringify(validatedDungeons);

    if (lastSavedData !== currentData) {
      sessionStorage.setItem(`lastSavedParties_${groupName}`, currentData);
      savePartyDataDebounced(
        groupName,
        validatedDungeons.flatMap((dungeon) => dungeon.parties),
      );
    }
  }, [dungeons, groupName, savePartyDataDebounced]);

  // 파티 데이터 초기 로드
  useEffect(() => {
    if (!groupName) return;

    const loadPartyData = async () => {
      try {
        const data = await readData(`groups/${groupName}/parties`);
        if (data) {
          // slots 배열 검증 및 수정
          const validatedParties = (data as unknown as Party[]).map((party) => ({
            ...party,
            slots:
              Array.isArray(party.slots) && party.slots.length === 4
                ? party.slots.map((slot: PartySlot) => (slot === null ? 'empty' : slot))
                : (Array(4).fill('empty') as [PartySlot, PartySlot, PartySlot, PartySlot]),
          })) as Party[];

          setDungeons((prev) => prev.map((dungeon) => (dungeon.id === groupName ? { ...dungeon, parties: validatedParties } : dungeon)));
          sessionStorage.setItem(`lastSavedParties_${groupName}`, JSON.stringify(validatedParties));
        } else {
          setDungeons((prev) => prev.map((dungeon) => (dungeon.id === groupName ? { ...dungeon, parties: [] } : dungeon)));
        }
      } catch (error) {
        console.error('파티 데이터 로드 실패:', error);
        setDungeons((prev) => prev.map((dungeon) => (dungeon.id === groupName ? { ...dungeon, parties: [] } : dungeon)));
      }
    };

    loadPartyData();
  }, [groupName, readData]);

  // 드래그 앤 드롭으로 인한 파티 순서 변경 처리
  const handlePartyOrderChange = useCallback(
    (newParties: Party[]) => {
      setDungeons((prev) => prev.map((dungeon) => (dungeon.id === groupName ? { ...dungeon, parties: newParties } : dungeon)));
      if (groupName) {
        savePartyDataThrottled(groupName, newParties);
      }
    },
    [groupName, savePartyDataThrottled],
  );

  const addPartyToDungeon = (dungeonId: string) => {
    const newParty: Party = {
      id: Date.now().toString(),
      title: '새 파티',
      slots: ['empty', 'empty', 'empty', 'empty'] as [PartySlot, PartySlot, PartySlot, PartySlot],
      memo: '',
    };

    setDungeons((prev) => prev.map((dungeon) => (dungeon.id === dungeonId ? { ...dungeon, parties: [...dungeon.parties, newParty] } : dungeon)));
  };

  const handlePartyDragStart = (e: React.DragEvent<HTMLDivElement>, partyId: string, slotIndex: number, character: CharacterData) => {
    e.stopPropagation();
    e.dataTransfer.setData('character', JSON.stringify(character));
    e.dataTransfer.setData('sourcePartyId', partyId);
    e.dataTransfer.setData('sourceSlotIndex', String(slotIndex));
    e.dataTransfer.setData('type', 'character');
  };

  const handlePartyCardDragStart = (e: React.DragEvent<HTMLDivElement>, party: Party) => {
    e.dataTransfer.setData('party', JSON.stringify(party));
    e.dataTransfer.setData('type', 'party');
    e.currentTarget.classList.add('dragging');
  };

  const handlePartyCardDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('dragging');
  };

  const handlePartyCardDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLDivElement;
    const type = e.dataTransfer.types.includes('party') ? 'party' : 'character';

    if (type === 'party') {
      target.classList.add('drag-over');
    }
  };

  const handlePartyCardDragLeave = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLDivElement;
    target.classList.remove('drag-over');
  };

  const handlePartyCardDrop = (e: React.DragEvent, targetParty: Party) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLDivElement;
    target.classList.remove('drag-over');

    const type = e.dataTransfer.getData('type');

    if (type === 'party') {
      const partyData = e.dataTransfer.getData('party');
      if (!partyData) return;

      try {
        const sourceParty = JSON.parse(partyData) as Party;

        const newParties = [...(dungeons.find((dungeon) => dungeon.id === groupName)?.parties || [])];
        const sourceIndex = newParties.findIndex((p) => p.id === sourceParty.id);
        const targetIndex = newParties.findIndex((p) => p.id === targetParty.id);

        if (sourceIndex !== -1 && targetIndex !== -1) {
          [newParties[sourceIndex], newParties[targetIndex]] = [newParties[targetIndex], newParties[sourceIndex]];
          handlePartyOrderChange(newParties);
        }
      } catch (error) {
        console.error('파티 데이터 파싱 실패:', error);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLDivElement;
    target.classList.add('drag-over');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLDivElement;
    target.classList.remove('drag-over');
  };

  const handleDrop = (e: React.DragEvent, targetPartyId: string, targetSlotIndex: number) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLDivElement;
    target.classList.remove('drag-over');

    const type = e.dataTransfer.getData('type');
    if (type !== 'character') return;

    const characterData = e.dataTransfer.getData('character');
    const sourcePartyId = e.dataTransfer.getData('sourcePartyId');
    const sourceSlotIndex = e.dataTransfer.getData('sourceSlotIndex');

    if (!characterData) return;

    try {
      const character = JSON.parse(characterData) as CharacterData;

      setDungeons((prev) => {
        const newParties = [...(prev.find((dungeon) => dungeon.id === groupName)?.parties || [])];

        // 같은 파티 내에서의 이동인 경우
        if (sourcePartyId && sourcePartyId === targetPartyId) {
          const partyIndex = newParties.findIndex((p) => p.id === targetPartyId);
          if (partyIndex !== -1) {
            const newSlots = [...newParties[partyIndex].slots];
            // 슬롯 교환
            const temp = newSlots[targetSlotIndex];
            newSlots[targetSlotIndex] = character as unknown as PartySlot;
            newSlots[Number(sourceSlotIndex)] = temp;
            newParties[partyIndex] = {
              ...newParties[partyIndex],
              slots: newSlots as [PartySlot, PartySlot, PartySlot, PartySlot],
            };
          }
        } else {
          // 다른 파티에서 온 경우 또는 새로운 캐릭터인 경우
          newParties.forEach((party, partyIndex) => {
            if (party.id === targetPartyId) {
              const newSlots = [...party.slots];
              newSlots[targetSlotIndex] = character as unknown as PartySlot;
              newParties[partyIndex] = { ...party, slots: newSlots as [PartySlot, PartySlot, PartySlot, PartySlot] };
            }
            // 원래 파티에서 제거
            if (sourcePartyId && party.id === sourcePartyId) {
              const newSlots = [...party.slots];
              newSlots[Number(sourceSlotIndex)] = 'empty';
              newParties[partyIndex] = { ...party, slots: newSlots as [PartySlot, PartySlot, PartySlot, PartySlot] };
            }
          });
        }
        return prev.map((dungeon) => (dungeon.id === groupName ? { ...dungeon, parties: newParties } : dungeon));
      });
    } catch (error) {
      console.error('캐릭터 데이터 파싱 실패:', error);
    }
  };

  // 파티 제목 변경 처리
  const handlePartyTitleChange = (partyId: string, newTitle: string) => {
    const newParties = dungeons.map((dungeon) => ({
      ...dungeon,
      parties: dungeon.parties.map((party) => (party.id === partyId ? { ...party, title: newTitle } : party)),
    }));
    setDungeons(newParties);
  };

  // 파티 메모 변경 처리
  const handlePartyMemoChange = (partyId: string, newMemo: string) => {
    const newParties = dungeons.map((dungeon) => ({
      ...dungeon,
      parties: dungeon.parties.map((party) => (party.id === partyId ? { ...party, memo: newMemo } : party)),
    }));
    setDungeons(newParties);
  };

  const togglePartyExpand = (partyId: string) => {
    setExpandedPartyId(expandedPartyId === partyId ? null : partyId);
  };

  const openPartyModal = (partyId: string) => {
    setSelectedPartyId(partyId);
  };

  const closePartyModal = () => {
    setSelectedPartyId(null);
  };

  const selectedParty = dungeons.find((dungeon) => dungeon.id === groupName)?.parties.find((p) => p.id === selectedPartyId);

  // 파티그룹(던전) 추가 핸들러
  const handleAddDungeon = (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    if (!newDungeonName.trim()) return;
    setDungeons((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: newDungeonName.trim(),
        parties: [],
      },
    ]);
    setNewDungeonName('');
    setShowAddGroupInput(false);
  };

  // 취소 핸들러
  const handleCancelAddDungeon = () => {
    setNewDungeonName('');
    setShowAddGroupInput(false);
  };

  const handleCharacterSelect = (character: CharacterData) => {
    setSelectedCharacter(character);
    setShowActionSheet(true);
  };

  const handleActionSheetClose = () => {
    setShowActionSheet(false);
    setSelectedCharacter(null);
  };

  if (showPasswordDialog) {
    return (
      <PasswordDialog
        groupName={groupName}
        onSuccess={(groupId) => {
          setShowPasswordDialog(false);
          const currentRecentGroups =
            getLocalStorageItem<{
              recentGroups?: {
                name: string;
                id: string;
                lastVisited: string;
              }[];
            }>('recentGroups')?.recentGroups || [];
          setLocalStorageItem('recentGroups', {
            recentGroups: [
              ...currentRecentGroups,
              {
                name: groupName,
                id: groupId,
                lastVisited: new Date().toISOString(),
              },
            ],
          });
        }}
        onFailure={() => showBoundary(new Error('인증에 실패했습니다.'))}
      />
    );
  }

  return (
    <>
      <Drawer open={isDrawerOpen} groupName={groupName} onToggle={handleToggleDrawer} />
      <PageContainer drawerOpen={isDrawerOpen}>
        <MainContent>
          <Section>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: isMobile ? '12px' : '20px',
                width: '100%',
              }}
            >
              <SectionTitle>파티 구성</SectionTitle>
            </div>
            <KanbanBoard>
              {dungeons.map((dungeon) => (
                <DungeonColumn
                  key={dungeon.id}
                  id={dungeon.id}
                  name={dungeon.name}
                  parties={dungeon.parties}
                  isMobile={isMobile}
                  expandedPartyId={expandedPartyId}
                  onTogglePartyExpand={togglePartyExpand}
                  onPartyTitleChange={handlePartyTitleChange}
                  onPartyMemoChange={handlePartyMemoChange}
                  onAddParty={addPartyToDungeon}
                  onPartyDragStart={handlePartyCardDragStart}
                  onPartyDragEnd={handlePartyCardDragEnd}
                  onPartyDragOver={handlePartyCardDragOver}
                  onPartyDragLeave={handlePartyCardDragLeave}
                  onPartyDrop={handlePartyCardDrop}
                  onCharacterDragStart={handlePartyDragStart}
                  onCharacterDragOver={handleDragOver}
                  onCharacterDragLeave={handleDragLeave}
                  onCharacterDrop={handleDrop}
                  onCharacterSelect={handleCharacterSelect}
                />
              ))}
              <AddDungeonColumn>
                {!showAddGroupInput ? (
                  <AddGroupButton onClick={() => setShowAddGroupInput(true)}>
                    <Plus size={20} /> 파티그룹 추가
                  </AddGroupButton>
                ) : (
                  <AddDungeonForm onSubmit={handleAddDungeon}>
                    <AddDungeonInput
                      type="text"
                      placeholder="파티그룹이름"
                      value={newDungeonName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDungeonName(e.target.value)}
                      maxLength={16}
                      autoFocus
                    />
                    <AddGroupButtonRow>
                      <AddDungeonButton type="submit">추가</AddDungeonButton>
                      <CancelButton type="button" onClick={handleCancelAddDungeon}>
                        취소
                      </CancelButton>
                    </AddGroupButtonRow>
                  </AddDungeonForm>
                )}
              </AddDungeonColumn>
            </KanbanBoard>
          </Section>

          <Section style={{ marginTop: '20px' }}>
            <CharacterSearch onCharacterSelect={handleCharacterSelect} onCharacterDragStart={handlePartyDragStart} />
          </Section>

          {selectedPartyId && selectedParty && (
            <PartyModal
              isOpen={true}
              party={selectedParty}
              onClose={closePartyModal}
              onSave={(updatedParty) => {
                setDungeons((prev) =>
                  prev.map((dungeon) => ({
                    ...dungeon,
                    parties: dungeon.parties.map((party) => (party.id === updatedParty.id ? updatedParty : party)),
                  })),
                );
                closePartyModal();
              }}
            />
          )}
          {selectedCharacter && (
            <ActionSheet
              isOpen={showActionSheet}
              title="캐릭터 추가"
              actions={[
                {
                  label: '파티에 추가',
                  onClick: () => {
                    // 파티에 캐릭터 추가 로직
                    handleActionSheetClose();
                  },
                },
                {
                  label: '취소',
                  onClick: handleActionSheetClose,
                },
              ]}
              onClose={handleActionSheetClose}
            />
          )}
        </MainContent>
      </PageContainer>
    </>
  );
}

export default GroupPage;
