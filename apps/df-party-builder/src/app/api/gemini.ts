import axios from 'axios';

const dundamProxyInstance = axios.create({
  baseURL: 'https://dundam-proxy.ruderud00552780.workers.dev',
});

type GeminiResponse = {
  response: string;
};

type GeminiResponseWithDetails = {
  success: boolean;
  response: string;
  finishReason: string;
  usage: {
    promptTokens: number;
    responseTokens: number;
    totalTokens: number;
  } | null;
  modelVersion: string;
  responseId: string;
  rawData: any;
};

export const callGeminiAPI = async (prompt: string, rawData = false): Promise<GeminiResponse | GeminiResponseWithDetails> => {
  try {
    console.log('!!DEBUG Gemini API 호출 시작:', prompt);

    const response = await dundamProxyInstance.get(`/api/gemini?prompt=${encodeURIComponent(prompt)}&rawData=${rawData}`);

    console.log('!!DEBUG Gemini API 응답:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('!!DEBUG Gemini API 호출 실패:', error);
    if (error.response) {
      console.error('!!DEBUG 에러 응답:', error.response.data);
      console.error('!!DEBUG 에러 상태:', error.response.status);
    }
    throw error;
  }
};
