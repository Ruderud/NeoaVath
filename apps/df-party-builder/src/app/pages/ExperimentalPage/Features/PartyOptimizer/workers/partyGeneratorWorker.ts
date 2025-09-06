/**
 * Web Worker for Party Generation
 * 각 워커가 독립적으로 조합을 생성하여 성능을 향상시킵니다.
 */

/* eslint-disable no-restricted-globals */

import { CharacterData } from '../../../../../types/types';

// Worker 내부에서 사용할 타입들
type Party = {
  id: string;
  characterKeys: string[];
  size: number;
};

type PartyCombination = {
  id: string;
  parties: Party[];
  totalCharacters: number;
  partyCount: number;
  sizeDistribution: {
    size2: number;
    size3: number;
    size4: number;
  };
};

// Worker 메시지 타입들
type WorkerMessage = {
  type: 'GENERATE_COMBINATIONS';
  data: {
    characters: CharacterData[];
    sizeCombination: number[];
    startId: number;
    maxCombinations: number;
    workerId: number;
  };
};

type WorkerResponse = {
  type: 'COMBINATIONS_GENERATED' | 'ERROR' | 'PROGRESS';
  data: {
    workerId: number;
    combinations?: PartyCombination[];
    error?: string;
    progress?: number;
    totalGenerated?: number;
  };
};

/**
 * 특정 크기의 파티들을 생성하는 헬퍼 함수 (키만 저장, 메모리 제한)
 */
function generatePartiesOfSize(characters: CharacterData[], partySize: number, startId: number, maxCombinations = 100000): Party[] {
  const parties: Party[] = [];
  let currentId = startId;
  let generatedCount = 0;

  // 재귀적으로 조합을 생성하는 함수 (메모리 제한 추가)
  function generateCombinations(remainingChars: CharacterData[], currentParty: CharacterData[], startIndex: number) {
    // 메모리 제한 체크
    if (generatedCount >= maxCombinations) {
      return;
    }

    // 파티가 완성된 경우
    if (currentParty.length === partySize) {
      parties.push({
        id: `party-${currentId++}`,
        characterKeys: currentParty.map((char) => char.key),
        size: partySize,
      });
      generatedCount++;
      return;
    }

    // 남은 캐릭터가 필요한 수보다 적은 경우 중단
    if (remainingChars.length - startIndex < partySize - currentParty.length) {
      return;
    }

    // 다음 캐릭터를 선택하여 재귀 호출
    for (let i = startIndex; i < remainingChars.length; i++) {
      // 메모리 제한 체크
      if (generatedCount >= maxCombinations) {
        break;
      }

      currentParty.push(remainingChars[i]);
      generateCombinations(remainingChars, currentParty, i + 1);
      currentParty.pop(); // 백트래킹
    }
  }

  generateCombinations(characters, [], 0);
  return parties;
}

/**
 * 특정 크기 조합에 대해 실제 캐릭터를 할당하여 파티 조합을 생성하는 함수 (메모리 제한)
 */
function generateCombinationsForSizes(characters: CharacterData[], sizeCombination: number[], startId: number, maxCombinations = 100000): PartyCombination[] {
  const combinations: PartyCombination[] = [];
  let currentId = startId;
  let generatedCount = 0;

  // 재귀적으로 캐릭터를 파티에 할당 (메모리 제한 추가)
  function assignCharacters(remainingChars: CharacterData[], currentParties: Party[], sizeIndex: number) {
    // 메모리 제한 체크
    if (generatedCount >= maxCombinations) {
      return;
    }

    // 모든 파티가 완성된 경우
    if (sizeIndex >= sizeCombination.length) {
      if (remainingChars.length === 0) {
        // 크기 분포 계산
        const sizeDistribution = {
          size2: currentParties.filter((p) => p.size === 2).length,
          size3: currentParties.filter((p) => p.size === 3).length,
          size4: currentParties.filter((p) => p.size === 4).length,
        };

        combinations.push({
          id: `combination-${currentId++}`,
          parties: [...currentParties],
          totalCharacters: characters.length,
          partyCount: currentParties.length,
          sizeDistribution,
        });
        generatedCount++;
      }
      return;
    }

    const targetSize = sizeCombination[sizeIndex];

    // 현재 크기의 파티를 생성 (메모리 제한 적용)
    const parties = generatePartiesOfSize(remainingChars, targetSize, 0, Math.min(10000, maxCombinations - generatedCount));

    for (const party of parties) {
      // 메모리 제한 체크
      if (generatedCount >= maxCombinations) {
        break;
      }

      const newRemainingChars = remainingChars.filter((char) => !party.characterKeys.includes(char.key));

      currentParties.push(party);
      assignCharacters(newRemainingChars, currentParties, sizeIndex + 1);
      currentParties.pop(); // 백트래킹
    }
  }

  assignCharacters(characters, [], 0);
  return combinations;
}

// Worker 메시지 리스너
self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  const { type, data } = event.data;

  if (type === 'GENERATE_COMBINATIONS') {
    try {
      const { characters, sizeCombination, startId, maxCombinations, workerId } = data;

      console.log(`!!DEBUG Worker ${workerId}: 조합 생성 시작 - 크기 조합: [${sizeCombination.join(', ')}]`);

      // 조합 생성
      const combinations = generateCombinationsForSizes(characters, sizeCombination, startId, maxCombinations);

      console.log(`!!DEBUG Worker ${workerId}: 조합 생성 완료 - ${combinations.length}개 조합`);

      // 결과 전송
      const response: WorkerResponse = {
        type: 'COMBINATIONS_GENERATED',
        data: {
          workerId,
          combinations,
          totalGenerated: combinations.length,
        },
      };

      self.postMessage(response);
    } catch (error) {
      console.error(`!!DEBUG Worker ${data.workerId}: 오류 발생:`, error);

      const response: WorkerResponse = {
        type: 'ERROR',
        data: {
          workerId: data.workerId,
          error: error instanceof Error ? error.message : '알 수 없는 오류',
        },
      };

      self.postMessage(response);
    }
  }
});

// Worker 초기화 완료 알림
console.log('!!DEBUG Party Generator Worker 초기화 완료');
