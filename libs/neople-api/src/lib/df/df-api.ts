import { NEOPLE_API_KEY, NEOPLE_API_URL } from '../neople-api.const.ts';
import axios from 'axios';
import { AuctionItem, Character, Server } from './df-api.service.types.ts';
import {
  GetAuctionItemsParams,
  GetCharacterTimelineParams,
  GetItemSearchParams,
  GetServerCharactorParams,
} from './df-api.query.types.ts';

export const axiosInstance = axios.create({
  baseURL: NEOPLE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  params: {
    apikey: NEOPLE_API_KEY,
  },
});

/**
 * 본 api는 https://developers.neople.co.kr/contents/apiDocs 에서 확인 가능
 */

/**
 * 1. 서버 목록 조회
 */
export const getServers = async (): Promise<{ rows: Server[] }> => {
  const response = await axiosInstance.get('/df/servers');
  return response.data;
};

/**
 * 2. 캐릭터 목록 조회
 */
export const getCharacters = async (
  params: GetServerCharactorParams
): Promise<{ rows: Character[] }> => {
  const { serverId, ...restParams } = params;
  const response = await axiosInstance.get(
    `/df/servers/${serverId}/characters`,
    { params: restParams }
  );
  return response.data;
};

/**
 * 4. 캐릭터 타임라인 조회
 */
export const getCharacterTimeline = async (
  params: GetCharacterTimelineParams
): Promise<{ timeline: unknown[] }> => {
  const { serverId, characterId, ...restParams } = params;
  const response = await axiosInstance.get(
    `/df/servers/${serverId}/characters/${characterId}/timeline`,
    { params: restParams }
  );
  return response.data;
};

/**
 * 16. 경매장 등록 아이템 검색
 */
export const getAuctionItems = async (
  params: GetAuctionItemsParams
): Promise<{ rows: AuctionItem[] }> => {
  const response = await axiosInstance.get(`/df/auction`, { params });
  return response.data;
};

/**
 * 24. 아이템 검색
 */
export const getItemSearch = async (
  params: GetItemSearchParams
): Promise<{ rows: unknown[] }> => {
  const response = await axiosInstance.get(`/df/items`, { params });
  return response.data;
};

/**
 * 24. 아이템 상세정보
 */
export const getItemDetail = async (
  itemId: string
): Promise<{ rows: unknown[] }> => {
  const response = await axiosInstance.get(`/df/items/${itemId}`);
  return response.data;
};
