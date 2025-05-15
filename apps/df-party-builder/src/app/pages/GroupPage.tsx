import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ErrorBoundary, useErrorBoundary } from 'react-error-boundary';
import styled from '@emotion/styled';
import { PasswordDialog } from '../components/PasswordDialog';
import { DundamFrame, CharacterData } from '../components/DundamFrame';
import { useFirebase } from '../context/FirebaseContext';
import { debounce, throttle } from 'es-toolkit';
import { get } from 'firebase/database';

const PageContainer = styled.div`
  max-width: 1600px;
  margin: 0 auto;
  padding: 20px;
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 24px;
`;

const SideMenu = styled.div`
  background: white;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #ddd;
  height: fit-content;
  width: 300px;
  position: sticky;
  top: 20px;
  overflow: hidden;
`;

const MainContent = styled.div`
  background: white;
  border-radius: 8px;
  padding: 24px;
  border: 1px solid #ddd;
`;

const PageTitle = styled.h1`
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
  grid-column: 1 / -1;
`;

const Section = styled.section`
  margin-bottom: 32px;
`;

const SectionTitle = styled.h2`
  margin-bottom: 16px;
  font-size: 1.5em;
  color: #333;
`;

const Button = styled.button`
  padding: 8px 16px;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  width: 100%;
  margin-bottom: 12px;

  &:hover {
    background-color: #1976d2;
  }
`;

const PartyContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const PartyCard = styled.div`
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  background: #f9f9f9;
  cursor: move;
  transition: all 0.2s;

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

const PartyHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  input {
    padding: 4px 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1.1em;
    width: 200px;
  }
`;

const PartySlots = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 12px;
`;

const PartySlot = styled.div`
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 12px;
  min-height: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  gap: 8px;

  &:hover {
    border-color: #2196f3;
    background: #f5f5f5;
  }

  &.empty {
    font-size: 0.95em;
    color: #666;
  }

  &.drag-over {
    border-color: #2196f3;
    background: #e3f2fd;
  }

  .character-image {
    width: 120px;
    height: 153px;
    border-radius: 4px;
    overflow: hidden;
    position: relative;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      pointer-events: none;
    }
  }

  .character-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    text-align: center;
    width: 100%;
  }

  .level {
    font-size: 1em;
    font-weight: 600;
    color: #2196f3;
  }

  .name {
    font-size: 0.95em;
    font-weight: 600;
  }

  .adventure {
    color: #666;
    font-size: 0.85em;
  }

  .score {
    margin-top: 2px;
    font-weight: 500;
    color: #e91e63;
    font-size: 0.9em;
  }
`;

const PartyMemo = styled.textarea`
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-height: 60px;
  resize: vertical;
`;

const SearchContainer = styled.div`
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
  width: 100%;

  input[type='text'] {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.9em;
  }

  select {
    padding: 8px;
    border-radius: 4px;
    border: 1px solid #ddd;
    font-size: 0.9em;
    width: 100px;
  }

  .search-row {
    display: flex;
    gap: 8px;
    width: 100%;
  }
`;

const TeamMemberList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
  width: 100%;
  overflow-x: hidden;
`;

interface Party {
  id: string;
  title: string;
  slots: (CharacterData | 'empty')[];
  memo: string;
}

interface TeamMember {
  id: string;
  name: string;
  characters: CharacterData[];
  searchTerm: string;
  shouldSearch: boolean;
  searchType: 'character' | 'adventure';
}

function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/', {
      state: {
        error: error.message,
        lastAttemptedGroup: window.location.pathname.split('/').pop(),
      },
    });
  }, [error, navigate]);

  return null;
}

function GroupPageContent() {
  const { groupName } = useParams<{ groupName: string }>();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [parties, setParties] = useState<Party[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const { showBoundary } = useErrorBoundary();
  const { writeData, readData } = useFirebase();

  // 파티 데이터 저장을 위한 debounce 함수 (텍스트 입력)
  const savePartyDataDebounced = useCallback(
    (groupName: string, parties: Party[]) => {
      debounce((groupName: string, parties: Party[]) => {
        writeData(`groups/${groupName}/parties`, parties);
        console.log('savePartyDataDebounced', groupName, parties);
      }, 1000); // 1초 딜레이
    },
    [writeData]
  );

  // 파티 데이터 저장을 위한 throttle 함수 (드래그 앤 드롭)
  const savePartyDataThrottled = useCallback(
    (groupName: string, parties: Party[]) => {
      throttle((groupName: string, parties: Party[]) => {
        writeData(`groups/${groupName}/parties`, parties);
      }, 2000);
    },
    [writeData]
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
          : Array(4).fill('empty'),
    }));

    // 마지막 저장 시점과 현재 시점의 데이터 비교
    const lastSavedData = sessionStorage.getItem(
      `lastSavedParties_${groupName}`
    );
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
        console.log('data', data);
        if (data) {
          setParties(data);
          sessionStorage.setItem(
            `lastSavedParties_${groupName}`,
            JSON.stringify(data)
          );
        }
      } catch (error) {
        console.error('파티 데이터 로드 실패:', error);
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
    [groupName, savePartyDataThrottled]
  );

  const addParty = () => {
    const newParty: Party = {
      id: Date.now().toString(),
      title: '새 파티',
      slots: Array(4).fill('empty'),
      memo: '',
    };
    setParties([...parties, newParty]);
  };

  const addTeamMember = () => {
    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: '새 팀원',
      characters: [],
      searchTerm: '',
      shouldSearch: false,
      searchType: 'character',
    };
    setTeamMembers([...teamMembers, newMember]);
  };

  const handleCharacterDataUpdate = (
    data: CharacterData[],
    memberId: string
  ) => {
    setTeamMembers((members) =>
      members.map((member) =>
        member.id === memberId
          ? { ...member, characters: [...member.characters, ...data] }
          : member
      )
    );
  };

  const handlePartyDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    partyId: string,
    slotIndex: number,
    character: CharacterData
  ) => {
    e.stopPropagation(); // 파티 카드로의 이벤트 전파 방지
    e.dataTransfer.setData('character', JSON.stringify(character));
    e.dataTransfer.setData('sourcePartyId', partyId);
    e.dataTransfer.setData('sourceSlotIndex', String(slotIndex));
    e.dataTransfer.setData('type', 'character');
  };

  const handlePartyCardDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    party: Party
  ) => {
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
        const sourceIndex = newParties.findIndex(
          (p) => p.id === sourceParty.id
        );
        const targetIndex = newParties.findIndex(
          (p) => p.id === targetParty.id
        );

        if (sourceIndex !== -1 && targetIndex !== -1) {
          [newParties[sourceIndex], newParties[targetIndex]] = [
            newParties[targetIndex],
            newParties[sourceIndex],
          ];
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

  const handleDrop = (
    e: React.DragEvent,
    targetPartyId: string,
    targetSlotIndex: number
  ) => {
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
          const partyIndex = newParties.findIndex(
            (p) => p.id === targetPartyId
          );
          if (partyIndex !== -1) {
            const newSlots = [...newParties[partyIndex].slots];
            // 슬롯 교환
            const temp = newSlots[targetSlotIndex];
            newSlots[targetSlotIndex] = character;
            newSlots[Number(sourceSlotIndex)] = temp;
            newParties[partyIndex] = {
              ...newParties[partyIndex],
              slots: newSlots,
            };
          }
        } else {
          // 다른 파티에서 온 경우 또는 새로운 캐릭터인 경우
          parties.forEach((party, partyIndex) => {
            if (party.id === targetPartyId) {
              const newSlots = [...party.slots];
              newSlots[targetSlotIndex] = character;
              newParties[partyIndex] = { ...party, slots: newSlots };
            }
            // 원래 파티에서 제거
            if (sourcePartyId && party.id === sourcePartyId) {
              const newSlots = [...party.slots];
              newSlots[Number(sourceSlotIndex)] = 'empty';
              newParties[partyIndex] = { ...party, slots: newSlots };
            }
          });
        }
        return newParties;
      });
    } catch (error) {
      console.error('캐릭터 데이터 파싱 실패:', error);
    }
  };

  const handleSearch = (memberId: string, searchName: string) => {
    setTeamMembers((members) =>
      members.map((member) =>
        member.id === memberId
          ? {
              ...member,
              searchTerm: searchName,
              shouldSearch: true,
              characters: [], // 새로운 검색 시 이전 결과 초기화
            }
          : member
      )
    );
  };

  // 파티 제목 변경 처리
  const handlePartyTitleChange = (partyId: string, newTitle: string) => {
    const newParties = parties.map((p) =>
      p.id === partyId ? { ...p, title: newTitle } : p
    );
    setParties(newParties);
  };

  // 파티 메모 변경 처리
  const handlePartyMemoChange = (partyId: string, newMemo: string) => {
    const newParties = parties.map((p) =>
      p.id === partyId ? { ...p, memo: newMemo } : p
    );
    setParties(newParties);
  };

  useEffect(() => {
    if (!groupName) {
      showBoundary(new Error('잘못된 그룹 접근입니다.'));
      return;
    }

    const isAuthenticated = sessionStorage.getItem(`auth_${groupName}`);
    if (!isAuthenticated) {
      setShowPasswordDialog(true);
    }
  }, [groupName, showBoundary]);

  if (showPasswordDialog) {
    return (
      <PasswordDialog
        groupName={groupName}
        onSuccess={() => setShowPasswordDialog(false)}
        onFailure={() => showBoundary(new Error('인증에 실패했습니다.'))}
      />
    );
  }

  return (
    <PageContainer>
      <PageTitle>그룹 페이지</PageTitle>

      <SideMenu>
        <SectionTitle>팀 관리</SectionTitle>
        <Button onClick={addTeamMember}>팀원 추가</Button>
        <TeamMemberList>
          {teamMembers.map((member) => (
            <div key={member.id}>
              <SearchContainer>
                <input
                  type="text"
                  value={member.name}
                  onChange={(e) =>
                    setTeamMembers((members) =>
                      members.map((m) =>
                        m.id === member.id ? { ...m, name: e.target.value } : m
                      )
                    )
                  }
                  placeholder="팀원 이름"
                  style={{ marginBottom: '8px' }}
                />
                <div className="search-row">
                  <select
                    value={member.searchType}
                    onChange={(e) =>
                      setTeamMembers((members) =>
                        members.map((m) =>
                          m.id === member.id
                            ? {
                                ...m,
                                searchType: e.target.value as
                                  | 'character'
                                  | 'adventure',
                              }
                            : m
                        )
                      )
                    }
                  >
                    <option value="character">캐릭터</option>
                    <option value="adventure">모험단</option>
                  </select>
                  <input
                    type="text"
                    placeholder={`${
                      member.searchType === 'character'
                        ? '캐릭터명'
                        : '모험단명'
                    } 검색`}
                    value={member.searchTerm}
                    onChange={(e) => {
                      const searchName = e.target.value;
                      setTeamMembers((members) =>
                        members.map((m) =>
                          m.id === member.id
                            ? {
                                ...m,
                                searchTerm: searchName,
                                shouldSearch: false,
                              }
                            : m
                        )
                      );
                    }}
                    style={{ flex: 1 }}
                  />
                  <Button
                    onClick={() => handleSearch(member.id, member.searchTerm)}
                    style={{ width: 'auto', margin: 0 }}
                  >
                    검색
                  </Button>
                </div>
              </SearchContainer>
              <DundamFrame
                characterName={member.searchTerm}
                shouldSearch={member.shouldSearch}
                searchType={member.searchType}
                onCharacterDataUpdate={(data) =>
                  handleCharacterDataUpdate(data, member.id)
                }
              />
            </div>
          ))}
        </TeamMemberList>
      </SideMenu>

      <MainContent>
        <Section>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >
            <SectionTitle>파티 구성</SectionTitle>
            <Button onClick={addParty} style={{ width: 'auto' }}>
              파티 추가
            </Button>
          </div>
          <PartyContainer>
            {parties.map((party) => {
              console.log('party', party.slots);
              return (
                <PartyCard
                  key={party.id}
                  draggable
                  onDragStart={(e) => handlePartyCardDragStart(e, party)}
                  onDragEnd={handlePartyCardDragEnd}
                  onDragOver={handlePartyCardDragOver}
                  onDragLeave={handlePartyCardDragLeave}
                  onDrop={(e) => handlePartyCardDrop(e, party)}
                >
                  <PartyHeader>
                    <input
                      type="text"
                      value={party.title}
                      onChange={(e) =>
                        handlePartyTitleChange(party.id, e.target.value)
                      }
                      placeholder="파티 제목"
                    />
                  </PartyHeader>
                  <PartySlots>
                    {party.slots.map((slot, index) => (
                      <PartySlot
                        key={index}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, party.id, index)}
                        className={slot === 'empty' ? 'empty' : ''}
                      >
                        {slot !== 'empty' ? (
                          <div
                            draggable
                            onDragStart={(e) =>
                              handlePartyDragStart(e, party.id, index, slot)
                            }
                            style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                            }}
                          >
                            <div className="character-image">
                              <img
                                src={`https://img-api.neople.co.kr/df/servers/${slot.server}/characters/${slot.key}?zoom=1`}
                                alt={`${slot.name} 캐릭터 이미지`}
                                draggable="false"
                              />
                            </div>
                            <div className="character-info">
                              <div className="level">명성 {slot.level}</div>
                              <div className="name">{slot.name}</div>
                              <div className="adventure">
                                {slot.adventureName}
                              </div>
                              {slot.buffScore ? (
                                <div className="score">
                                  버프력 {slot.buffScore}
                                </div>
                              ) : slot.ozma ? (
                                <div className="score">랭킹 {slot.ozma}</div>
                              ) : null}
                            </div>
                          </div>
                        ) : (
                          <div>빈 슬롯</div>
                        )}
                      </PartySlot>
                    ))}
                  </PartySlots>
                  <PartyMemo
                    value={party.memo}
                    onChange={(e) =>
                      handlePartyMemoChange(party.id, e.target.value)
                    }
                    placeholder="파티 메모"
                  />
                </PartyCard>
              );
            })}
          </PartyContainer>
        </Section>
      </MainContent>
    </PageContainer>
  );
}

export function GroupPage() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // 에러 상태 초기화 로직
      }}
      onError={(error) => {
        console.error('Group page error:', error);
      }}
    >
      <GroupPageContent />
    </ErrorBoundary>
  );
}
