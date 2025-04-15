export type GetServerCharactorParams = {
  /**
   * 서버 아이디
   * - 특정 서버군 검색: 'cain', 'diregie' 등
   * - 'all': 전체 서버군 통합 검색
   */
  serverId: 'all' | string;

  /**
   * 캐릭터 이름 (URL 인코딩 필요)
   */
  characterName: string;

  /**
   * 캐릭터 직업 고유 코드
   */
  jobId?: string;

  /**
   * 캐릭터 전직 직업 고유 코드 (jobId 필요)
   */
  jobGrowId?: string;

  /**
   * jobGrowId 입력 시 연계되는 전체 전직 포함 조회
   * @default false
   */
  isAllJobGrow?: boolean;

  /**
   * 검색타입
   * - 'match': 동일 단어 (기본값)
   * - 'full': 전문 검색 (최소 2자에서 최대 12자까지 이용 가능)
   * @default 'match'
   */
  wordType?: 'match' | 'full';

  /**
   * 반환 Row 수
   * @default 10
   * @maximum 200
   */
  limit?: number;
};

export type GetCharacterTimelineParams = {
  /**
   * 서버 아이디
   */
  serverId: string;

  /**
   * 캐릭터 아이디
   */
  characterId: string;

  /**
   * 시작 날짜 (YYYYMMDD 형식)
   */
  startDate?: Date;

  /**
   * 종료 날짜 (YYYYMMDD 형식)
   */
  endDate?: Date;

  /**
   * 타임라인 코드
   */
  code?: string;

  /**
   * 반환 Row 수
   * @default 10
   * @maximum 100
   */
  limit?: number;

  /**
   * 다음 데이터 조회
   */
  next?: string;
};

/**
 * 아이템 아이디 또는 아이템 이름 둘중 하나는 반드시 필수 입력
 */
export type GetAuctionItemsParams = (
  | {
      /**
       * 아이템 아이디
       */
      itemId?: string;

      /**
       * 아이템 이름
       */
      itemName: string;
    }
  | {
      /**
       * 아이템 아이디
       */
      itemId: string;

      /**
       * 아이템 이름
       */
      itemName?: string;
    }
) & {
  /**
   * 반환 Row 수
   * @default 10
   * @maximum 400
   */
  limit?: number;

  /**
   * 정렬 기준
   * - sort가 정의되어 있지 않을 경우 기본적으로 auctionNo에 대해서만 오름차순(asc)으로 정렬됩니다.
   */
  sort?: `${'unitPrice' | 'reinforce' | 'auctionNo'}:${'asc' | 'desc'}`;
};
