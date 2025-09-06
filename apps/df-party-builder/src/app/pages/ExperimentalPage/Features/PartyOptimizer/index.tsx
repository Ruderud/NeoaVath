import { useState, useEffect } from 'react';
import { CharacterData } from '../../../../types/types';
import { Users, Plus, Settings, Filter } from 'lucide-react';
import { DraggableCharacterSearch } from '../../../../components/DraggableCharacterSearch';
import { Toast } from '../../../../components/Toast';
import { CharacterPreview } from '../../../../components/CharacterPreview';
// 검증 결과를 표시하는 간단한 다이얼로그 컴포넌트
import { Section, SectionTitle } from '../../../GroupPage/styles';
import { getLocalStorageItem, setLocalStorageItem, removeLocalStorageItem } from '../../../../utils/localStorage';
import { generateAllPossiblePartiesAsync, logPartyGenerationResult, keysToCharacters } from './utils/partyGenerator';
import { partyStorage } from './utils/partyStorage';
import { calculatePartyDamagePotential } from '../../../../utils/partyDamagePotential';
import { PartyValidatorManager } from './utils/partyValidatorManager';
import { ValidatedCombination } from './utils/partyValidator';
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

const ScrollableContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  flex: 1;
  padding-right: 8px;
  max-height: calc(400px - 32px);

  /* 스크롤바 스타일링 */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
`;

// 파티 검증 설정 타입
type PartyValidationConfig = {
  minDamagePotential?: number; // 최소 데미지 포텐셜 (이 값 이하는 제거)
  preferredDamageRange?: {
    low: number; // 희망 데미지 포텐셜 하한 (필수)
    high?: number; // 희망 데미지 포텐셜 상한 (옵셔널)
  };
};

type PartyOptimizerProps = {
  groupName?: string;
  onOptimize: (characters: CharacterData[]) => void;
};

export function PartyOptimizer({ groupName, onOptimize }: PartyOptimizerProps) {
  const [selectedCharacters, setSelectedCharacters] = useState<CharacterData[]>([]);
  const [isDraggableSearchOpen, setIsDraggableSearchOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [validationConfig, setValidationConfig] = useState<PartyValidationConfig>({});
  const [isValidating, setIsValidating] = useState(false);
  const [validatedResults, setValidatedResults] = useState<ValidatedCombination[]>([]);
  const [showResults, setShowResults] = useState(false);

  // localStorage 키 생성 (그룹명 포함)
  const storageKey = `party-optimizer-characters-${groupName || 'default'}`;
  const configStorageKey = `party-optimizer-config-${groupName || 'default'}`;

  // 컴포넌트 마운트 시 localStorage에서 캐릭터와 설정 복원
  useEffect(() => {
    try {
      const savedCharacters = getLocalStorageItem<CharacterData[]>(storageKey);
      if (savedCharacters && Array.isArray(savedCharacters)) {
        setSelectedCharacters(savedCharacters);
        console.log('!!DEBUG 저장된 캐릭터 복원:', savedCharacters.length, '명');
      }

      const savedConfig = getLocalStorageItem<PartyValidationConfig>(configStorageKey);
      if (savedConfig) {
        setValidationConfig(savedConfig);
        console.log('!!DEBUG 저장된 설정 복원:', savedConfig);
      }
    } catch (error) {
      console.error('!!DEBUG localStorage에서 데이터 복원 실패:', error);
    }
  }, [storageKey, configStorageKey]);

  // 선택된 캐릭터가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    try {
      if (selectedCharacters.length > 0) {
        setLocalStorageItem(storageKey, selectedCharacters);
        console.log('!!DEBUG 캐릭터 저장:', selectedCharacters.length, '명');
      } else {
        // 캐릭터가 없으면 localStorage에서 제거
        removeLocalStorageItem(storageKey);
        console.log('!!DEBUG 캐릭터 저장소 초기화');
      }
    } catch (error) {
      console.error('!!DEBUG localStorage에 캐릭터 저장 실패:', error);
    }
  }, [selectedCharacters, storageKey]);

  // 검증 설정이 변경될 때마다 localStorage에 저장
  useEffect(() => {
    try {
      setLocalStorageItem(configStorageKey, validationConfig);
      console.log('!!DEBUG 검증 설정 저장:', validationConfig);
    } catch (error) {
      console.error('!!DEBUG localStorage에 검증 설정 저장 실패:', error);
    }
  }, [validationConfig, configStorageKey]);

  // 캐릭터 추가
  const handleCharacterAdd = (character: CharacterData) => {
    if (selectedCharacters.find((c) => c.key === character.key)) {
      showToast('이미 추가된 캐릭터입니다.');
      return;
    }
    setSelectedCharacters((prev) => [...prev, character]);
    showToast(`${character.name}이(가) 추가되었습니다.`);
  };

  // 캐릭터 제거
  const handleCharacterRemove = (characterKey: string) => {
    const characterToRemove = selectedCharacters.find((c) => c.key === characterKey);
    setSelectedCharacters((prev) => prev.filter((c) => c.key !== characterKey));
    if (characterToRemove) {
      showToast(`${characterToRemove.name}이(가) 제거되었습니다.`);
    }
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

  // 검증 설정 변경 핸들러들
  const handleMinDamageChange = (value: string) => {
    const numValue = value === '' ? undefined : parseInt(value, 10);
    setValidationConfig((prev) => ({
      ...prev,
      minDamagePotential: numValue,
    }));
  };

  const handlePreferredLowChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      setValidationConfig((prev) => ({
        ...prev,
        preferredDamageRange: {
          ...prev.preferredDamageRange,
          low: numValue,
          high: prev.preferredDamageRange?.high,
        },
      }));
    }
  };

  const handlePreferredHighChange = (value: string) => {
    const numValue = value === '' ? undefined : parseInt(value, 10);
    setValidationConfig((prev) => ({
      ...prev,
      preferredDamageRange: {
        ...prev.preferredDamageRange,
        low: prev.preferredDamageRange?.low || 0,
        high: numValue,
      },
    }));
  };

  // 파티 검증 함수
  const validateParty = (party: { characterKeys: string[] }, characterMap: Record<string, CharacterData>) => {
    const characters = keysToCharacters(party.characterKeys, characterMap);

    // PartySlot 형태로 변환 (calculatePartyDamagePotential 함수에 맞춤)
    const partySlots = characters.map((char) => ({
      ...char,
      // 필요한 경우 추가 속성 매핑
    }));

    const damageResult = calculatePartyDamagePotential(partySlots);

    if (!damageResult.isCalculable || damageResult.value === null) {
      return { isValid: false, score: 0, reason: damageResult.reason };
    }

    const damageValue = damageResult.value;
    let score = 0;

    // 최소 데미지 포텐셜 체크
    if (validationConfig.minDamagePotential !== undefined && damageValue < validationConfig.minDamagePotential) {
      return { isValid: false, score: 0, reason: `최소 데미지 포텐셜 미달 (${damageValue} < ${validationConfig.minDamagePotential})` };
    }

    // 희망 데미지 포텐셜 범위 체크 (가점)
    if (validationConfig.preferredDamageRange?.low !== undefined) {
      const { low, high } = validationConfig.preferredDamageRange;

      if (high !== undefined) {
        // 상한이 있는 경우: low <= damage <= high
        if (damageValue >= low && damageValue <= high) {
          score += 1;
        }
      } else {
        // 상한이 없는 경우: damage >= low
        if (damageValue >= low) {
          score += 1;
        }
      }
    }

    return { isValid: true, score, damageValue };
  };

  // 조합 검증 실행
  const handleValidateCombinations = async () => {
    if (selectedCharacters.length < 2) {
      showToast('최소 2명의 캐릭터가 필요합니다.');
      return;
    }

    try {
      setIsValidating(true);
      showToast('조합을 검증 중입니다...');

      // IndexedDB에서 조합들을 가져와서 검증
      await partyStorage.init();
      const stats = await partyStorage.getStats();

      if (stats.totalCombinations === 0) {
        showToast('저장된 조합이 없습니다. 먼저 조합을 생성해주세요.');
        setIsValidating(false);
        return;
      }

      // 테스트용: 앞에서 10개만 가져오기
      const testChunk = await partyStorage.getChunk(0);
      const allCombinations = testChunk.slice(0, 10); // 처음 10개만

      console.log(`!!DEBUG 테스트: ${allCombinations.length}개 조합을 검증합니다.`);

      // 검증 Worker Manager 생성
      const validatorManager = new PartyValidatorManager(4);

      try {
        // 병렬로 조합 검증 (테스트용)
        const topResults = await validatorManager.validateCombinationsInParallel(
          allCombinations,
          selectedCharacters,
          validationConfig,
          5, // 테스트용 작은 배치 크기
          (progress, message) => {
            console.log(`!!DEBUG 테스트 검증 진행률: ${Math.round(progress)}% - ${message}`);
          },
        );

        setValidatedResults(topResults);
        setShowResults(true);

        const maxScore = topResults.length > 0 ? Math.max(...topResults.map((r) => r.totalScore)) : 0;
        showToast(`테스트 검증 완료! 최고 점수: ${maxScore}, ${topResults.length}개 조합을 표시합니다.`);

        console.log(`!!DEBUG 검증 완료: 상위 ${topResults.length}개 조합`);
        topResults.forEach((result, index) => {
          console.log(`${index + 1}. ${result.id}: 점수 ${result.totalScore}, 유효 파티 ${result.validPartyCount}/${result.partyCount}개`);
        });
      } finally {
        validatorManager.terminate();
      }
    } catch (error) {
      console.error('!!DEBUG 조합 검증 실패:', error);
      showToast('조합 검증 중 오류가 발생했습니다.');
    } finally {
      setIsValidating(false);
    }
  };

  // 전체 조합 생성
  const handleGenerateAllCombinations = async () => {
    if (selectedCharacters.length < 2) {
      showToast('최소 2명의 캐릭터가 필요합니다.');
      return;
    }

    try {
      showToast('파티 조합을 생성 중입니다...');

      // 모든 가능한 파티 조합 생성 (비동기, IndexedDB 사용)
      const partyResult = await generateAllPossiblePartiesAsync(
        selectedCharacters,
        1000, // 청크 크기
        (progress) => {
          console.log('!!DEBUG 진행률:', progress);
          if (progress.isComplete) {
            showToast(`${progress.totalCombinationsSoFar}개의 파티 조합이 생성되었습니다.`);
          }
        },
        4, // 최대 4개 Worker 사용
      );

      // 결과를 콘솔에 출력
      logPartyGenerationResult(partyResult);
    } catch (error) {
      console.error('!!DEBUG 파티 생성 실패:', error);
      showToast('파티 조합 생성 중 오류가 발생했습니다.');
    }
  };

  // 조합 조회 (100개씩)
  const handleViewCombinations = async () => {
    try {
      await partyStorage.init();
      const stats = await partyStorage.getStats();

      if (stats.totalCombinations === 0) {
        showToast('저장된 조합이 없습니다. 먼저 조합을 생성해주세요.');
        return;
      }

      showToast(`총 ${stats.totalCombinations}개의 조합이 저장되어 있습니다.`);

      // 첫 번째 청크부터 100개씩 조회
      let chunkIndex = 0;
      let totalViewed = 0;
      const batchSize = 100;

      while (totalViewed < stats.totalCombinations) {
        const chunk = await partyStorage.getChunk(chunkIndex);

        if (chunk.length === 0) {
          break;
        }

        // 100개씩 나누어서 출력
        for (let i = 0; i < chunk.length; i += batchSize) {
          const batch = chunk.slice(i, i + batchSize);
          console.log(`!!DEBUG 조합 조회 (청크 ${chunkIndex}, 배치 ${Math.floor(i / batchSize) + 1}):`);

          batch.forEach((combination, index) => {
            console.log(`- ${combination.id}: ${combination.partyCount}개 파티`);

            let totalScore = 0;
            let validParties = 0;
            let invalidParties = 0;

            combination.parties.forEach((party, partyIndex) => {
              // 키를 사용해서 캐릭터 정보 복원
              const characters = keysToCharacters(party.characterKeys, selectedCharacterMap);
              const characterNames = characters.map((c) => c.name).join(', ');

              // 파티 검증
              const validation = validateParty(party, selectedCharacterMap);

              if (validation.isValid) {
                validParties++;
                totalScore += validation.score;
                console.log(`  ${partyIndex + 1}. [${characterNames}] (${party.size}인) - 데미지: ${validation.damageValue}, 점수: ${validation.score}`);
              } else {
                invalidParties++;
                console.log(`  ${partyIndex + 1}. [${characterNames}] (${party.size}인) - ❌ ${validation.reason}`);
              }
            });

            console.log(`  → 유효 파티: ${validParties}개, 무효 파티: ${invalidParties}개, 총 점수: ${totalScore}`);
          });

          totalViewed += batch.length;

          // 100개씩 출력 후 잠시 대기 (콘솔이 너무 많이 출력되는 것을 방지)
          if (totalViewed < stats.totalCombinations) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }

        chunkIndex++;
      }

      console.log(`!!DEBUG 조합 조회 완료: 총 ${totalViewed}개 조합 출력`);
    } catch (error) {
      console.error('!!DEBUG 조합 조회 실패:', error);
      showToast('조합 조회 중 오류가 발생했습니다.');
    }
  };

  // 저장된 조합 초기화
  const handleClearCombinations = async () => {
    try {
      await partyStorage.init();
      await partyStorage.clearAll();
      showToast('저장된 조합이 모두 초기화되었습니다.');
      console.log('!!DEBUG 저장된 조합 초기화 완료');
    } catch (error) {
      console.error('!!DEBUG 조합 초기화 실패:', error);
      showToast('조합 초기화 중 오류가 발생했습니다.');
    }
  };

  // 캐릭터 맵 생성 (키로 빠른 조회를 위해)
  const selectedCharacterMap = selectedCharacters.reduce((map, character) => {
    map[character.key] = character;
    return map;
  }, {} as Record<string, CharacterData>);

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
      {/* 파티 검증 설정 섹션 */}
      <Section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <SectionTitle style={{ margin: 0 }}>
            <Settings size={20} />
            파티 검증 설정
          </SectionTitle>
          <button
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            style={{
              padding: '8px 12px',
              backgroundColor: isConfigOpen ? '#6b7280' : '#3b82f6',
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
          >
            <Filter size={16} />
            {isConfigOpen ? '설정 닫기' : '설정 열기'}
          </button>
        </div>

        {isConfigOpen && (
          <div
            style={{
              padding: '16px',
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              marginBottom: '16px',
            }}
          >
            {/* 현재 설정 상태 표시 */}
            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#374151' }}>현재 설정</h4>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                <div>최소 데미지 포텐셜: {validationConfig.minDamagePotential ? `${validationConfig.minDamagePotential.toLocaleString()}` : '설정 안함'}</div>
                <div>
                  희망 데미지 범위:{' '}
                  {validationConfig.preferredDamageRange?.low
                    ? `${validationConfig.preferredDamageRange.low.toLocaleString()}${
                        validationConfig.preferredDamageRange.high ? ` ~ ${validationConfig.preferredDamageRange.high.toLocaleString()}` : ' 이상'
                      }`
                    : '설정 안함'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* 최소 데미지 포텐셜 설정 */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  최소 데미지 포텐셜 (이 값 이하는 제거)
                </label>
                <input
                  type="number"
                  placeholder="예: 1000 (옵셔널)"
                  value={validationConfig.minDamagePotential || ''}
                  onChange={(e) => handleMinDamageChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: 'white',
                  }}
                />
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>설정하지 않으면 최소 데미지 포텐셜 필터링을 적용하지 않습니다.</p>
              </div>

              {/* 희망 데미지 포텐셜 범위 설정 */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  희망 데미지 포텐셜 범위 (해당 범위에 있으면 가점 +1)
                </label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#6b7280' }}>하한 (필수)</label>
                    <input
                      type="number"
                      placeholder="예: 500"
                      value={validationConfig.preferredDamageRange?.low || ''}
                      onChange={(e) => handlePreferredLowChange(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        backgroundColor: 'white',
                      }}
                    />
                  </div>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>~</span>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#6b7280' }}>상한 (옵셔널)</label>
                    <input
                      type="number"
                      placeholder="예: 2000"
                      value={validationConfig.preferredDamageRange?.high || ''}
                      onChange={(e) => handlePreferredHighChange(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        backgroundColor: 'white',
                      }}
                    />
                  </div>
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                  하한은 필수이며, 상한을 설정하지 않으면 하한 이상의 모든 값에 가점을 부여합니다.
                </p>
              </div>
            </div>
          </div>
        )}
      </Section>

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
            maxHeight: '400px',
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
            <ScrollableContainer>
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
            </ScrollableContainer>
          )}
        </div>

        {/* 파티 조합 관리 버튼들 */}
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* 전체 조합 생성 버튼 */}
          <button
            onClick={handleGenerateAllCombinations}
            disabled={selectedCharacters.length < 2}
            style={{
              padding: '16px',
              backgroundColor: selectedCharacters.length < 2 ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: selectedCharacters.length < 2 ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              width: '100%',
              transition: 'all 0.2s ease',
            }}
          >
            전체 조합 생성 ({selectedCharacters.length}명)
          </button>

          {/* 조합 검증 버튼 */}
          <button
            onClick={handleValidateCombinations}
            disabled={isValidating || selectedCharacters.length < 2}
            style={{
              padding: '12px',
              backgroundColor: isValidating || selectedCharacters.length < 2 ? '#9ca3af' : '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: isValidating || selectedCharacters.length < 2 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              width: '100%',
              transition: 'all 0.2s ease',
            }}
          >
            {isValidating ? '검증 중...' : '조합 검증 (테스트: 10개)'}
          </button>

          {/* 조합 조회 버튼 */}
          <button
            onClick={handleViewCombinations}
            style={{
              padding: '12px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              width: '100%',
              transition: 'all 0.2s ease',
            }}
          >
            조합 조회 (100개씩)
          </button>

          {/* 조합 초기화 버튼 */}
          <button
            onClick={handleClearCombinations}
            style={{
              padding: '12px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              width: '100%',
              transition: 'all 0.2s ease',
            }}
          >
            저장된 조합 초기화
          </button>
        </div>
      </Section>

      <DraggableCharacterSearch
        isOpen={isDraggableSearchOpen}
        onClose={() => setIsDraggableSearchOpen(false)}
        groupName={groupName}
        onCharacterDragStart={handleCharacterDragStart}
      />

      <Toast message={toastMessage} isVisible={isToastVisible} />

      {/* 검증 결과 섹션 */}
      {showResults && validatedResults.length > 0 && (
        <Section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <SectionTitle style={{ margin: 0 }}>
              <Filter size={20} />
              검증된 조합 결과 (테스트: {validatedResults.length}개)
            </SectionTitle>
            <button
              onClick={() => setShowResults(false)}
              style={{
                padding: '8px 12px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              닫기
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
            {validatedResults.map((result, index) => (
              <div
                key={result.id}
                style={{
                  padding: '16px',
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => {
                  console.log('!!DEBUG 선택된 조합:', result);
                  showToast(`조합 "${result.id}"이 선택되었습니다.`);
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#374151' }}>
                    {index + 1}위 - {result.id}
                  </h4>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '14px', color: '#6b7280' }}>
                    <span>
                      점수: <strong style={{ color: '#8b5cf6' }}>{result.totalScore}</strong>
                    </span>
                    <span>
                      유효: <strong style={{ color: '#10b981' }}>{result.validPartyCount}</strong>
                    </span>
                    <span>
                      무효: <strong style={{ color: '#ef4444' }}>{result.invalidPartyCount}</strong>
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {result.parties.map((party, partyIndex) => {
                    const characters = keysToCharacters(party.characterKeys, selectedCharacterMap);
                    const characterNames = characters.map((c) => c.name).join(', ');

                    return (
                      <div
                        key={party.id}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: party.validation.isValid ? '#f0fdf4' : '#fef2f2',
                          borderRadius: '6px',
                          border: `1px solid ${party.validation.isValid ? '#bbf7d0' : '#fecaca'}`,
                          fontSize: '14px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>
                            <strong>{partyIndex + 1}번 파티</strong> ({party.size}인): {characterNames}
                          </span>
                          <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                            {party.validation.isValid ? (
                              <span style={{ color: '#10b981' }}>
                                <span role="img" aria-label="유효">
                                  ✅
                                </span>{' '}
                                점수: {party.validation.score}
                                {(() => {
                                  const damageValue = party.validation.details?.damageValue;
                                  return damageValue && typeof damageValue === 'number' ? <span> (데미지: {damageValue.toLocaleString()})</span> : null;
                                })()}
                              </span>
                            ) : (
                              <span style={{ color: '#ef4444' }}>
                                <span role="img" aria-label="무효">
                                  ❌
                                </span>{' '}
                                {party.validation.reason}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
