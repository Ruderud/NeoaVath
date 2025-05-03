import { Injectable } from '@nestjs/common';
import { getAuctionItems } from '@neoavath/neople-api';

@Injectable()
export class AppService {
  getData(): { message: string } {
    return { message: 'Hello API-15' };
  }

  async getAuctionItems() {
    const itemList = await getAuctionItems({
      itemName: '무색 큐브 조각',
      limit: 10,
      sort: 'unitPrice:asc',
    });
    return itemList;
  }
}
