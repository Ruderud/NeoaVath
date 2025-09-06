import { CharacterData } from '../../../../../types/types';

/**
 * 개별 파티 타입 정의
 */
export type Party = {
  id: string;
  characters: CharacterData[];
  size: number; // 파티 크기 (2, 3, 4)
};

/**
 * 파티 조합 타입 정의 (여러 파티로 구성된 하나의 조합)
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
 * 캐릭터를 중복 없이 모두 사용하여 가능한 모든 파티 조합을 생성
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
function generateCombinationsForSizes(characters: CharacterData[], sizeCombination: number[], startId: number): PartyCombination[] {
  const combinations: PartyCombination[] = [];
  let currentId = startId;

  // 재귀적으로 캐릭터를 파티에 할당
  function assignCharacters(remainingChars: CharacterData[], currentParties: Party[], sizeIndex: number) {
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
      }
      return;
    }

    const targetSize = sizeCombination[sizeIndex];

    // 현재 크기의 파티를 생성
    generatePartiesOfSize(remainingChars, targetSize, 0).forEach((party) => {
      const newRemainingChars = remainingChars.filter((char) => !party.characters.some((pChar) => pChar.key === char.key));

      currentParties.push(party);
      assignCharacters(newRemainingChars, currentParties, sizeIndex + 1);
      currentParties.pop(); // 백트래킹
    });
  }

  assignCharacters(characters, [], 0);
  return combinations;
}

/**
 * 특정 크기의 파티들을 생성하는 헬퍼 함수
 *
 * @param characters - 사용할 캐릭터 배열
 * @param partySize - 파티 크기 (2, 3, 4)
 * @param startId - 시작 ID (사용하지 않음, 호환성을 위해 유지)
 * @returns 생성된 파티 배열
 */
function generatePartiesOfSize(characters: CharacterData[], partySize: number, startId: number): Party[] {
  const parties: Party[] = [];
  let currentId = 1;

  // 재귀적으로 조합을 생성하는 함수
  function generateCombinations(remainingChars: CharacterData[], currentParty: CharacterData[], startIndex: number) {
    // 파티가 완성된 경우
    if (currentParty.length === partySize) {
      parties.push({
        id: `party-${currentId++}`,
        characters: [...currentParty],
        size: partySize,
      });
      return;
    }

    // 남은 캐릭터가 필요한 수보다 적은 경우 중단
    if (remainingChars.length - startIndex < partySize - currentParty.length) {
      return;
    }

    // 다음 캐릭터를 선택하여 재귀 호출
    for (let i = startIndex; i < remainingChars.length; i++) {
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

  // 처음 3개 조합만 상세 출력
  console.log('!!DEBUG 조합 상세 (처음 3개):');
  result.combinations.slice(0, 3).forEach((combination) => {
    console.log(`- ${combination.id}: ${combination.partyCount}개 파티`);
    combination.parties.forEach((party, index) => {
      const characterNames = party.characters.map((c) => c.name).join(', ');
      console.log(`  ${index + 1}. [${characterNames}] (${party.size}인)`);
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
  return party.characters.some((char) => char.key === characterKey);
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
  const keys1 = new Set(party1.characters.map((c) => c.key));
  const keys2 = new Set(party2.characters.map((c) => c.key));

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
