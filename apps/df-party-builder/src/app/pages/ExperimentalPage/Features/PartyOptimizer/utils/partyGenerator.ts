import { CharacterData } from '../../../../../types/types';
import { partyStorage, ProgressCallback } from './partyStorage';
import { PartyWorkerManager } from './partyWorkerManager';

/**
 * 개별 파티 타입 정의 (저장용 - 키만 저장)
 */
export type Party = {
  id: string;
  characterKeys: string[]; // CharacterData['key'] 배열
  size: number; // 파티 크기 (2, 3, 4)
};

/**
 * 개별 파티 타입 정의 (사용용 - 전체 데이터 포함)
 */
export type PartyWithCharacters = {
  id: string;
  characters: CharacterData[];
  size: number; // 파티 크기 (2, 3, 4)
};

/**
 * 파티 조합 타입 정의 (저장용 - 키만 저장)
 */
export type PartyCombination = {
  id: string;
  parties: Party[];
  totalCharacters: number;
  partyCount: number;
  sizeDistribution: {
    size2: number; // 2인 파티 개수
    size3: number; // 3인 파티 개수
    size4: number; // 4인 파티 개수
  };
};

/**
 * 파티 조합 타입 정의 (사용용 - 전체 데이터 포함)
 */
export type PartyCombinationWithCharacters = {
  id: string;
  parties: PartyWithCharacters[];
  totalCharacters: number;
  partyCount: number;
  sizeDistribution: {
    size2: number; // 2인 파티 개수
    size3: number; // 3인 파티 개수
    size4: number; // 4인 파티 개수
  };
};

/**
 * 파티 생성 결과 타입
 */
export type PartyGenerationResult = {
  combinations: PartyCombination[];
  totalCombinations: number;
  totalCharacters: number;
  combinationDistribution: {
    total2Party: number; // 2인 파티가 포함된 조합 수
    total3Party: number; // 3인 파티가 포함된 조합 수
    total4Party: number; // 4인 파티가 포함된 조합 수
    partyCountDistribution: Record<number, number>; // 파티 개수별 분포
  };
};

/**
 * 캐릭터를 중복 없이 모두 사용하여 가능한 모든 파티 조합을 생성 (청크 단위)
 * IndexedDB에 저장하여 메모리 효율성 확보
 *
 * @param characters - 파티에 사용할 캐릭터 배열
 * @param chunkSize - 청크 크기 (기본값: 1000)
 * @param progressCallback - 진행률 콜백
 * @returns 파티 생성 결과 (요약 정보만)
 */
export async function generateAllPossiblePartiesAsync(
  characters: CharacterData[],
  chunkSize = 1000,
  progressCallback?: ProgressCallback,
  maxWorkers = 4,
): Promise<PartyGenerationResult> {
  if (characters.length < 2) {
    return {
      combinations: [],
      totalCombinations: 0,
      totalCharacters: characters.length,
      combinationDistribution: {
        total2Party: 0,
        total3Party: 0,
        total4Party: 0,
        partyCountDistribution: {},
      },
    };
  }

  const totalCharacters = characters.length;

  // 가능한 모든 파티 크기 조합을 생성
  const partySizeCombinations = generatePartySizeCombinations(totalCharacters);
  console.log('!!DEBUG 파티 크기 조합들:', partySizeCombinations);

  // Web Worker Manager 생성
  const workerManager = new PartyWorkerManager(maxWorkers);

  try {
    // 병렬로 조합 생성
    await workerManager.generateCombinationsInParallel(
      characters,
      partySizeCombinations,
      50000, // 각 Worker당 최대 조합 수
      (progress, message) => {
        if (progressCallback) {
          progressCallback({
            currentChunk: Math.floor(progress / 10),
            totalChunks: 10,
            combinationsInCurrentChunk: 0,
            totalCombinationsSoFar: 0,
            isComplete: false,
          });
        }
      },
    );

    // 통계 정보 조회
    const stats = await partyStorage.getStats();

    // 진행률 콜백 호출 (완료)
    if (progressCallback) {
      progressCallback({
        currentChunk: 10,
        totalChunks: 10,
        combinationsInCurrentChunk: 0,
        totalCombinationsSoFar: stats.totalCombinations,
        isComplete: true,
      });
    }

    // 요약 정보만 반환 (실제 조합은 IndexedDB에 저장됨)
    return {
      combinations: [], // 실제 조합은 IndexedDB에 저장
      totalCombinations: stats.totalCombinations,
      totalCharacters,
      combinationDistribution: {
        total2Party: 0, // TODO: 통계 계산
        total3Party: 0,
        total4Party: 0,
        partyCountDistribution: {},
      },
    };
  } finally {
    // Worker 정리
    workerManager.terminate();
  }
}

/**
 * 캐릭터를 중복 없이 모두 사용하여 가능한 모든 파티 조합을 생성 (동기, 메모리 사용)
 * 예: 7명 -> [4명+3명], [3명+2명+2명] 등의 조합
 *
 * @param characters - 파티에 사용할 캐릭터 배열
 * @returns 파티 생성 결과
 */
export function generateAllPossibleParties(characters: CharacterData[]): PartyGenerationResult {
  if (characters.length < 2) {
    return {
      combinations: [],
      totalCombinations: 0,
      totalCharacters: characters.length,
      combinationDistribution: {
        total2Party: 0,
        total3Party: 0,
        total4Party: 0,
        partyCountDistribution: {},
      },
    };
  }

  const totalCharacters = characters.length;
  const allCombinations: PartyCombination[] = [];
  let combinationIdCounter = 1;

  // 가능한 모든 파티 크기 조합을 생성
  const partySizeCombinations = generatePartySizeCombinations(totalCharacters);

  console.log('!!DEBUG 파티 크기 조합들:', partySizeCombinations);

  // 각 파티 크기 조합에 대해 실제 캐릭터 할당
  for (const sizeCombination of partySizeCombinations) {
    const combinations = generateCombinationsForSizes(characters, sizeCombination, combinationIdCounter);
    allCombinations.push(...combinations);
    combinationIdCounter += combinations.length;
  }

  // 조합 분포 계산 (파티 개수별 분포)
  const partyCountDistribution = allCombinations.reduce((acc, combination) => {
    const count = combination.partyCount;
    acc[count] = (acc[count] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const combinationDistribution = {
    total2Party: allCombinations.filter((c) => c.sizeDistribution.size2 > 0).length,
    total3Party: allCombinations.filter((c) => c.sizeDistribution.size3 > 0).length,
    total4Party: allCombinations.filter((c) => c.sizeDistribution.size4 > 0).length,
    partyCountDistribution, // 파티 개수별 분포 추가
  };

  return {
    combinations: allCombinations,
    totalCombinations: allCombinations.length,
    totalCharacters,
    combinationDistribution,
  };
}

/**
 * 주어진 인원수로 가능한 모든 파티 크기 조합을 생성
 * 예: 7명 -> [[4,3], [3,2,2], [2,2,2,1]] (1은 제외)
 *
 * @param totalCharacters - 총 캐릭터 수
 * @returns 파티 크기 조합 배열
 */
function generatePartySizeCombinations(totalCharacters: number): number[][] {
  const combinations: number[][] = [];

  // 재귀적으로 파티 크기 조합을 생성
  function generateSizeCombinations(remaining: number, currentCombination: number[], minSize: number) {
    // 남은 인원이 0이면 유효한 조합
    if (remaining === 0) {
      // 1인 파티는 제외 (최소 2인)
      if (currentCombination.every((size) => size >= 2)) {
        combinations.push([...currentCombination]);
      }
      return;
    }

    // 남은 인원이 최소 크기보다 적으면 불가능
    if (remaining < minSize) {
      return;
    }

    // 2, 3, 4인 파티 크기로 시도
    for (let size = minSize; size <= Math.min(4, remaining); size++) {
      currentCombination.push(size);
      generateSizeCombinations(remaining - size, currentCombination, size);
      currentCombination.pop(); // 백트래킹
    }
  }

  generateSizeCombinations(totalCharacters, [], 2);
  return combinations;
}

/**
 * 특정 파티 크기 조합에 대해 실제 캐릭터 할당 조합을 생성
 *
 * @param characters - 사용할 캐릭터 배열
 * @param sizeCombination - 파티 크기 조합 (예: [4, 3])
 * @param startId - 시작 ID
 * @returns 생성된 파티 조합 배열
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

/**
 * 특정 크기의 파티들을 생성하는 헬퍼 함수 (키만 저장, 메모리 제한)
 *
 * @param characters - 사용할 캐릭터 배열
 * @param partySize - 파티 크기 (2, 3, 4)
 * @param startId - 시작 ID (사용하지 않음, 호환성을 위해 유지)
 * @param maxCombinations - 최대 생성할 조합 수 (메모리 제한)
 * @returns 생성된 파티 배열 (키만 포함)
 */
function generatePartiesOfSize(characters: CharacterData[], partySize: number, startId: number, maxCombinations = 100000): Party[] {
  const parties: Party[] = [];
  let currentId = 1;
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
        characterKeys: currentParty.map((char) => char.key), // 키만 저장
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
 * 파티 생성 결과를 콘솔에 출력하는 디버그 함수
 *
 * @param result - 파티 생성 결과
 */
export function logPartyGenerationResult(result: PartyGenerationResult): void {
  console.log('!!DEBUG 파티 조합 생성 결과:');
  console.log(`- 총 캐릭터 수: ${result.totalCharacters}명`);
  console.log(`- 총 조합 수: ${result.totalCombinations}개`);

  // 파티 개수별 분포 출력
  console.log('!!DEBUG 파티 개수별 분포:');
  Object.entries(result.combinationDistribution.partyCountDistribution)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .forEach(([partyCount, count]) => {
      console.log(`  ${partyCount}개 파티 조합: ${count}개`);
    });

  // 파티 크기별 포함 조합 수 (참고용)
  console.log('!!DEBUG 파티 크기별 포함 조합:');
  console.log(`  - 2인 파티 포함: ${result.combinationDistribution.total2Party}개`);
  console.log(`  - 3인 파티 포함: ${result.combinationDistribution.total3Party}개`);
  console.log(`  - 4인 파티 포함: ${result.combinationDistribution.total4Party}개`);

  // 처음 3개 조합만 상세 출력 (키만 표시)
  console.log('!!DEBUG 조합 상세 (처음 3개):');
  result.combinations.slice(0, 3).forEach((combination) => {
    console.log(`- ${combination.id}: ${combination.partyCount}개 파티`);
    combination.parties.forEach((party, index) => {
      const characterKeys = party.characterKeys.join(', ');
      console.log(`  ${index + 1}. [${characterKeys}] (${party.size}인)`);
    });
  });

  if (result.combinations.length > 3) {
    console.log(`... 외 ${result.combinations.length - 3}개 조합`);
  }
}

/**
 * 특정 크기의 파티가 포함된 조합만 필터링하는 함수
 *
 * @param result - 파티 생성 결과
 * @param size - 필터링할 파티 크기
 * @returns 필터링된 조합 배열
 */
export function filterCombinationsByPartySize(result: PartyGenerationResult, size: 2 | 3 | 4): PartyCombination[] {
  return result.combinations.filter((combination) => combination.parties.some((party) => party.size === size));
}

/**
 * 특정 파티 개수를 가진 조합만 필터링하는 함수
 *
 * @param result - 파티 생성 결과
 * @param partyCount - 필터링할 파티 개수
 * @returns 필터링된 조합 배열
 */
export function filterCombinationsByPartyCount(result: PartyGenerationResult, partyCount: number): PartyCombination[] {
  return result.combinations.filter((combination) => combination.partyCount === partyCount);
}

/**
 * 파티에 특정 캐릭터가 포함되어 있는지 확인하는 함수
 *
 * @param party - 확인할 파티
 * @param characterKey - 확인할 캐릭터의 키
 * @returns 포함 여부
 */
export function isCharacterInParty(party: Party, characterKey: string): boolean {
  return party.characterKeys.includes(characterKey);
}

/**
 * 조합에 특정 캐릭터가 포함되어 있는지 확인하는 함수
 *
 * @param combination - 확인할 조합
 * @param characterKey - 확인할 캐릭터의 키
 * @returns 포함 여부
 */
export function isCharacterInCombination(combination: PartyCombination, characterKey: string): boolean {
  return combination.parties.some((party) => isCharacterInParty(party, characterKey));
}

/**
 * 두 파티가 겹치는 캐릭터가 있는지 확인하는 함수
 *
 * @param party1 - 첫 번째 파티
 * @param party2 - 두 번째 파티
 * @returns 겹치는 캐릭터 존재 여부
 */
export function hasOverlappingCharacters(party1: Party, party2: Party): boolean {
  const keys1 = new Set(party1.characterKeys);
  const keys2 = new Set(party2.characterKeys);

  for (const key of keys1) {
    if (keys2.has(key)) {
      return true;
    }
  }
  return false;
}

/**
 * 조합 내 모든 파티가 겹치지 않는지 확인하는 함수
 *
 * @param combination - 확인할 조합
 * @returns 모든 파티가 겹치지 않으면 true
 */
export function isCombinationValid(combination: PartyCombination): boolean {
  for (let i = 0; i < combination.parties.length; i++) {
    for (let j = i + 1; j < combination.parties.length; j++) {
      if (hasOverlappingCharacters(combination.parties[i], combination.parties[j])) {
        return false;
      }
    }
  }
  return true;
}

/**
 * 키 배열을 캐릭터 배열로 변환하는 유틸리티 함수
 *
 * @param characterKeys - 캐릭터 키 배열
 * @param characterMap - 캐릭터 맵
 * @returns 캐릭터 배열
 */
export function keysToCharacters(characterKeys: string[], characterMap: Record<string, CharacterData>): CharacterData[] {
  return characterKeys.map((key) => characterMap[key]).filter(Boolean);
}

/**
 * Party를 PartyWithCharacters로 변환하는 유틸리티 함수
 *
 * @param party - 키만 포함된 파티
 * @param characterMap - 캐릭터 맵
 * @returns 전체 캐릭터 정보가 포함된 파티
 */
export function partyToPartyWithCharacters(party: Party, characterMap: Record<string, CharacterData>): PartyWithCharacters {
  return {
    id: party.id,
    characters: keysToCharacters(party.characterKeys, characterMap),
    size: party.size,
  };
}

/**
 * PartyCombination을 PartyCombinationWithCharacters로 변환하는 유틸리티 함수
 *
 * @param combination - 키만 포함된 조합
 * @param characterMap - 캐릭터 맵
 * @returns 전체 캐릭터 정보가 포함된 조합
 */
export function combinationToCombinationWithCharacters(
  combination: PartyCombination,
  characterMap: Record<string, CharacterData>,
): PartyCombinationWithCharacters {
  return {
    id: combination.id,
    parties: combination.parties.map((party) => partyToPartyWithCharacters(party, characterMap)),
    totalCharacters: combination.totalCharacters,
    partyCount: combination.partyCount,
    sizeDistribution: combination.sizeDistribution,
  };
}
