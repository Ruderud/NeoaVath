import { SearchType } from './search';

/**
 * 가장 큰 단위는 그룹
 * 그룹은 여러개의 파티를 목적에 따라 구성하는 단위.
 *
 * 파티는 4명의 파티원으로 만들어지는 최소한의 조직단위.
 */

export type RecentGroup = {
  id: string;
  name: string;
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
  slots: [PartySlot, PartySlot, PartySlot, PartySlot];
  memo: string;
};

export type PartySlot = CharacterData | 'empty';

export type CharacterData = {
  job: string;
  name: string;
  server: string;
  adventureName: string;
  level: string;
  baseJob: string;
  setPoint: string;
  skillDamage: string;
  critical: string;
  buffScore: string;
  switching: string;
  ozma: string;
  bakal: number;
  key: string;
};
