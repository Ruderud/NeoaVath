import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CharacterData } from '../../types/types';
import { ArrowLeft, Users, FlaskConical, TestTube } from 'lucide-react';
import { DraggableCharacterSearch } from '../../components/DraggableCharacterSearch';
import { Drawer } from '../../components/Drawer';
import { Toast } from '../../components/Toast';
import { PageContainer, MainContent, Section, SectionTitle } from '../GroupPage/styles';
import { CharacterPreview } from '../../components/CharacterPreview';
import styled from '@emotion/styled';

// 모험단별 그룹 스타일
const AdventureGroup = styled.div`
  margin-bottom: 16px;
`;

const AdventureGroupHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  margin-bottom: 8px;
  border-left: 4px solid #3b82f6;
`;

const AdventureGroupTitle = styled.h4`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
`;

const AdventureGroupCount = styled.span`
  background: #e5e7eb;
  color: #6b7280;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
`;

const CharacterList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export function ExperimentalPage() {
  const { groupName } = useParams<{ groupName: string }>();
  const navigate = useNavigate();

  const [selectedCharacters, setSelectedCharacters] = useState<CharacterData[]>([]);
  const [isDraggableSearchOpen, setIsDraggableSearchOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
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
      console.error('!!DEBUG 캐릭터 데이터 파싱 실패:', error);
    }
  };

  // 토스트 메시지 표시
  const showToast = (message: string) => {
    setToastMessage(message);
    setIsToastVisible(true);
    setTimeout(() => setIsToastVisible(false), 3000);
  };

  // 파티 최적화 기능
  const handlePartyOptimization = () => {
    if (selectedCharacters.length < 4) {
      showToast('최소 4명의 캐릭터가 필요합니다.');
      return;
    }
    showToast('파티 최적화 기능이 실행되었습니다.');
  };

  // 캐릭터들을 모험단별로 그룹핑
  const groupedCharacters = selectedCharacters.reduce((groups, character) => {
    const adventureName = character.adventureName || '알 수 없는 모험단';
    if (!groups[adventureName]) {
      groups[adventureName] = [];
    }
    groups[adventureName].push(character);
    return groups;
  }, {} as Record<string, CharacterData[]>);

  // 모험단 이름으로 정렬
  const sortedAdventureNames = Object.keys(groupedCharacters).sort();

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
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>실험적 기능</h1>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setIsDraggableSearchOpen(true)}
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
                <Users size={16} />
                캐릭터 추가
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
                        flexDirection: 'column',
                        gap: '8px',
                        overflowY: 'auto',
                        flex: 1,
                        paddingRight: '8px',
                      }}
                    >
                      {sortedAdventureNames.map((adventureName) => (
                        <AdventureGroup key={adventureName}>
                          <AdventureGroupHeader>
                            <AdventureGroupTitle>{adventureName}</AdventureGroupTitle>
                            <AdventureGroupCount>{groupedCharacters[adventureName].length}명</AdventureGroupCount>
                          </AdventureGroupHeader>
                          <CharacterList>
                            {groupedCharacters[adventureName].map((character) => (
                              <CharacterPreview key={character.key} character={character} onRemove={handleCharacterRemove} />
                            ))}
                          </CharacterList>
                        </AdventureGroup>
                      ))}
                    </div>
                  )}
                </div>
              </Section>
            </div>

            {/* 오른쪽: 실험적 기능들 */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Section>
                <SectionTitle>
                  <FlaskConical size={20} />
                  실험적 기능
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
                  {/* 파티 최적화 기능 */}
                  <div
                    style={{
                      padding: '20px',
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onClick={handlePartyOptimization}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '8px',
                      }}
                    >
                      <div
                        style={{
                          padding: '8px',
                          backgroundColor: '#f0f9ff',
                          borderRadius: '8px',
                          color: '#3b82f6',
                        }}
                      >
                        <TestTube size={20} />
                      </div>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>파티 최적화</h3>
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '14px',
                        color: '#6b7280',
                        lineHeight: '1.5',
                      }}
                    >
                      AI를 활용한 최적의 파티 조합을 제안합니다.
                    </p>
                  </div>

                  {/* 추가 실험적 기능을 위한 플레이스홀더 */}
                  <div
                    style={{
                      padding: '20px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '12px',
                      border: '2px dashed #d1d5db',
                      textAlign: 'center',
                      color: '#6b7280',
                    }}
                  >
                    <FlaskConical size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                    <p style={{ margin: 0, fontSize: '14px' }}>새로운 실험적 기능이 추가될 예정입니다</p>
                  </div>
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
