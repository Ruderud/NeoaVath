import { describe, it, expect } from 'vitest';
import { getAuctionItems, getServers } from './df-api';

// 통합 테스트는 실제 API를 호출합니다
describe('dfApi Integration Tests', () => {
  // 이 테스트는 실제 API를 호출하므로 시간이 오래 걸릴 수 있습니다
  it('should fetch real server list', async () => {
    const result = await getServers();
    expect(result).toBeDefined();
    expect(result.rows).toBeInstanceOf(Array);
  });

  it('should fetch real auction items', async () => {
    const result = await getAuctionItems({
      itemName: '무색 큐브 조각',
      limit: 10,
      sort: 'unitPrice:asc',
    });
    console.log('getAuctionItems result', result);
    expect(result).toBeDefined();
    expect(result.rows).toBeInstanceOf(Array);
  });
});
