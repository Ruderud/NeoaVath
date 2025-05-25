import axios from 'axios';

const dundamProxyInstance = axios.create({
  baseURL: 'https://dundam-proxy.ruderud00552780.workers.dev',
});

type GetDundamDataParams = {
  name: string;
  type: 'character' | 'adventure';
};

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

export const getDundamData = async (params: GetDundamDataParams): Promise<{ characters: CharacterData[]; total: number }> => {
  const { name, type } = params;
  const response = await dundamProxyInstance.get(`/search?name=${name}&type=${type}`);
  return response.data;
};
