import { Injectable, Logger } from '@nestjs/common';
import {
  AuctionItem,
  getAuctionItems,
  getItemDetail,
} from '@neoavath/neople-api';
import { Cron } from '@nestjs/schedule';
import { EnchantService } from './enchant/enchant.service';
import { uniqWith } from 'es-toolkit';

interface PriceHistory {
  timestamp: Date;
  averagePrice: number;
  lowestPrice: number;
  count: number;
}

interface GradeHistory {
  high: PriceHistory[];
  middle: PriceHistory[];
  low: PriceHistory[];
  none: PriceHistory[];
}

const MAX_HISTORY_SIZE = 100; // 최대 100개의 데이터 포인트 저장

const checkEnchantGrade = (
  enchant: AuctionItem['enchant']
): null | 'low' | 'middle' | 'high' => {
  if (!enchant) return null;

  if (
    enchant['status'].some(
      (stat) => stat['name'] === '힘' && stat['value'] === 25
    )
  ) {
    return 'high';
  }

  if (
    enchant['status'].some(
      (stat) => stat['name'] === '힘' && stat['value'] === 20
    )
  ) {
    return 'middle';
  }

  if (
    enchant['status'].some(
      (stat) => stat['name'] === '힘' && stat['value'] === 15
    )
  ) {
    return 'low';
  }

  return null;
};

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  private priceHistory: GradeHistory = {
    high: [],
    middle: [],
    low: [],
    none: [],
  };

  constructor(private readonly enchantService: EnchantService) {
    console.log('enchantService', this.enchantService.enchantMap);
  }

  getData(): { message: string } {
    return { message: 'Hello API-17' };
  }

  /**
   * Cron Expression
   *
   * * * * * * *
   * | | | | | |
   * | | | | | day of week
   * | | | | months
   * | | | day of month
   * | | hours
   * | minutes
   * seconds (optional)
   */
  @Cron('*/15 * * * * *')
  async crawlAuctionItems() {
    try {
      const itemList = await getAuctionItems({
        itemName: '프로스트의 전설',
        limit: 400,
        sort: 'unitPrice:desc',
      });

      this.logger.log(`Auction items fetched: ${itemList.rows.length} items`);

      const 프로스트의_전설_상급_보주_Prices = [];
      const 프로스트의_전설_중급_보주_Prices = [];
      const 프로스트의_전설_하급_보주_Prices = [];
      const 프로스트의_전설_깡통_Prices = [];

      // 각 아이템의 상세 정보를 조회하여 인챈트 정보 수집
      for (const item of itemList.rows) {
        const enchantGrade = checkEnchantGrade(item.enchant);

        if (enchantGrade === 'high') {
          프로스트의_전설_상급_보주_Prices.push(item.currentPrice);
        } else if (enchantGrade === 'middle') {
          프로스트의_전설_중급_보주_Prices.push(item.currentPrice);
        } else if (enchantGrade === 'low') {
          프로스트의_전설_하급_보주_Prices.push(item.currentPrice);
        } else {
          프로스트의_전설_깡통_Prices.push(item.currentPrice);
        }
      }

      const now = new Date();

      // 각 등급별 가격 정보 계산 및 히스토리 저장
      const addToHistory = (
        prices: number[],
        historyKey: keyof GradeHistory
      ) => {
        if (prices.length === 0) return;

        const averagePrice =
          prices.reduce((acc, curr) => acc + curr, 0) / prices.length;
        const lowestPrice = Math.min(...prices);

        this.priceHistory[historyKey].push({
          timestamp: now,
          averagePrice,
          lowestPrice,
          count: prices.length,
        });

        // 히스토리 크기 제한
        if (this.priceHistory[historyKey].length > MAX_HISTORY_SIZE) {
          this.priceHistory[historyKey].shift();
        }
      };

      addToHistory(프로스트의_전설_상급_보주_Prices, 'high');
      addToHistory(프로스트의_전설_중급_보주_Prices, 'middle');
      addToHistory(프로스트의_전설_하급_보주_Prices, 'low');
      addToHistory(프로스트의_전설_깡통_Prices, 'none');

      // 현재 상태 출력
      console.log(`
=== 프로스트의 전설 가격 분석 (${now.toLocaleString()}) ===
┌────────┬──────────┬──────────┬─────────┬────────────┐
│ 등급   │ 개수     │ 평균가   │ 최저가  │ 변동(15초) │
├────────┼──────────┼──────────┼─────────┼────────────┤
${this.formatGradeLine('상급', this.priceHistory.high)}
${this.formatGradeLine('중급', this.priceHistory.middle)}
${this.formatGradeLine('하급', this.priceHistory.low)}
${this.formatGradeLine('깡통', this.priceHistory.none)}
└────────┴──────────┴──────────┴─────────┴────────────┘
`);

      const rawEnchantDatas = uniqWith(
        itemList.rows.map((item) => item.enchant).filter(Boolean)
      );

      console.log('rawEnchantDatas', rawEnchantDatas);

      return itemList;
    } catch (error) {
      this.logger.error('Failed to fetch auction items:', error);
    }
  }

  private formatGradeLine(grade: string, history: PriceHistory[]): string {
    if (history.length === 0)
      return `│ ${grade.padEnd(
        6
      )} │ 0        │ 0        │ 0       │ 0          │`;

    const current = history[history.length - 1];
    const previous = history.length > 1 ? history[history.length - 2] : null;

    const priceChange = previous
      ? Math.floor(
          ((current.averagePrice - previous.averagePrice) /
            previous.averagePrice) *
            100
        )
      : 0;

    const changeStr = (priceChange >= 0 ? '+' : '') + priceChange.toString();

    return `│ ${grade.padEnd(6)} │ ${current.count
      .toString()
      .padEnd(8)} │ ${Math.floor(current.averagePrice)
      .toLocaleString()
      .padEnd(8)} │ ${Math.floor(current.lowestPrice)
      .toLocaleString()
      .padEnd(7)} │ ${changeStr.padEnd(10)} │`;
  }

  async getAuctionItems() {
    const itemList = await getAuctionItems({
      itemName: '프로스트의 전설',
      limit: 400,
      sort: 'unitPrice:desc',
    });
    return itemList;
  }
}
