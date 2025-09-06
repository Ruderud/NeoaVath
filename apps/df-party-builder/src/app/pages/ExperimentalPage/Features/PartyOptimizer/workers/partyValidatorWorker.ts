/**
 * Web Worker for Party Validation
 * 각 워커가 독립적으로 조합을 검증하여 성능을 향상시킵니다.
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

type ValidationResult = {
  isValid: boolean;
  score: number;
  reason?: string;
  details?: Record<string, unknown>;
};

type ValidatedParty = {
  id: string;
  characterKeys: string[];
  size: number;
  validation: ValidationResult;
};

type ValidatedCombination = {
  id: string;
  parties: ValidatedParty[];
  totalScore: number;
  validPartyCount: number;
  invalidPartyCount: number;
  totalCharacters: number;
  partyCount: number;
  sizeDistribution: {
    size2: number;
    size3: number;
    size4: number;
  };
};

type PartyValidationConfig = {
  minDamagePotential?: number;
  preferredDamageRange?: {
    low: number;
    high?: number;
  };
};

// Worker 메시지 타입들
type WorkerMessage = {
  type: 'VALIDATE_COMBINATIONS';
  data: {
    combinations: PartyCombination[];
    characters: CharacterData[];
    config: PartyValidationConfig;
    workerId: number;
  };
};

type WorkerResponse = {
  type: 'COMBINATIONS_VALIDATED' | 'ERROR' | 'PROGRESS';
  data: {
    workerId: number;
    validatedCombinations?: ValidatedCombination[];
    error?: string;
    progress?: number;
    totalValidated?: number;
  };
};

/**
 * rankDamage 문자열을 만 단위로 파싱합니다.
 */
function parseRankDamage(rankDamage: string): number {
  if (!rankDamage || rankDamage.trim() === '') {
    return 0;
  }

  try {
    const billionMatch = rankDamage.match(/(\d+)\s*억/);
    const millionMatch = rankDamage.match(/(\d+)\s*만/);

    let billion = 0;
    let million = 0;

    if (billionMatch) {
      billion = parseInt(billionMatch[1], 10) * 10000;
    }

    if (millionMatch) {
      million = parseInt(millionMatch[1], 10);
    }

    if (billion > 0 || million > 0) {
      return billion + million;
    }

    const simpleNumber = parseInt(rankDamage.replace(/[^\d]/g, ''), 10);
    if (!isNaN(simpleNumber)) {
      return simpleNumber;
    }

    return 0;
  } catch (error) {
    console.error('!!DEBUG rankDamage 파싱 오류:', rankDamage, error);
    return 0;
  }
}

/**
 * buffScore 문자열을 파싱합니다.
 */
function parseBuffScore(buffScoreString: string): number {
  if (!buffScoreString || buffScoreString.trim() === '') {
    return 0;
  }

  try {
    const cleanString = buffScoreString.replace(/,/g, '');
    const number = parseInt(cleanString, 10);
    return isNaN(number) ? 0 : number;
  } catch (error) {
    console.error('!!DEBUG buffScore 파싱 오류:', buffScoreString, error);
    return 0;
  }
}

/**
 * 파티의 데미지 포텐셜을 계산합니다.
 */
function calculatePartyDamagePotential(characters: CharacterData[]): { value: number | null; isCalculable: boolean; reason?: string } {
  const validSlots = characters.filter((char) => char !== null);

  if (validSlots.length === 0) {
    return {
      value: null,
      isCalculable: false,
      reason: '파티원이 없습니다.',
    };
  }

  const rankDamageSlots = validSlots.filter((char) => 'rankDamage' in char && char.rankDamage);
  const buffSlots = validSlots.filter((char) => 'buffScore' in char && char.buffScore);

  if (rankDamageSlots.length === 0) {
    return {
      value: null,
      isCalculable: false,
      reason: '랭킹 데미지가 있는 파티원이 없습니다.',
    };
  }

  if (buffSlots.length === 0) {
    return {
      value: null,
      isCalculable: false,
      reason: '버프력이 있는 파티원이 없습니다.',
    };
  }

  const totalRankDamage = rankDamageSlots.reduce((sum, char) => {
    if ('rankDamage' in char && char.rankDamage) {
      const rankDamageValue = parseRankDamage(char.rankDamage);
      return sum + rankDamageValue;
    }
    return sum;
  }, 0);

  const buffScores = buffSlots.map((char) => {
    if ('buffScore' in char && char.buffScore) {
      const buffValue = parseBuffScore(char.buffScore);
      return buffValue;
    }
    return 0;
  });

  const maxBuffScore = Math.max(...buffScores);

  if (totalRankDamage === 0 || maxBuffScore === 0 || isNaN(totalRankDamage) || isNaN(maxBuffScore)) {
    return {
      value: null,
      isCalculable: false,
      reason: '유효하지 않은 랭킹 데미지 또는 버프력 값이 있습니다.',
    };
  }

  const damagePotential = (totalRankDamage * maxBuffScore) / 100000000;

  if (isNaN(damagePotential) || !isFinite(damagePotential)) {
    return {
      value: null,
      isCalculable: false,
      reason: '데미지 포텐셜 계산 중 오류가 발생했습니다.',
    };
  }

  return {
    value: Math.floor(damagePotential),
    isCalculable: true,
  };
}

/**
 * 파티를 검증합니다.
 */
function validateParty(party: Party, characters: CharacterData[], config: PartyValidationConfig): ValidationResult {
  const partyCharacters = party.characterKeys.map((key) => characters.find((char) => char.key === key)).filter(Boolean) as CharacterData[];

  if (partyCharacters.length !== party.characterKeys.length) {
    return {
      isValid: false,
      score: 0,
      reason: '일부 캐릭터를 찾을 수 없습니다.',
    };
  }

  const damageResult = calculatePartyDamagePotential(partyCharacters);

  if (!damageResult.isCalculable || damageResult.value === null) {
    return {
      isValid: false,
      score: 0,
      reason: damageResult.reason,
      details: { damageValue: null },
    };
  }

  const damageValue = damageResult.value;
  let score = 0;

  // 최소 데미지 포텐셜 체크
  if (config.minDamagePotential !== undefined && damageValue < config.minDamagePotential) {
    return {
      isValid: false,
      score: 0,
      reason: `최소 데미지 포텐셜 미달 (${damageValue} < ${config.minDamagePotential})`,
      details: { damageValue },
    };
  }

  // 희망 데미지 포텐셜 범위 체크 (가점)
  if (config.preferredDamageRange?.low !== undefined) {
    const { low, high } = config.preferredDamageRange;

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

  return {
    isValid: true,
    score,
    details: { damageValue },
  };
}

/**
 * 조합을 검증합니다.
 */
function validateCombination(combination: PartyCombination, characters: CharacterData[], config: PartyValidationConfig): ValidatedCombination {
  let totalScore = 0;
  let validPartyCount = 0;
  let invalidPartyCount = 0;

  const validatedParties: ValidatedParty[] = combination.parties.map((party) => {
    const validation = validateParty(party, characters, config);

    if (validation.isValid) {
      validPartyCount++;
      totalScore += validation.score;
    } else {
      invalidPartyCount++;
    }

    return {
      ...party,
      validation,
    };
  });

  return {
    id: combination.id,
    parties: validatedParties,
    totalScore,
    validPartyCount,
    invalidPartyCount,
    totalCharacters: combination.totalCharacters,
    partyCount: combination.partyCount,
    sizeDistribution: combination.sizeDistribution,
  };
}

// Worker 메시지 리스너
self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  const { type, data } = event.data;

  if (type === 'VALIDATE_COMBINATIONS') {
    try {
      const { combinations, characters, config, workerId } = data;

      console.log(`!!DEBUG Validator Worker ${workerId}: 검증 시작 - ${combinations.length}개 조합`);

      // 조합 검증
      const validatedCombinations = combinations.map((combination) => validateCombination(combination, characters, config));

      console.log(`!!DEBUG Validator Worker ${workerId}: 검증 완료 - ${validatedCombinations.length}개 조합`);

      // 결과 전송
      const response: WorkerResponse = {
        type: 'COMBINATIONS_VALIDATED',
        data: {
          workerId,
          validatedCombinations,
          totalValidated: validatedCombinations.length,
        },
      };

      self.postMessage(response);
    } catch (error) {
      console.error(`!!DEBUG Validator Worker ${data.workerId}: 오류 발생:`, error);

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
console.log('!!DEBUG Party Validator Worker 초기화 완료');
