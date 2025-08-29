import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useErrorBoundary } from 'react-error-boundary';
import { PasswordDialog } from '../../components/PasswordDialog';
import { useFirebase } from '../../context/FirebaseContext';
import { throttle } from 'es-toolkit';
import { getLocalStorageItem, setLocalStorageItem } from '../../utils/localStorage';
import { Party, PartySlot, CharacterData, Group, Dungeon } from '../../types/types';
import { Plus } from 'lucide-react';
import { Drawer } from '../../components/Drawer';
import { DungeonColumn } from '../../components/DungeonColumn';
import { PartyModal } from '../../components/PartyModal';
import { CharacterDetailModal } from '../../components/CharacterDetailModal';
import { DraggableCharacterSearch } from '../../components/DraggableCharacterSearch';
import { SaveFab } from '../../components/SaveFab';
import { useUndoRedo } from '../../hooks/useUndoRedo';
import { v4 as uuidv4 } from 'uuid';
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
} from './styles';

import { Toast } from '../../components/Toast';
import { getCharacterDataFromDragEvent, setCharacterDragData } from './utils';
import { getDundamData } from '../../api/dundam';
import { DUNDAM_UPDATE_INTERVAL } from '../../consts/group.const';
import { useGroupInfo } from '../../context/GroupInfoContext';

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

export function GroupPage() {
  const { groupName } = useParams<{ groupName: string }>();
  const [showPasswordDialog, setShowPasswordDialog] = useState(isExistGroupLoginData(groupName));
  const { group, setGroup } = useGroupInfo();
  const [dungeons, setDungeons] = useState<Dungeon[]>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [expandedPartyId, setExpandedPartyId] = useState<string | null>(null);
  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(null);
  const [showAddGroupInput, setShowAddGroupInput] = useState(false);
  const [newDungeonName, setNewDungeonName] = useState('');
  const { showBoundary } = useErrorBoundary();
  const { writeData, readData, subscribeToData } = useFirebase();
  const [toastMessage, setToastMessage] = useState('');
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [isDraggableSearchOpen, setIsDraggableSearchOpen] = useState(false);
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(true);
  const [lastSavedTime, setLastSavedTime] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState({ current: 0, total: 0 });

  // Undo/Redo hook 사용
  const { canUndo, canRedo, saveSnapshot, undo, redo, clearHistory } = useUndoRedo(groupName || '', 30);

  // 자동저장 설정을 로컬스토리지에서 불러오기
  useEffect(() => {
    if (!groupName) return;

    const savedAutoSaveSetting = localStorage.getItem(`autoSave_${groupName}`);
    if (savedAutoSaveSetting !== null) {
      setIsAutoSaveEnabled(JSON.parse(savedAutoSaveSetting));
    }
  }, [groupName]);

  // 자동저장 설정이 변경될 때 로컬스토리지에 저장
  const handleToggleAutoSave = useCallback(
    (newValue: boolean) => {
      setIsAutoSaveEnabled(newValue);
      if (groupName) {
        localStorage.setItem(`autoSave_${groupName}`, JSON.stringify(newValue));
      }
    },
    [groupName],
  );

  // Drawer 토글 함수
  const handleToggleDrawer = useCallback(() => {
    setIsDrawerOpen((prev) => !prev);
  }, []);

  const FETCH_OFFSET = 1500; // 1.5초 간격
  const BATCH_SIZE = 3; // 한 번에 처리할 모험단 수

  const handleUpdateGroupCharacters = async () => {
    const lastDundamUpdatedAt = group?.lastDundamUpdatedAt;

    // 로컬 개발 환경에서는 시간 제한 없음
    if (process.env.NODE_ENV === 'development') {
      console.debug('!!DEBUG 개발 환경: 업데이트 시간 제한 비활성화');
    } else if (lastDundamUpdatedAt && new Date(lastDundamUpdatedAt).getTime() + DUNDAM_UPDATE_INTERVAL > Date.now()) {
      return alert('그룹 전체 업데이트는 3분에 한번만 가능합니다.');
    }

    const needUpdateAdventures = Object.entries(
      (group?.dungeons ?? [])
        .flatMap((dungeon) => dungeon.parties)
        .flatMap((party) => party.slots)
        .filter((slot): slot is CharacterData => slot !== 'empty')
        .reduce<Record<string, CharacterData[]>>((acc, character) => {
          const key = character.adventureName;
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(character);
          return acc;
        }, {}),
    ).map(([adventureName, characters]) => ({
      adventureName,
      characters: [...new Set(characters.map((char) => char.name))],
    }));

    // 업데이트 시작
    setIsUpdating(true);
    setUpdateProgress({ current: 0, total: needUpdateAdventures.length });

    const updatedAdventures: Array<{ adventureName: string; characters: CharacterData[] }> = [];

    // 배치 단위로 처리
    for (let i = 0; i < needUpdateAdventures.length; i += BATCH_SIZE) {
      const batch = needUpdateAdventures.slice(i, i + BATCH_SIZE);
      console.debug(`!!DEBUG 배치 처리 시작: ${i / BATCH_SIZE + 1}번째 배치 (${batch.length}개 모험단)`);

      // 현재 배치의 모험단들을 병렬로 처리
      const batchPromises = batch.map(async ({ adventureName }) => {
        try {
          console.debug(`!!DEBUG 모험단 업데이트 시작: ${adventureName}`);
          const data = await getDundamData({ name: adventureName, type: 'adventure' });
          console.debug(`!!DEBUG 모험단 업데이트 완료: ${adventureName}`);
          return {
            adventureName,
            characters: data.characters,
          };
        } catch (error) {
          console.error('!!DEBUG 모험단 업데이트 실패:', adventureName, error);
          // 실패한 모험단은 빈 배열로 반환하여 전체 동기화가 중단되지 않도록 함
          return {
            adventureName,
            characters: [],
          };
        }
      });

      // 현재 배치의 모든 모험단이 완료될 때까지 대기
      const batchResults = await Promise.all(batchPromises);
      updatedAdventures.push(...batchResults);

      // 진행률 업데이트
      const currentProgress = Math.min(i + BATCH_SIZE, needUpdateAdventures.length);
      setUpdateProgress({ current: currentProgress, total: needUpdateAdventures.length });

      console.debug(`!!DEBUG 배치 처리 완료: ${i / BATCH_SIZE + 1}번째 배치 (${currentProgress}/${needUpdateAdventures.length})`);

      // 마지막 배치가 아닌 경우에만 대기
      if (i + BATCH_SIZE < needUpdateAdventures.length) {
        console.debug(`!!DEBUG ${FETCH_OFFSET}ms 대기 후 다음 배치 처리`);
        await new Promise((resolve) => setTimeout(resolve, FETCH_OFFSET));
      }
    }

    // 업데이트 완료
    setIsUpdating(false);
    setUpdateProgress({ current: 0, total: 0 });

    if (!group) return;

    // 업데이트된 모험단 데이터를 기반으로 새로운 그룹 객체 생성
    const updatedGroup: Group = {
      ...group,
      dungeons: group.dungeons.map((dungeon) => ({
        ...dungeon,
        parties: dungeon.parties.map((party) => ({
          ...party,
          slots: party.slots.map((slot) => {
            if (slot === 'empty') return slot;

            // 현재 슬롯의 모험단에 해당하는 업데이트된 데이터 찾기
            const needUpdateAdventure = updatedAdventures.find((adventure) => adventure.adventureName === slot.adventureName);

            if (!needUpdateAdventure) return slot;

            // 업데이트된 모험단의 캐릭터 데이터 찾기
            const updatedCharacter = needUpdateAdventure.characters.find((char) => char.key === slot.key);

            if (!updatedCharacter) return slot;

            // 캐릭터 데이터 업데이트
            return {
              ...slot,
              ...updatedCharacter,
            };
          }),
        })),
      })),
    };

    // 그룹 업데이트
    setGroup({
      ...updatedGroup,
      lastDundamUpdatedAt: new Date().toISOString(),
    });
    setDungeons(updatedGroup.dungeons);
  };

  // Undo 처리 함수
  const handleUndo = useCallback(() => {
    if (!canUndo) return;

    const previousDungeons = undo();
    if (previousDungeons) {
      // undo/redo 플래그 설정
      sessionStorage.setItem(`undoRedo_${groupName}_isUndoRedo`, 'true');
      setDungeons(previousDungeons);
      console.log('!!DEBUG Undo 실행');
    }
  }, [canUndo, undo, groupName]);

  // Redo 처리 함수
  const handleRedo = useCallback(() => {
    if (!canRedo) return;

    const nextDungeons = redo();
    if (nextDungeons) {
      // undo/redo 플래그 설정
      sessionStorage.setItem(`undoRedo_${groupName}_isUndoRedo`, 'true');
      setDungeons(nextDungeons);
      console.log('!!DEBUG Redo 실행');
    }
  }, [canRedo, redo, groupName]);

  // 자동저장이 꺼져있을 때 텍스트 입력 blur 시 스냅샷 저장
  const handleTextInputBlur = useCallback(() => {
    if (!isAutoSaveEnabled && dungeons.length > 0) {
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
      // undo/redo가 아닌 경우에만 스냅샷 저장
      const isUndoRedo = sessionStorage.getItem(`undoRedo_${groupName}_isUndoRedo`);
      if (!isUndoRedo) {
        saveSnapshot(validatedDungeons);
      } else {
        sessionStorage.removeItem(`undoRedo_${groupName}_isUndoRedo`);
      }
    }
  }, [isAutoSaveEnabled, dungeons, saveSnapshot, groupName]);

  // 키보드 단축키 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

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
    async (groupName: string, dungeons: Dungeon[]) => {
      try {
        setIsSaving(true);
        await writeData(`groups/${groupName}/dungeons`, dungeons);
        const now = new Date();
        const formattedTime = now.toISOString().slice(0, 19).replace('T', ' ');
        setLastSavedTime(formattedTime);
        console.log('!!DEBUG 자동저장 완료:', formattedTime);
        setTimeout(() => setIsSaving(false), 1000);
      } catch (error) {
        console.error('던전 데이터 저장 실패:', error);
        setIsSaving(false);
      }
    },
    [writeData],
  );

  // 파티 데이터 저장을 위한 throttle 함수 (드래그 앤 드롭)
  const savePartyDataThrottled = useCallback(
    throttle(async (groupName: string, dungeons: Dungeon[]) => {
      try {
        setIsSaving(true);
        await writeData(`groups/${groupName}/dungeons`, dungeons);
        const now = new Date();
        const formattedTime = now.toISOString().slice(0, 19).replace('T', ' ');
        setLastSavedTime(formattedTime);
        console.log('!!DEBUG 자동저장 완료:', formattedTime);
        setTimeout(() => setIsSaving(false), 1000);
      } catch (error) {
        console.error('던전 데이터 저장 실패:', error);
        setIsSaving(false);
      }
    }, 2000),
    [writeData],
  );

  // 수동 저장 함수
  const handleManualSave = useCallback(async () => {
    if (!groupName || !dungeons.length) return;

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

    try {
      setIsSaving(true);
      await writeData(`groups/${groupName}/dungeons`, validatedDungeons);
      const now = new Date();
      const formattedTime = now.toISOString().slice(0, 19).replace('T', ' ');
      setLastSavedTime(formattedTime);
      sessionStorage.setItem(`lastSavedDungeons_${groupName}`, JSON.stringify(validatedDungeons));
      setToastMessage('저장되었습니다.');
      setIsToastVisible(true);
      setTimeout(() => setIsToastVisible(false), 2000);
      console.log('!!DEBUG 수동저장 완료:', formattedTime);
      setTimeout(() => setIsSaving(false), 1000);
    } catch (error) {
      console.error('수동 저장 실패:', error);
      setToastMessage('저장에 실패했습니다.');
      setIsToastVisible(true);
      setTimeout(() => setIsToastVisible(false), 2000);
      setIsSaving(false);
    }
  }, [groupName, dungeons, writeData]);

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
    const lastSavedData = sessionStorage.getItem(`lastSavedDungeons_${groupName}`);
    const currentData = JSON.stringify(validatedDungeons);

    if (lastSavedData !== currentData) {
      sessionStorage.setItem(`lastSavedDungeons_${groupName}`, currentData);

      // 자동저장이 켜져있을 때만 파이어베이스에 저장
      if (isAutoSaveEnabled) {
        // 드래그 앤 드롭으로 인한 변경인 경우 throttle 사용
        if (document.querySelector('.dragging')) {
          savePartyDataThrottled(groupName, validatedDungeons);
        } else {
          // 일반적인 변경(텍스트 입력 등)의 경우 debounce 사용
          savePartyDataDebounced(groupName, validatedDungeons);
        }
      }

      // 스냅샷 저장 (자동저장 설정과 관계없이, undo/redo가 아닌 경우에만)
      const isUndoRedo = sessionStorage.getItem(`undoRedo_${groupName}_isUndoRedo`);
      if (!isUndoRedo) {
        saveSnapshot(validatedDungeons);
      } else {
        sessionStorage.removeItem(`undoRedo_${groupName}_isUndoRedo`);
      }
    }
  }, [dungeons, groupName, isAutoSaveEnabled, savePartyDataDebounced, savePartyDataThrottled, saveSnapshot]);

  // 파티 데이터 초기 로드 및 리얼타임 구독
  useEffect(() => {
    if (!groupName) return;

    const loadGroupData = async () => {
      try {
        const data = await readData(`groups/${groupName}`);
        if (data) {
          const validatedGroup = data as Group;
          setGroup(validatedGroup);
        }
      } catch (error) {
        console.error('그룹 데이터 로드 실패:', error);
      }
    };

    const loadDungeonData = async () => {
      try {
        const data = await readData(`groups/${groupName}/dungeons`);
        if (data) {
          const validatedDungeons = (data as unknown as Dungeon[]).map((dungeon) => ({
            ...dungeon,
            parties: (dungeon.parties || []).map((party) => ({
              ...party,
              slots:
                Array.isArray(party.slots) && party.slots.length === 4
                  ? party.slots.map((slot: PartySlot) => (slot === null ? 'empty' : slot))
                  : (Array(4).fill('empty') as [PartySlot, PartySlot, PartySlot, PartySlot]),
            })),
          })) as Dungeon[];

          setDungeons(validatedDungeons);
          sessionStorage.setItem(`lastSavedDungeons_${groupName}`, JSON.stringify(validatedDungeons));
          // 초기 로드 시 스냅샷 저장 (undo/redo가 아닌 경우에만)
          const isUndoRedo = sessionStorage.getItem(`undoRedo_${groupName}_isUndoRedo`);
          if (!isUndoRedo) {
            saveSnapshot(validatedDungeons);
          } else {
            sessionStorage.removeItem(`undoRedo_${groupName}_isUndoRedo`);
          }
        } else {
          setDungeons([]);
        }
      } catch (error) {
        console.error('던전 데이터 로드 실패:', error);
        setDungeons([]);
      }
    };

    // 초기 데이터 로드
    loadDungeonData();
    loadGroupData();

    // 리얼타임 구독 설정
    const unsubscribe = subscribeToData(`groups/${groupName}/dungeons`, (data) => {
      if (data) {
        const validatedDungeons = (data as unknown as Dungeon[]).map((dungeon) => ({
          ...dungeon,
          parties: (dungeon.parties || []).map((party) => ({
            ...party,
            slots:
              Array.isArray(party.slots) && party.slots.length === 4
                ? party.slots.map((slot: PartySlot) => (slot === null ? 'empty' : slot))
                : (Array(4).fill('empty') as [PartySlot, PartySlot, PartySlot, PartySlot]),
          })),
        })) as Dungeon[];

        setDungeons(validatedDungeons);
        sessionStorage.setItem(`lastSavedDungeons_${groupName}`, JSON.stringify(validatedDungeons));
        // 리얼타임 업데이트 시 스냅샷 저장 (undo/redo가 아닌 경우에만)
        const isUndoRedo = sessionStorage.getItem(`undoRedo_${groupName}_isUndoRedo`);
        if (!isUndoRedo) {
          saveSnapshot(validatedDungeons);
        } else {
          sessionStorage.removeItem(`undoRedo_${groupName}_isUndoRedo`);
        }
      }
    });

    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      unsubscribe();
    };
  }, [groupName, readData, subscribeToData]);

  // 드래그 앤 드롭으로 인한 파티 순서 변경 처리
  const handlePartyOrderChange = useCallback(
    (newParties: Party[]) => {
      setDungeons((prev) => {
        const newDungeons = prev.map((dungeon) => (dungeon.id === groupName ? { ...dungeon, parties: newParties } : dungeon));

        if (groupName) {
          savePartyDataThrottled(groupName, newDungeons);
        }

        return newDungeons;
      });
    },
    [groupName, savePartyDataThrottled],
  );

  const addPartyToDungeon = (dungeonId: string) => {
    const newParty: Party = {
      id: uuidv4(),
      title: '새 파티',
      slots: ['empty', 'empty', 'empty', 'empty'] as [PartySlot, PartySlot, PartySlot, PartySlot],
      memo: '',
      isCompleted: false,
    };

    setDungeons((prev) => prev.map((dungeon) => (dungeon.id === dungeonId ? { ...dungeon, parties: [...dungeon.parties, newParty] } : dungeon)));
  };

  const handleCharacterDragStart = (e: React.DragEvent<HTMLDivElement>, character: CharacterData) => {
    e.stopPropagation();
    e.dataTransfer.setData('character', JSON.stringify(character));
    e.dataTransfer.setData('type', 'character');
    e.currentTarget.classList.add('dragging');
  };

  const handlePartySlotDragStart = (e: React.DragEvent<HTMLDivElement>, partyId: string, slotIndex: number, character: PartySlot) => {
    e.stopPropagation();
    if (character === 'empty') return;

    const characterData = character as CharacterData;
    setCharacterDragData(e, characterData, partyId, slotIndex);
    e.currentTarget.classList.add('dragging');
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

    // 파티 드래그인지 명확하게 체크
    const isPartyDrag = e.dataTransfer.types.includes('party');

    if (isPartyDrag) {
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

    // 파티 드래그인지 우선 확인 (party 타입이 있으면 파티 드래그로 처리)
    const isPartyDrag = e.dataTransfer.types.includes('party');
    const type = e.dataTransfer.getData('type');

    if (isPartyDrag && type === 'party') {
      const partyData = e.dataTransfer.getData('party');
      if (!partyData) return;

      try {
        const sourceParty = JSON.parse(partyData) as Party;

        // 소스 파티와 타겟 파티가 속한 dungeon 찾기
        const sourceDungeon = dungeons.find((dungeon) => dungeon.parties.some((party) => party.id === sourceParty.id));
        const targetDungeon = dungeons.find((dungeon) => dungeon.parties.some((party) => party.id === targetParty.id));

        if (!sourceDungeon || !targetDungeon) {
          console.error('!!DEBUG sourceDungeon 또는 targetDungeon을 찾을 수 없음', { sourceParty, targetParty });
          return;
        }

        // 같은 dungeon 내에서만 순서 변경 가능
        if (sourceDungeon.id === targetDungeon.id) {
          const newParties = [...sourceDungeon.parties];
          const sourceIndex = newParties.findIndex((p) => p.id === sourceParty.id);
          const targetIndex = newParties.findIndex((p) => p.id === targetParty.id);

          if (sourceIndex !== -1 && targetIndex !== -1) {
            [newParties[sourceIndex], newParties[targetIndex]] = [newParties[targetIndex], newParties[sourceIndex]];

            setDungeons((prev) => prev.map((dungeon) => (dungeon.id === sourceDungeon.id ? { ...dungeon, parties: newParties } : dungeon)));

            // 데이터 저장
            if (sourceDungeon.id) {
              savePartyDataThrottled(sourceDungeon.id, dungeons);
            }
          }
        } else {
          console.debug('!!DEBUG 다른 dungeon 간 파티 이동은 지원하지 않음', {
            sourceDungeon: sourceDungeon.id,
            targetDungeon: targetDungeon.id,
          });
        }
      } catch (error) {
        console.error('!!DEBUG 파티 데이터 파싱 실패:', error);
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

  const handleDrop = (e: React.DragEvent, targetDungeonId: string, targetPartyId: string, targetSlotIndex: number) => {
    e.preventDefault();

    try {
      const target = e.currentTarget as HTMLDivElement;
      target.classList.remove('drag-over');

      const type = e.dataTransfer.getData('type');
      if (type !== 'character') return;
      const character = getCharacterDataFromDragEvent(e);
      const sourcePartyId = e.dataTransfer.getData('sourcePartyId');
      const sourceSlotIndex = e.dataTransfer.getData('sourceSlotIndex');

      setDungeons((prev) => {
        const newDungeons = [...prev];
        const targetDungeon = newDungeons.find((dungeon) => String(dungeon.id) === String(targetDungeonId));
        const sourceDungeon = sourcePartyId ? newDungeons.find((dungeon) => dungeon.parties.some((party) => party.id === sourcePartyId)) : null;

        if (!targetDungeon) {
          console.error('Target dungeon not found:', targetDungeonId);
          return prev;
        }

        const targetParty = targetDungeon.parties.find((party) => party.id === targetPartyId);
        if (!targetParty) {
          console.error('Target party not found:', targetPartyId);
          return prev;
        }

        // 같은 파티 내에서의 이동인 경우
        if (sourcePartyId && sourcePartyId === targetPartyId) {
          const newSlots = [...targetParty.slots];
          const sourceCharacter = newSlots[Number(sourceSlotIndex)];
          const targetCharacter = newSlots[targetSlotIndex];

          // 인덱스로 캐릭터를 찾아 교환
          newSlots[targetSlotIndex] = sourceCharacter;
          newSlots[Number(sourceSlotIndex)] = targetCharacter;

          targetParty.slots = newSlots as [PartySlot, PartySlot, PartySlot, PartySlot];
        } else {
          // 다른 파티로 이동하는 경우
          const newSlots = [...targetParty.slots];
          if (character) {
            newSlots[targetSlotIndex] = character;
          }
          targetParty.slots = newSlots as [PartySlot, PartySlot, PartySlot, PartySlot];

          // 원래 파티에서 제거
          if (sourcePartyId && sourceDungeon) {
            const sourceParty = sourceDungeon.parties.find((party) => party.id === sourcePartyId);
            if (sourceParty) {
              const sourceSlots = [...sourceParty.slots];
              sourceSlots[Number(sourceSlotIndex)] = 'empty';
              sourceParty.slots = sourceSlots as [PartySlot, PartySlot, PartySlot, PartySlot];
            }
          }
        }

        return newDungeons;
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
        id: uuidv4(),
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

  const handleDungeonNameChange = (dungeonId: string, newName: string) => {
    setDungeons((prev) => prev.map((dungeon) => (dungeon.id === dungeonId ? { ...dungeon, name: newName } : dungeon)));
  };

  const handlePartyCompletedChange = (partyId: string, isCompleted: boolean) => {
    setDungeons((prev) =>
      prev.map((dungeon) => ({
        ...dungeon,
        parties: dungeon.parties.map((party) => (party.id === partyId ? { ...party, isCompleted } : party)),
      })),
    );
  };

  const handleCharacterDelete = useCallback((partyId: string, slotIndex: number) => {
    setDungeons((prev) => {
      const newDungeons = prev.map((dungeon) => ({
        ...dungeon,
        parties: dungeon.parties.map((party) => {
          if (party.id === partyId) {
            const newSlots = [...party.slots];
            newSlots[slotIndex] = 'empty';
            return { ...party, slots: newSlots as [PartySlot, PartySlot, PartySlot, PartySlot] };
          }
          return party;
        }),
      }));
      return newDungeons;
    });
  }, []);

  const handlePartyDelete = useCallback((partyId: string) => {
    setDungeons((prev) => {
      const newDungeons = prev.map((dungeon) => ({
        ...dungeon,
        parties: dungeon.parties.filter((party) => party.id !== partyId),
      }));
      return newDungeons;
    });
  }, []);

  const handleDungeonDelete = useCallback(
    (dungeonId: string) => {
      const dungeon = dungeons.find((d) => d.id === dungeonId);
      if (!dungeon) return;

      const confirmMessage = `"${dungeon.name}" 파티그룹을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`;

      if (window.confirm(confirmMessage)) {
        setDungeons((prev) => prev.filter((dungeon) => dungeon.id !== dungeonId));
      }
    },
    [dungeons],
  );

  const handleDungeonDragStart = (e: React.DragEvent<HTMLDivElement>, dungeon: Dungeon) => {
    // 파티 드래그인 경우 dungeon 드래그를 무시
    if (e.dataTransfer.types.includes('party')) {
      return;
    }

    e.dataTransfer.setData('dungeon', JSON.stringify(dungeon));
    e.dataTransfer.setData('type', 'dungeon');
    e.currentTarget.classList.add('dragging');
  };

  const handleDungeonDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('dragging');
  };

  const handleDungeonDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLDivElement;

    // 파티 드래그인 경우 dungeon 드래그 오버를 무시
    if (e.dataTransfer.types.includes('party')) {
      return;
    }

    const type = e.dataTransfer.types.includes('dungeon') ? 'dungeon' : 'character';

    if (type === 'dungeon') {
      target.classList.add('drag-over');
    }
  };

  const handleDungeonDragLeave = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLDivElement;
    target.classList.remove('drag-over');
  };

  const handleDungeonDrop = (e: React.DragEvent, targetDungeon: Dungeon) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLDivElement;
    target.classList.remove('drag-over');

    // 파티 드래그인지 우선 확인 (party 타입이 있으면 파티 드래그로 처리하지 않음)
    const isPartyDrag = e.dataTransfer.types.includes('party');
    const type = e.dataTransfer.getData('type');

    if (isPartyDrag || type !== 'dungeon') return;

    const dungeonData = e.dataTransfer.getData('dungeon');
    if (!dungeonData) return;

    try {
      const sourceDungeon = JSON.parse(dungeonData) as Dungeon;
      const sourceIndex = dungeons.findIndex((d) => d.id === sourceDungeon.id);
      const targetIndex = dungeons.findIndex((d) => d.id === targetDungeon.id);

      if (sourceIndex !== -1 && targetIndex !== -1) {
        const newDungeons = [...dungeons];
        [newDungeons[sourceIndex], newDungeons[targetIndex]] = [newDungeons[targetIndex], newDungeons[sourceIndex]];
        setDungeons(newDungeons);
      }
    } catch (error) {
      console.error('던전 데이터 파싱 실패:', error);
    }
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
      <Drawer
        open={isDrawerOpen}
        groupName={groupName || ''}
        onToggle={handleToggleDrawer}
        onUpdateGroupCharacters={handleUpdateGroupCharacters}
        onOpenCharacterSearch={() => setIsDraggableSearchOpen(true)}
        isUpdating={isUpdating}
        updateProgress={updateProgress}
      />
      <PageContainer drawerOpen={isDrawerOpen}>
        <MainContent style={{ backgroundColor: '#f5f5f5' }} data-main-content>
          <Section style={{ height: 'fit-content', minHeight: 'auto' }}>
            <SectionTitle>파티 구성</SectionTitle>

            <KanbanBoard>
              {dungeons.map((dungeon) => (
                <DungeonColumn
                  key={dungeon.id}
                  id={dungeon.id}
                  name={dungeon.name}
                  parties={dungeon.parties}
                  isMobile={isMobile}
                  expandedPartyId={expandedPartyId}
                  groupConfig={group?.config || { id: '', name: '', createdAt: '', updatedAt: '', tags: [], multiAccounts: [] }}
                  multiAccounts={group?.config?.multiAccounts || []}
                  onTogglePartyExpand={togglePartyExpand}
                  onPartyTitleChange={handlePartyTitleChange}
                  onPartyMemoChange={handlePartyMemoChange}
                  onPartyCompletedChange={handlePartyCompletedChange}
                  onAddParty={addPartyToDungeon}
                  onPartyDragStart={handlePartyCardDragStart}
                  onPartyDragEnd={handlePartyCardDragEnd}
                  onPartyDragOver={handlePartyCardDragOver}
                  onPartyDragLeave={handlePartyCardDragLeave}
                  onPartyDrop={handlePartyCardDrop}
                  onCharacterDragStart={handlePartySlotDragStart}
                  onCharacterDragOver={handleDragOver}
                  onCharacterDragLeave={handleDragLeave}
                  onCharacterDrop={handleDrop}
                  onDungeonNameChange={handleDungeonNameChange}
                  onCharacterDelete={handleCharacterDelete}
                  onPartyDelete={handlePartyDelete}
                  onDungeonDelete={handleDungeonDelete}
                  onDragStart={(e) => handleDungeonDragStart(e, dungeon)}
                  onDragEnd={handleDungeonDragEnd}
                  onDragOver={handleDungeonDragOver}
                  onDragLeave={handleDungeonDragLeave}
                  onDrop={(e) => handleDungeonDrop(e, dungeon)}
                  onTextInputBlur={handleTextInputBlur}
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
        </MainContent>
      </PageContainer>
      <CharacterDetailModal />
      <DraggableCharacterSearch
        isOpen={isDraggableSearchOpen}
        onClose={() => setIsDraggableSearchOpen(false)}
        groupName={groupName}
        onCharacterDragStart={handleCharacterDragStart}
      />
      <Toast message={toastMessage} isVisible={isToastVisible} />

      <SaveFab
        isAutoSaveEnabled={isAutoSaveEnabled}
        isSaving={isSaving}
        lastSavedTime={lastSavedTime}
        onToggleAutoSave={() => handleToggleAutoSave(!isAutoSaveEnabled)}
        onManualSave={handleManualSave}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />
    </>
  );
}

export default GroupPage;
