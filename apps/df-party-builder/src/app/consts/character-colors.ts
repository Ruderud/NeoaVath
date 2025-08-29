// 캐릭터 포지션별 색상 상수
export const CHARACTER_COLORS = {
  // 딜러 (붉은색)
  DEALER: {
    primary: '#ff6b6b',
    gradient: 'linear-gradient(135deg, rgba(255, 107, 107, 0.1) 0%, rgba(255, 107, 107, 0.3) 100%)',
  },
  // 시너지 (푸른~보라색)
  SYNERGY: {
    primary: '#4ecdc4',
    gradient: 'linear-gradient(135deg, rgba(78, 205, 196, 0.1) 0%, rgba(78, 205, 196, 0.3) 100%)',
  },
  // 버퍼 (초록색)
  BUFFER: {
    primary: '#51cf66',
    gradient: 'linear-gradient(135deg, rgba(81, 207, 102, 0.1) 0%, rgba(81, 207, 102, 0.3) 100%)',
  },
} as const;

// 포지션별 색상 가져오기 함수
export const getCharacterColor = (position?: string) => {
  switch (position) {
    case '시너지':
      return CHARACTER_COLORS.SYNERGY;
    case '버퍼':
      return CHARACTER_COLORS.BUFFER;
    default:
      return CHARACTER_COLORS.DEALER; // 기본값은 딜러
  }
};
