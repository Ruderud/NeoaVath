export type Server = {
  serverId: string;
  serverName: string;
};

export type Character = {
  serverId: Server['serverId'];
  characterId: string;
  characterName: string;
  level: number;
  jobId: string;
  jobGrowId: string;
  jobName: string;
  jobGrowName: string;
  fame: number;
};

/**
 * 아이템에 발린 보주 타입
 */
export enum EnchantCategoryKeys {
  STATUS = 'status',
  REINFORCE_SKILL = 'reinforceSkill',
}

export type AuctionItem = {
  auctionNo: number;
  regDate: string; // YYYY-MM-DD HH:MM:SS
  expireDate: string; // YYYY-MM-DD HH:MM:SS
  itemId: string;
  itemName: string;
  itemAvailableLevel: number;
  itemRarity: string;
  itemTypeId: string;
  itemType: string;
  itemTypeDetailId: string;
  itemTypeDetail: string;
  refine: number;
  reinforce: number;
  amplificationName: string | null;
  fame: number;
  seal: object;
  count: number;
  price: number;
  currentPrice: number;
  unitPrice: number;
  averagePrice: number;
  enchant?: Partial<Record<EnchantCategoryKeys, object[]>>;
};
