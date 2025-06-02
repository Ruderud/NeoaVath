import axios from 'axios';

const dundamProxyInstance = axios.create({
  baseURL: 'https://dundam-proxy.ruderud00552780.workers.dev',
});

type GetDundamDataParams = {
  name: string;
  type: 'character' | 'adventure';
};

export const getDundamData = async (params: GetDundamDataParams): Promise<{ characters: CharacterData[]; total: number }> => {
  const { name, type } = params;
  const response = await dundamProxyInstance.get(`/search?name=${name}&type=${type}`);
  return response.data;
};
