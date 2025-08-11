import axios from 'axios';
import { CharacterData } from '../types/types';

const dundamProxyInstance = axios.create({
  baseURL: 'https://dundam-proxy.ruderud00552780.workers.dev',
});

type GetDundamDataParams = {
  name: string;
  type: 'character' | 'adventure';
};

export const getDundamData = async (params: GetDundamDataParams): Promise<{ characters: CharacterData[]; total: number }> => {
  const { name, type } = params;
  try {
    const response = await dundamProxyInstance.get(`/search?name=${name}&type=${type}`);
    return response.data;
  } catch (error: any) {
    console.error('!!DEBUG 던담 API 호출 실패:', error);
    if (error.response) {
      console.error('!!DEBUG 에러 응답:', error.response.data);
      console.error('!!DEBUG 에러 상태:', error.response.status);
    }
    throw error;
  }
};
