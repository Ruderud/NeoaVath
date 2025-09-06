import { useState } from 'react';
import { CharacterData } from '../../../../types/types';
import { Users, Plus } from 'lucide-react';
import { DraggableCharacterSearch } from '../../../../components/DraggableCharacterSearch';
import { Toast } from '../../../../components/Toast';
import { CharacterPreview } from '../../../../components/CharacterPreview';
import { Section, SectionTitle } from '../../../GroupPage/styles';
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

type PartyOptimizerProps = {
  groupName?: string;
  onOptimize: (characters: CharacterData[]) => void;
};

export function PartyOptimizer({ groupName, onOptimize }: PartyOptimizerProps) {
  const [selectedCharacters, setSelectedCharacters] = useState<CharacterData[]>([]);
  const [isDraggableSearchOpen, setIsDraggableSearchOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isToastVisible, setIsToastVisible] = useState(false);

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

  // 최적화 실행
  const handleOptimize = () => {
    if (selectedCharacters.length < 4) {
      showToast('최소 4명의 캐릭터가 필요합니다.');
      return;
    }
    onOptimize(selectedCharacters);
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
      <Section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <SectionTitle style={{ margin: 0 }}>
            <Users size={20} />
            선택된 캐릭터 ({selectedCharacters.length}명)
          </SectionTitle>
          <button
            onClick={() => setIsDraggableSearchOpen(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3b82f6';
            }}
          >
            <Plus size={16} />
            캐릭터 추가
          </button>
        </div>

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
              우측 상단의 "캐릭터 추가" 버튼을 클릭하세요
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

        {/* 최적화 실행 버튼 */}
        <button
          onClick={handleOptimize}
          disabled={selectedCharacters.length < 4}
          style={{
            marginTop: '16px',
            padding: '16px',
            backgroundColor: selectedCharacters.length < 4 ? '#9ca3af' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: selectedCharacters.length < 4 ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            width: '100%',
            transition: 'all 0.2s ease',
          }}
        >
          최적화 파티 생성 ({selectedCharacters.length}명)
        </button>
      </Section>

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
