/**
 * 파티 검증 유틸리티
 * 다양한 검증 규칙을 적용하여 파티를 평가합니다.
 */

import { CharacterData } from '../../../../../types/types';
import { calculatePartyDamagePotential } from '../../../../../utils/partyDamagePotential';
import { keysToCharacters } from './partyGenerator';

// 검증 결과 타입
export type ValidationResult = {
  isValid: boolean;
  score: number;
  reason?: string;
  details?: Record<string, unknown>;
};

// 검증 규칙 타입
export type ValidationRule = {
  name: string;
  weight: number; // 가중치 (기본 1)
  validate: (characters: CharacterData[], party: { characterKeys: string[] }) => ValidationResult;
};

// 파티 검증 설정 타입
export type PartyValidationConfig = {
  minDamagePotential?: number; // 최소 데미지 포텐셜 (이 값 이하는 제거)
  preferredDamageRange?: {
    low: number; // 희망 데미지 포텐셜 하한 (필수)
    high?: number; // 희망 데미지 포텐셜 상한 (옵셔널)
  };
};

// 검증된 조합 결과 타입
export type ValidatedCombination = {
  id: string;
  parties: Array<{
    id: string;
    characterKeys: string[];
    size: number;
    validation: ValidationResult;
  }>;
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

/**
 * 파티 검증기 클래스
 */
export class PartyValidator {
  private rules: ValidationRule[] = [];
  private config: PartyValidationConfig = {};

  constructor(config: PartyValidationConfig = {}) {
    this.config = config;
    this.initializeDefaultRules();
  }

  /**
   * 기본 검증 규칙들을 초기화합니다.
   */
  private initializeDefaultRules(): void {
    // 데미지 포텐셜 검증 규칙
    this.addRule({
      name: 'damagePotential',
      weight: 1,
      validate: (characters, party) => this.validateDamagePotential(characters, party),
    });
  }

  /**
   * 검증 규칙을 추가합니다.
   */
  addRule(rule: ValidationRule): void {
    this.rules.push(rule);
  }

  /**
   * 검증 규칙을 제거합니다.
   */
  removeRule(ruleName: string): void {
    this.rules = this.rules.filter((rule) => rule.name !== ruleName);
  }

  /**
   * 모든 검증 규칙을 제거합니다.
   */
  clearRules(): void {
    this.rules = [];
  }

  /**
   * 검증 설정을 업데이트합니다.
   */
  updateConfig(config: PartyValidationConfig): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 단일 파티를 검증합니다.
   */
  validateParty(party: { characterKeys: string[] }, characterMap: Record<string, CharacterData>): ValidationResult {
    const characters = keysToCharacters(party.characterKeys, characterMap);

    let totalScore = 0;
    let isValid = true;
    const details: Record<string, unknown> = {};

    // 모든 검증 규칙을 적용
    for (const rule of this.rules) {
      const result = rule.validate(characters, party);
      const weightedScore = result.score * rule.weight;

      totalScore += weightedScore;
      details[rule.name] = {
        score: result.score,
        weightedScore,
        isValid: result.isValid,
        reason: result.reason,
      };

      // 하나라도 유효하지 않으면 전체가 유효하지 않음
      if (!result.isValid) {
        isValid = false;
      }
    }

    return {
      isValid,
      score: totalScore,
      details,
    };
  }

  /**
   * 데미지 포텐셜 검증 규칙
   */
  private validateDamagePotential(characters: CharacterData[], party: { characterKeys: string[] }): ValidationResult {
    // PartySlot 형태로 변환
    const partySlots = characters.map((char) => ({
      ...char,
    }));

    const damageResult = calculatePartyDamagePotential(partySlots);

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
    if (this.config.minDamagePotential !== undefined && damageValue < this.config.minDamagePotential) {
      return {
        isValid: false,
        score: 0,
        reason: `최소 데미지 포텐셜 미달 (${damageValue} < ${this.config.minDamagePotential})`,
        details: { damageValue },
      };
    }

    // 희망 데미지 포텐셜 범위 체크 (가점)
    if (this.config.preferredDamageRange?.low !== undefined) {
      const { low, high } = this.config.preferredDamageRange;

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
  validateCombination(
    combination: {
      id: string;
      parties: Array<{
        id: string;
        characterKeys: string[];
        size: number;
      }>;
      totalCharacters: number;
      partyCount: number;
      sizeDistribution: {
        size2: number;
        size3: number;
        size4: number;
      };
    },
    characterMap: Record<string, CharacterData>,
  ): ValidatedCombination {
    let totalScore = 0;
    let validPartyCount = 0;
    let invalidPartyCount = 0;

    const validatedParties = combination.parties.map((party) => {
      const validation = this.validateParty(party, characterMap);

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
}

/**
 * 기본 검증 규칙들
 */
export const defaultValidationRules = {
  // 파티 크기 다양성 검증 (2인, 3인, 4인 파티가 골고루 있는지)
  partySizeDiversity: (): ValidationRule => ({
    name: 'partySizeDiversity',
    weight: 0.5,
    validate: (characters, party) => {
      const size = party.characterKeys.length;
      // 3인 파티에 가점 부여 (균형잡힌 파티)
      if (size === 3) {
        return { isValid: true, score: 1 };
      }
      return { isValid: true, score: 0 };
    },
  }),

  // 캐릭터 레벨 균형 검증
  levelBalance: (): ValidationRule => ({
    name: 'levelBalance',
    weight: 0.3,
    validate: (characters, party) => {
      if (characters.length < 2) {
        return { isValid: true, score: 0 };
      }

      const levels = characters.map((char) => Number(char.level) || 0);
      const avgLevel = levels.reduce((sum, level) => sum + level, 0) / levels.length;
      const variance = levels.reduce((sum, level) => sum + Math.pow(level - avgLevel, 2), 0) / levels.length;
      const standardDeviation = Math.sqrt(variance);

      // 표준편차가 낮을수록 (레벨이 비슷할수록) 가점
      const score = Math.max(0, 1 - standardDeviation / 10);
      return { isValid: true, score };
    },
  }),

  // 모험단 다양성 검증 (다양한 모험단의 캐릭터가 섞여있는지)
  adventureDiversity: (): ValidationRule => ({
    name: 'adventureDiversity',
    weight: 0.2,
    validate: (characters, party) => {
      const adventureNames = new Set(characters.map((char) => char.adventureName || '알 수 없는 모험단'));
      const diversityScore = Math.min(1, adventureNames.size / characters.length);
      return { isValid: true, score: diversityScore };
    },
  }),
};
