import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFirebase } from '../../context/FirebaseContext';
import { CharacterData, Party, PartySlot } from '../../types/types';
import { callGeminiAPI } from '../../api/gemini';
import { getDundamData } from '../../api/dundam';
import { Plus, Trash2, ArrowLeft, Settings, Users, Target } from 'lucide-react';
import { DraggableCharacterSearch } from '../../components/DraggableCharacterSearch';
import { Drawer } from '../../components/Drawer';
import { Toast } from '../../components/Toast';
import { CharacterCard } from '../../components/CharacterCard';
import { calculatePartyDamagePotential, formatDamagePotential } from '../../utils/partyDamagePotential';
import { v4 as uuidv4 } from 'uuid';
import { PageContainer, MainContent, Section, SectionTitle } from '../GroupPage/styles';

type AutoGenerateConfig = {
  targetPotential: number;
  partyCount: number;
  maxRetries: number;
  customPrompt: string;
};

export function AutoGeneratePage() {
  const { groupName } = useParams<{ groupName: string }>();
  const navigate = useNavigate();
  const { writeData } = useFirebase();

  const [selectedCharacters, setSelectedCharacters] = useState<CharacterData[]>([]);
  const [generatedParties, setGeneratedParties] = useState<Party[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDraggableSearchOpen, setIsDraggableSearchOpen] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [config, setConfig] = useState<AutoGenerateConfig>({
    targetPotential: 1000,
    partyCount: 2,
    maxRetries: 3,
    customPrompt: '',
  });
  const [toastMessage, setToastMessage] = useState('');
  const [isToastVisible, setIsToastVisible] = useState(false);

  // Drawer 토글 함수
  const handleToggleDrawer = useCallback(() => {
    setIsDrawerOpen((prev) => !prev);
  }, []);

  // 더미 함수 (Drawer에서 필요하지만 이 페이지에서는 사용하지 않음)
  const handleUpdateGroupCharacters = useCallback(async () => {
    // 이 페이지에서는 사용하지 않음
  }, []);

  // 캐릭터 추가
  const handleCharacterAdd = (character: CharacterData) => {
    if (selectedCharacters.find((c) => c.key === character.key)) {
      showToast('이미 추가된 캐릭터입니다.');
      return;
    }
    setSelectedCharacters((prev) => [...prev, character]);
  };

  // 캐릭터 제거
  const handleCharacterRemove = (characterKey: string) => {
    setSelectedCharacters((prev) => prev.filter((c) => c.key !== characterKey));
  };

  // 캐릭터 드래그 시작
  const handleCharacterDragStart = (e: React.DragEvent<HTMLDivElement>, character: CharacterData) => {
    e.stopPropagation();
    e.dataTransfer.setData('character', JSON.stringify(character));
    e.dataTransfer.setData('type', 'character');
    e.currentTarget.classList.add('dragging');
  };

  // 드래그 오버
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLDivElement;
    target.classList.add('drag-over');
  };

  // 드래그 리브
  const handleDragLeave = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLDivElement;
    target.classList.remove('drag-over');
  };

  // 드롭
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLDivElement;
    target.classList.remove('drag-over');

    const type = e.dataTransfer.getData('type');
    if (type !== 'character') return;

    try {
      const character = JSON.parse(e.dataTransfer.getData('character')) as CharacterData;
      handleCharacterAdd(character);
    } catch (error) {
      console.error('캐릭터 데이터 파싱 실패:', error);
    }
  };

  // 토스트 메시지 표시
  const showToast = (message: string) => {
    setToastMessage(message);
    setIsToastVisible(true);
    setTimeout(() => setIsToastVisible(false), 3000);
  };

  // 자동 조합 생성
  const generateParties = async () => {
    if (selectedCharacters.length < 4) {
      showToast('최소 4명의 캐릭터가 필요합니다.');
      return;
    }

    setIsGenerating(true);
    setGeneratedParties([]);

    try {
      const characterInfo = selectedCharacters
        .map((char) => {
          const isDps = char.rankDamage && parseInt(char.rankDamage) > 0;
          const isBuffer = char.buffScore && parseInt(char.buffScore) > 0;

          let stats = `레벨: ${char.level}`;
          if (isDps) {
            stats += `, 딜러 데미지: ${char.rankDamage}`;
          }
          if (isBuffer) {
            stats += `, 버프점수: ${char.buffScore}`;
          }

          return `${char.name} (${stats})`;
        })
        .join('\n');

      const basePrompt = `
다음 캐릭터들을 사용해서 ${config.partyCount}개의 파티를 만들어주세요:

캐릭터 목록:
${characterInfo}

데미지 포텐셜 계산 방법:
- 랭킹 데미지(딜러 데미지) 총합 × 최고 버프력(버프점수)
- 버퍼가 여러 명일 경우 가장 높은 버프점수만 사용
- 예: 딜러A(1500억) + 딜러B(1200억) = 2700억, 최고 버퍼(800만) → 2700 × 800 = 2,160,000

요구사항:
- 각 파티는 정확히 4명의 캐릭터로 구성
- 딜러는 딜러 데미지를, 버퍼는 버프점수를 고려하여 조합
- 역할 분담을 고려한 조합 (딜러, 버퍼, 서포터 등)
- JSON 형식으로 응답

응답 형식:
{
  "parties": [
    {
      "title": "파티명",
      "characters": ["캐릭터명1", "캐릭터명2", "캐릭터명3", "캐릭터명4"],
      "reasoning": "조합 이유"
    }
  ]
}
`;

      // 사용자 정의 프롬프트가 있으면 추가
      const customPromptSection = config.customPrompt.trim() ? `\n추가 요구사항:\n${config.customPrompt}\n` : '';

      const prompt = basePrompt + customPromptSection;

      const response = await callGeminiAPI(prompt);

      try {
        // JSON 코드 블록에서 JSON 추출
        let jsonResponse = response.response;

        // ```json ... ``` 형태의 코드 블록 제거
        if (jsonResponse.includes('```json')) {
          const startIndex = jsonResponse.indexOf('```json') + 7;
          const endIndex = jsonResponse.lastIndexOf('```');
          jsonResponse = jsonResponse.substring(startIndex, endIndex).trim();
        }

        // ``` ... ``` 형태의 코드 블록 제거 (json 태그가 없는 경우)
        if (jsonResponse.includes('```') && !jsonResponse.includes('```json')) {
          const startIndex = jsonResponse.indexOf('```') + 3;
          const endIndex = jsonResponse.lastIndexOf('```');
          jsonResponse = jsonResponse.substring(startIndex, endIndex).trim();
        }

        const result = JSON.parse(jsonResponse);

        if (result.parties && Array.isArray(result.parties)) {
          const parties: Party[] = result.parties.map((partyData: any) => {
            const partyCharacters = partyData.characters
              .map((charName: string) => {
                return selectedCharacters.find((char) => char.name === charName) || 'empty';
              })
              .filter(Boolean);

            // 4명이 되도록 빈 슬롯 추가
            while (partyCharacters.length < 4) {
              partyCharacters.push('empty');
            }

            const partySlots = partyCharacters.slice(0, 4) as [PartySlot, PartySlot, PartySlot, PartySlot];

            // 프론트에서 데미지 포텐셜 계산
            const damagePotentialResult = calculatePartyDamagePotential(partySlots);
            const damagePotentialText = formatDamagePotential(damagePotentialResult);

            return {
              id: uuidv4(),
              title: partyData.title || '자동 생성 파티',
              slots: partySlots,
              memo: `${damagePotentialText}\n${partyData.reasoning || ''}`,
              isCompleted: false,
            };
          });

          setGeneratedParties(parties);
          showToast(`${parties.length}개의 파티가 생성되었습니다.`);
        } else {
          throw new Error('잘못된 응답 형식');
        }
      } catch (parseError) {
        console.error('!!DEBUG JSON 파싱 실패:', parseError);
        console.error('!!DEBUG 원본 응답:', response.response);
        showToast('AI 응답을 파싱할 수 없습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('!!DEBUG 자동 조합 생성 실패:', error);
      showToast('파티 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 생성된 파티를 그룹에 저장
  const saveToGroup = async () => {
    if (!groupName || generatedParties.length === 0) return;

    try {
      // 기존 던전 데이터 읽기
      const existingData = await getDundamData({ name: groupName, type: 'character' });

      // 새로운 던전 생성
      const newDungeon = {
        id: uuidv4(),
        name: '자동 생성 던전',
        parties: generatedParties,
      };

      // Firebase에 저장
      await writeData(`groups/${groupName}/dungeons`, [newDungeon]);

      showToast('파티가 그룹에 저장되었습니다.');
      navigate(`/group/${groupName}`);
    } catch (error) {
      console.error('!!DEBUG 그룹 저장 실패:', error);
      showToast('그룹 저장에 실패했습니다.');
    }
  };

  return (
    <>
      <Drawer
        open={isDrawerOpen}
        groupName={groupName || ''}
        onToggle={handleToggleDrawer}
        onUpdateGroupCharacters={handleUpdateGroupCharacters}
        onOpenCharacterSearch={() => setIsDraggableSearchOpen(true)}
      />
      <PageContainer drawerOpen={isDrawerOpen}>
        <MainContent style={{ backgroundColor: '#f5f5f5' }} data-main-content>
          {/* 헤더 */}
          <div
            style={{
              padding: '20px',
              backgroundColor: 'white',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => navigate(`/group/${groupName}`)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#6b7280',
                }}
              >
                <ArrowLeft size={20} />
                뒤로가기
              </button>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>자동 조합 생성</h1>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowConfig(!showConfig)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Settings size={16} />
                설정
              </button>
            </div>
          </div>

          <div style={{ padding: '20px', display: 'flex', gap: '20px', height: 'calc(100vh - 120px)' }}>
            {/* 왼쪽: 선택된 캐릭터 */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <Section>
                <SectionTitle>
                  <Users size={20} />
                  선택된 캐릭터 ({selectedCharacters.length}명)
                </SectionTitle>

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  style={{
                    minHeight: '200px',
                    padding: '16px',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    border: '2px dashed #d1d5db',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  }}
                >
                  {selectedCharacters.length === 0 ? (
                    <div
                      style={{
                        width: '100%',
                        textAlign: 'center',
                        color: '#6b7280',
                        padding: '40px 0',
                      }}
                    >
                      캐릭터를 드래그하여 추가하거나
                      <br />
                      "캐릭터 추가" 버튼을 클릭하세요
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '12px',
                        overflowY: 'auto',
                        flex: 1,
                        paddingRight: '8px',
                      }}
                    >
                      {selectedCharacters.map((character) => (
                        <div key={character.key} style={{ position: 'relative', flexShrink: 0 }}>
                          <CharacterCard draggable character={character} onDragStart={(e) => handleCharacterDragStart(e, character)} width={160} height={280} />
                          <button
                            onClick={() => handleCharacterRemove(character.key)}
                            style={{
                              position: 'absolute',
                              top: '4px',
                              right: '4px',
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '50%',
                              width: '24px',
                              height: '24px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              zIndex: 10,
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Section>

              {/* 설정 패널 */}
              {showConfig && (
                <Section>
                  <SectionTitle>
                    <Settings size={20} />
                    생성 설정
                  </SectionTitle>

                  <div
                    style={{
                      padding: '16px',
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                    }}
                  >
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>목표 포텐셜 점수</label>
                      <input
                        type="number"
                        value={config.targetPotential}
                        onChange={(e) => setConfig((prev) => ({ ...prev, targetPotential: Number(e.target.value) }))}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>생성할 파티 수</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={config.partyCount}
                        onChange={(e) => setConfig((prev) => ({ ...prev, partyCount: Number(e.target.value) }))}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>추가 요구사항 (선택사항)</label>
                      <textarea
                        value={config.customPrompt}
                        onChange={(e) => setConfig((prev) => ({ ...prev, customPrompt: e.target.value }))}
                        placeholder="예: 특정 캐릭터를 반드시 포함하거나, 특정 역할 분담을 원하는 경우 여기에 작성하세요."
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          minHeight: '80px',
                          resize: 'vertical',
                          fontFamily: 'inherit',
                        }}
                      />
                    </div>
                  </div>
                </Section>
              )}

              {/* 생성 버튼 */}
              <button
                onClick={generateParties}
                disabled={selectedCharacters.length < 4 || isGenerating}
                style={{
                  padding: '16px',
                  backgroundColor: selectedCharacters.length < 4 || isGenerating ? '#9ca3af' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: selectedCharacters.length < 4 || isGenerating ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Target size={20} />
                {isGenerating ? '생성 중...' : '자동 조합 생성'}
              </button>
            </div>

            {/* 오른쪽: 생성된 파티 */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Section>
                <SectionTitle>
                  <Target size={20} />
                  생성된 파티 ({generatedParties.length}개)
                </SectionTitle>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    overflowY: 'auto',
                    maxHeight: 'calc(100vh - 200px)',
                    paddingRight: '8px',
                  }}
                >
                  {generatedParties.length === 0 ? (
                    <div
                      style={{
                        padding: '40px',
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        textAlign: 'center',
                        color: '#6b7280',
                      }}
                    >
                      {isGenerating ? 'AI가 파티를 생성하고 있습니다...' : '생성된 파티가 없습니다.'}
                    </div>
                  ) : (
                    <>
                      {generatedParties.map((party, index) => (
                        <div
                          key={party.id}
                          style={{
                            padding: '16px',
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            border: '1px solid #e5e7eb',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '12px',
                            }}
                          >
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>{party.title}</h3>
                            <span
                              style={{
                                fontSize: '14px',
                                color: '#3b82f6',
                                fontWeight: '600',
                              }}
                            >
                              파티 {index + 1}
                            </span>
                          </div>

                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(4, 1fr)',
                              gap: '8px',
                              marginBottom: '12px',
                            }}
                          >
                            {party.slots.map((slot, slotIndex) => (
                              <div
                                key={slotIndex}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'center',
                                }}
                              >
                                {slot === 'empty' ? (
                                  <div
                                    style={{
                                      width: '160px',
                                      height: '280px',
                                      padding: '8px',
                                      backgroundColor: '#f9fafb',
                                      borderRadius: '8px',
                                      textAlign: 'center',
                                      fontSize: '12px',
                                      border: '1px dashed #d1d5db',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    <span style={{ color: '#9ca3af' }}>빈 슬롯</span>
                                  </div>
                                ) : (
                                  <CharacterCard character={slot} width={160} height={280} />
                                )}
                              </div>
                            ))}
                          </div>

                          {party.memo && (
                            <div
                              style={{
                                padding: '8px 12px',
                                backgroundColor: '#f0f9ff',
                                borderRadius: '6px',
                                fontSize: '12px',
                                color: '#0369a1',
                                whiteSpace: 'pre-line',
                              }}
                            >
                              {party.memo}
                            </div>
                          )}
                        </div>
                      ))}

                      <button
                        onClick={saveToGroup}
                        style={{
                          padding: '16px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          fontSize: '16px',
                          fontWeight: '600',
                          width: '100%',
                        }}
                      >
                        그룹에 저장
                      </button>
                    </>
                  )}
                </div>
              </Section>
            </div>
          </div>
        </MainContent>
      </PageContainer>

      <DraggableCharacterSearch
        isOpen={isDraggableSearchOpen}
        onClose={() => setIsDraggableSearchOpen(false)}
        groupName={groupName}
        onCharacterDragStart={handleCharacterDragStart}
      />

      <Toast message={toastMessage} isVisible={isToastVisible} />
    </>
  );
}

export default AutoGeneratePage;
