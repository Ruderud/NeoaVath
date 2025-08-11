import type { PartySlot } from '../types/types';

type DamagePotentialResult = {
  value: number | null;
  isCalculable: boolean;
  reason?: string;
};

/**
 * ozma 문자열을 만 단위로 파싱합니다.
 * 예: "193 억 8463 만" → 1938463 (만 단위로 통일)
 *
 * @param ozmaString ozma 문자열
 * @returns 파싱된 숫자 (만 단위, 실패시 0)
 */
function parseOzma(ozmaString: string): number {
  if (!ozmaString || ozmaString.trim() === '') {
    return 0;
  }

  try {
    // "193 억 8463 만" 형태 파싱 - 억과 만을 모두 추출하여 만 단위로 통일
    const billionMatch = ozmaString.match(/(\d+)\s*억/);
    const millionMatch = ozmaString.match(/(\d+)\s*만/);

    let billion = 0;
    let million = 0;

    if (billionMatch) {
      billion = parseInt(billionMatch[1], 10) * 10000; // 억을 만 단위로 변환
    }

    if (millionMatch) {
      million = parseInt(millionMatch[1], 10);
    }

    if (billion > 0 || million > 0) {
      return billion + million;
    }

    // 단순 숫자만 있는 경우 (만 단위로 가정)
    const simpleNumber = parseInt(ozmaString.replace(/[^\d]/g, ''), 10);
    if (!isNaN(simpleNumber)) {
      return simpleNumber;
    }

    return 0;
  } catch (error) {
    console.error('!!DEBUG ozma 파싱 오류:', ozmaString, error);
    return 0;
  }
}

/**
 * buffScore 문자열을 파싱합니다.
 * 예: "4,589,611" → 4589611 (원래 값 그대로)
 *
 * @param buffScoreString buffScore 문자열
 * @returns 파싱된 숫자 (원래 값, 실패시 0)
 */
function parseBuffScore(buffScoreString: string): number {
  if (!buffScoreString || buffScoreString.trim() === '') {
    return 0;
  }

  try {
    // 쉼표 제거 후 숫자로 변환
    const cleanString = buffScoreString.replace(/,/g, '');
    const number = parseInt(cleanString, 10);

    if (isNaN(number)) {
      return 0;
    }

    // 원래 값 그대로 반환
    return number;
  } catch (error) {
    console.error('!!DEBUG buffScore 파싱 오류:', buffScoreString, error);
    return 0;
  }
}

/**
 * 파티의 데미지 포텐셜을 계산합니다.
 *
 * 계산 공식: (랭킹 데미지 총합) * (최고 버프력)
 *
 * @param slots 파티 슬롯 배열
 * @returns 계산 결과 객체
 */
export function calculatePartyDamagePotential(slots: PartySlot[]): DamagePotentialResult {
  // 빈 슬롯 제거
  const validSlots = slots.filter((slot) => slot !== 'empty');

  if (validSlots.length === 0) {
    return {
      value: null,
      isCalculable: false,
      reason: '파티원이 없습니다.',
    };
  }

  // 랭킹 데미지와 버프력을 분리
  const ozmaSlots = validSlots.filter((slot) => 'ozma' in slot && slot.ozma);
  const buffSlots = validSlots.filter((slot) => 'buffScore' in slot && slot.buffScore);

  // 랭킹 데미지가 없거나 버프력이 없으면 계산 불가
  if (ozmaSlots.length === 0) {
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

  // 랭킹 데미지 총합 계산 (만 단위로 통일)
  const totalOzma = ozmaSlots.reduce((sum, slot) => {
    if ('ozma' in slot && slot.ozma) {
      const ozmaValue = parseOzma(slot.ozma);
      return sum + ozmaValue;
    }
    return sum;
  }, 0);

  // 최고 버프력 찾기 (원래 값)
  const buffScores = buffSlots.map((slot) => {
    if ('buffScore' in slot && slot.buffScore) {
      const buffValue = parseBuffScore(slot.buffScore);
      return buffValue;
    }
    return 0;
  });

  const maxBuffScore = Math.max(...buffScores);

  // 유효하지 않은 값이 있으면 계산 불가
  if (totalOzma === 0 || maxBuffScore === 0 || isNaN(totalOzma) || isNaN(maxBuffScore)) {
    return {
      value: null,
      isCalculable: false,
      reason: '유효하지 않은 랭킹 데미지 또는 버프력 값이 있습니다.',
    };
  }

  // 데미지 포텐셜 계산
  const damagePotential = (totalOzma * maxBuffScore) / 100000000;

  // 계산 결과가 유효하지 않으면 계산 불가
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
 * 데미지 포텐셜을 포맷팅합니다.
 *
 * @param result 계산 결과
 * @returns 포맷팅된 문자열
 */
export function formatDamagePotential(result: DamagePotentialResult): string {
  if (!result.isCalculable || result.value === null) {
    return `데미지 포텐셜: ${result.reason || '계산불가'}`;
  }

  return `데미지 포텐셜: ${result.value.toLocaleString()}`;
}
