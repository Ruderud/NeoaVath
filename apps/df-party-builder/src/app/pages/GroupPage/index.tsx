import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useErrorBoundary } from 'react-error-boundary';
import styled from '@emotion/styled';
import { PasswordDialog } from '../../components/PasswordDialog';
import { useFirebase } from '../../context/FirebaseContext';
import { throttle } from 'es-toolkit';
import { getLocalStorageItem, setLocalStorageItem } from '../../utils/localStorage';
import { SideMenu } from './components/SideMenu';
import { CharacterCard } from '../../components/CharacterCard';
import type { Party, PartySlot, CharacterData } from '../../types/types';

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

function GroupPageContent() {
  const { groupName } = useParams<{ groupName: string }>();
  const [showPasswordDialog, setShowPasswordDialog] = useState(isExistGroupLoginData(groupName));
  const [parties, setParties] = useState<Party[]>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { showBoundary } = useErrorBoundary();
  const { writeData, readData } = useFirebase();

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
    if (!groupName || !parties.length) return;

    // 파티 데이터 저장 전 slots 배열 검증 및 수정
    const validatedParties = parties.map((party) => ({
      ...party,
      slots:
        party.slots?.length === 4
          ? party.slots.map((slot) => (slot === null ? 'empty' : slot))
          : (Array(4).fill('empty') as [PartySlot, PartySlot, PartySlot, PartySlot]),
    })) as Party[];

    // 마지막 저장 시점과 현재 시점의 데이터 비교
    const lastSavedData = sessionStorage.getItem(`lastSavedParties_${groupName}`);
    const currentData = JSON.stringify(validatedParties);

    if (lastSavedData !== currentData) {
      sessionStorage.setItem(`lastSavedParties_${groupName}`, currentData);
      savePartyDataDebounced(groupName, validatedParties);
    }
  }, [parties, groupName, savePartyDataDebounced]);

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

          setParties(validatedParties);
          sessionStorage.setItem(`lastSavedParties_${groupName}`, JSON.stringify(validatedParties));
        } else {
          setParties([]);
        }
      } catch (error) {
        console.error('파티 데이터 로드 실패:', error);
        setParties([]);
      }
    };

    loadPartyData();
  }, [groupName, readData]);

  // 드래그 앤 드롭으로 인한 파티 순서 변경 처리
  const handlePartyOrderChange = useCallback(
    (newParties: Party[]) => {
      setParties(newParties);
      if (groupName) {
        savePartyDataThrottled(groupName, newParties);
      }
    },
    [groupName, savePartyDataThrottled],
  );

  const addParty = () => {
    const newParty: Party = {
      id: Date.now().toString(),
      title: '새 파티',
      slots: Array(4).fill('empty') as [PartySlot, PartySlot, PartySlot, PartySlot],
      memo: '',
    };
    setParties([...parties, newParty]);
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

        const newParties = [...parties];
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

    const characterData = e.dataTransfer.getData('character');
    const sourcePartyId = e.dataTransfer.getData('sourcePartyId');
    const sourceSlotIndex = e.dataTransfer.getData('sourceSlotIndex');

    if (!characterData) return;

    try {
      const character = JSON.parse(characterData) as CharacterData;

      setParties((parties) => {
        const newParties = [...parties];

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
          parties.forEach((party, partyIndex) => {
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
        return newParties;
      });
    } catch (error) {
      console.error('캐릭터 데이터 파싱 실패:', error);
    }
  };

  // 파티 제목 변경 처리
  const handlePartyTitleChange = (partyId: string, newTitle: string) => {
    const newParties = parties.map((p) => (p.id === partyId ? { ...p, title: newTitle } : p));
    setParties(newParties);
  };

  // 파티 메모 변경 처리
  const handlePartyMemoChange = (partyId: string, newMemo: string) => {
    const newParties = parties.map((p) => (p.id === partyId ? { ...p, memo: newMemo } : p));
    setParties(newParties);
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
    <MainContent isMobile={isMobile}>
      <Section isMobile={isMobile}>
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
          <Button onClick={addParty} style={{ width: 'auto' }}>
            파티 추가
          </Button>
        </div>
        <PartyContainer isMobile={isMobile}>
          {parties.map((party) => (
            <PartyCard
              key={party.id}
              isMobile={isMobile}
              draggable={!isMobile}
              onDragStart={!isMobile ? (e) => handlePartyCardDragStart(e, party) : undefined}
              onDragEnd={!isMobile ? handlePartyCardDragEnd : undefined}
              onDragOver={!isMobile ? handlePartyCardDragOver : undefined}
              onDragLeave={!isMobile ? handlePartyCardDragLeave : undefined}
              onDrop={!isMobile ? (e) => handlePartyCardDrop(e, party) : undefined}
            >
              <PartyHeader isMobile={isMobile}>
                <input type="text" value={party.title} onChange={(e) => handlePartyTitleChange(party.id, e.target.value)} placeholder="파티 제목" />
              </PartyHeader>
              <PartySlots isMobile={isMobile}>
                {party.slots.map((slot, index) => (
                  <PartySlot
                    key={index}
                    isMobile={isMobile}
                    onDragOver={!isMobile ? handleDragOver : undefined}
                    onDragLeave={!isMobile ? handleDragLeave : undefined}
                    onDrop={!isMobile ? (e) => handleDrop(e, party.id, index) : undefined}
                    className={slot === 'empty' ? 'empty' : ''}
                  >
                    {slot !== 'empty' ? (
                      <div
                        draggable={!isMobile}
                        onDragStart={!isMobile ? (e) => handlePartyDragStart(e, party.id, index, slot as CharacterData) : undefined}
                        style={{
                          width: '100%',
                          height: '100%',
                        }}
                      >
                        {isMobile ? (
                          <MobileCharacterCard>
                            <MobileCharacterImage>
                              <img
                                src={`https://img-api.neople.co.kr/df/servers/${(slot as CharacterData).server}/characters/${
                                  (slot as CharacterData).key
                                }?zoom=1`}
                                alt={`${(slot as CharacterData).name} 캐릭터 이미지`}
                                draggable="false"
                              />
                            </MobileCharacterImage>
                            <MobileCharacterInfo>
                              <div className="level">명성 {(slot as CharacterData).level}</div>
                              <div className="name">{(slot as CharacterData).name}</div>
                              <div className="adventure">{(slot as CharacterData).adventureName}</div>
                              {(slot as CharacterData).buffScore ? (
                                <div className="score">버프력 {(slot as CharacterData).buffScore}</div>
                              ) : (slot as CharacterData).ozma ? (
                                <div className="score">랭킹 {(slot as CharacterData).ozma}</div>
                              ) : null}
                            </MobileCharacterInfo>
                          </MobileCharacterCard>
                        ) : (
                          <CharacterCard
                            character={slot as CharacterData}
                            onDragStart={!isMobile ? (e, char) => handlePartyDragStart(e, party.id, index, char) : undefined}
                          />
                        )}
                      </div>
                    ) : (
                      <div>빈 슬롯</div>
                    )}
                  </PartySlot>
                ))}
              </PartySlots>
              <PartyMemo isMobile={isMobile} value={party.memo} onChange={(e) => handlePartyMemoChange(party.id, e.target.value)} placeholder="파티 메모" />
            </PartyCard>
          ))}
        </PartyContainer>
      </Section>
    </MainContent>
  );
}

export function GroupPage() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isMobile) {
    console.log('isMobile', isMobile);
  }

  return (
    <PageContainer isMobile={isMobile}>
      <PageTitle title="그룹 페이지" />
      {!isMobile && <SideMenu />}
      <GroupPageContent />
    </PageContainer>
  );
}

const PageContainer = styled.div<{ isMobile: boolean }>`
  max-width: ${({ isMobile }) => (isMobile ? '100%' : '1600px')};
  margin: 0 auto;
  padding: ${({ isMobile }) => (isMobile ? '0' : '20px')};
  display: grid;
  grid-template-columns: ${({ isMobile }) => (isMobile ? '1fr' : '300px 1fr')};
  gap: ${({ isMobile }) => (isMobile ? '0' : '24px')};
  width: 100%;
`;

const MainContent = styled.div<{ isMobile: boolean }>`
  background: white;
  border-radius: ${({ isMobile }) => (isMobile ? '0' : '8px')};
  padding: ${({ isMobile }) => (isMobile ? '12px' : '24px')};
  border: ${({ isMobile }) => (isMobile ? 'none' : '1px solid #ddd')};
  width: 100%;
  box-sizing: border-box;
`;

const PageTitle = styled.h1`
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
  grid-column: 1 / -1;
`;

const PartyContainer = styled.div<{ isMobile: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${({ isMobile }) => (isMobile ? '12px' : '20px')};
  width: 100%;
`;

const PartyCard = styled.div<{ isMobile: boolean }>`
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: ${({ isMobile }) => (isMobile ? '8px' : '16px')};
  background: #f9f9f9;
  cursor: move;
  transition: all 0.2s;
  width: 100%;
  box-sizing: border-box;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  &.dragging {
    opacity: 0.5;
  }

  &.drag-over {
    border-color: #2196f3;
    background: #e3f2fd;
  }
`;

const PartyHeader = styled.div<{ isMobile: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  width: 100%;

  input {
    padding: 4px 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1.1em;
    width: ${({ isMobile }) => (isMobile ? '100%' : '200px')};
    box-sizing: border-box;
  }
`;

const PartySlots = styled.div<{ isMobile: boolean }>`
  display: flex;
  flex-direction: ${({ isMobile }) => (isMobile ? 'column' : 'row')};
  gap: ${({ isMobile }) => (isMobile ? '8px' : '12px')};
  margin-bottom: ${({ isMobile }) => (isMobile ? '8px' : '12px')};
  justify-content: center;
  width: 100%;
  flex-wrap: ${({ isMobile }) => (isMobile ? 'nowrap' : 'nowrap')};
`;

const PartySlot = styled.div<{ isMobile: boolean }>`
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 4px 6px;
  width: ${({ isMobile }) => (isMobile ? '100%' : 'calc((100% - 36px) / 4)')};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: white;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #2196f3;
    background: #f5f5f5;
  }

  &.empty {
    font-size: 0.95em;
    color: #666;
    padding: ${({ isMobile }) => (isMobile ? '8px' : '12px')};
    aspect-ratio: ${({ isMobile }) => (isMobile ? 'auto' : '3/4')};
    min-height: ${({ isMobile }) => (isMobile ? '80px' : 'auto')};
  }

  &.drag-over {
    border-color: #2196f3;
    background: #e3f2fd;
  }
`;

const PartyMemo = styled.textarea<{ isMobile: boolean }>`
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-height: 60px;
  resize: vertical;
  box-sizing: border-box;
  margin-top: ${({ isMobile }) => (isMobile ? '8px' : '0')};
`;

const Button = styled.button`
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
`;

const Section = styled.div<{ isMobile: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${({ isMobile }) => (isMobile ? '12px' : '16px')};
  width: 100%;
`;

const SectionTitle = styled.h2`
  font-size: 1.2em;
  font-weight: 600;
`;

const MobileCharacterCard = styled.div`
  display: flex;
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  gap: 12px;
  align-items: center;
`;

const MobileCharacterImage = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const MobileCharacterInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;

  .level {
    font-size: 0.9em;
    font-weight: 600;
    color: #2196f3;
  }

  .name {
    font-size: 1em;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .adventure {
    color: #666;
    font-size: 0.85em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .score {
    font-weight: 500;
    color: #e91e63;
    font-size: 0.9em;
  }
`;

export default GroupPage;
