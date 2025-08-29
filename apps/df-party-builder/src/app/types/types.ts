import { SearchType } from './search';

/**
 * 가장 큰 단위는 그룹
 * 그룹은 여러개의 파티를 목적에 따라 구성하는 단위.
 *
 * 파티는 4명의 파티원으로 만들어지는 최소한의 조직단위.
 */
export type Group = {
  id?: string; // not config yet
  name?: string; // not config yet
  config: GroupConfig;

  dungeons: Dungeon[];
  memo: string;

  lastDundamUpdatedAt?: string; // iso string
};

export type Dungeon = {
  id: string;
  name: string;
  parties: Party[];
};

export type GroupConfig = {
  id: string;
  name: string;
  tags: Tag[];
  multiAccounts: MultiAccount[];
  createdAt: string;
  updatedAt: string;
};

export type RecentGroup = {
  id: Group['id'];
  name: Group['name'];
  lastVisited: string;
};

/**
 * 모험단
 */
export type AdventureGuild = {
  id: string;
  name: string;
  characters: CharacterData[];
  searchTerm?: string;
  searchType?: SearchType;
  shouldSearch?: boolean;
};

/**
 * 파티는 4명의 파티원으로 만들어지는 최소한의 조직단위.
 * 파티원은 캐릭터 데이터 또는 'empty'.
 *
 * MEMO: null 처리시, firebase에서 처리대상으로 누락이 될 수 있어, 'empty'로 처리함.
 */
export type Party = {
  id: string;
  title: string;
  slots: PartySlot[];
  memo: string;
  isCompleted: boolean;
  tags?: string[];
};

export type PartySlot = CharacterData | 'empty';

export type BufferCharacterData = {
  job: string;
  name: string;
  server: string;
  adventureName: string;
  level: string;
  baseJob: string;
  setPoint: string;
  critical: string;
  buffScore: string;
  buffScore3?: string;
  buffScore4?: string;
  skillDamage?: string;
  switching: string;
  rankDamage?: string;
  raidClearCount: number;
  advenRaidClearCount: number;
  key: string;
  adventure: string;
};

export type DamageCharacterData = {
  job: string;
  name: string;
  server: string;
  adventureName: string;
  level: string;
  baseJob: string;
  setPoint: string;
  skillDamage: string;
  critical: string;
  rankDamage: string;
  switching: string;
  raidClearCount: number;
  advenRaidClearCount: number;
  key: string;
  adventure: string;
};

export type CharacterData = BufferCharacterData | DamageCharacterData;

export type ChipColor = {
  background: string;
  text: string;
  border: string;
};

export type Tag = {
  id: string;
  name: string;
  color: ChipColor;
};

export type MultiAccount = {
  id: string;
  username: string;
  adventureNames: string[];
  createdAt: string;
  updatedAt: string;
};
