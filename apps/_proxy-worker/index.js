addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

const DUNDAM_BASE_URL = 'https://dundam.xyz';

async function searchCharacter(name, type, userAgent, rawData = false) {
  try {
    console.log('Searching for character:', name);
    console.log('Type:', type);

    const searchServerType = type === 'adventure' ? 'adven' : 'all';

    const searchResponse = await fetch(`${DUNDAM_BASE_URL}/dat/searchData.jsp?name=${encodeURIComponent(name)}&server=${searchServerType}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/plain, */*',
        'User-Agent': userAgent,
        Origin: DUNDAM_BASE_URL,
        Referer: `${DUNDAM_BASE_URL}/search?server=adven&name=${encodeURIComponent(name)}`,
      },
      body: '{}',
    });

    console.log('API Response status:', searchResponse.status);

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('API Error response:', errorText);
      throw new Error(`Search request failed: ${searchResponse.status}`);
    }

    const responseText = await searchResponse.text();
    console.log('!!DEBUG 던담 API 응답:', responseText);

    // JSON 문자열 추출 (앞뒤 불필요한 텍스트 제거)
    const jsonStr = responseText.replace('Raw HTML response: ', '').trim();

    // 응답이 JSON이 아닌 경우 처리
    if (!jsonStr.startsWith('{') && !jsonStr.startsWith('[')) {
      console.error('!!DEBUG 던담 API 응답이 JSON 형식이 아님:', jsonStr);
      throw new Error('던담 API에서 유효하지 않은 응답을 받았습니다.');
    }

    let data;
    try {
      data = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('!!DEBUG JSON 파싱 실패:', parseError);
      console.error('!!DEBUG 파싱 시도한 문자열:', jsonStr);
      throw new Error('던담 API 응답을 파싱할 수 없습니다.');
    }

    // 데이터 구조 검증
    if (!data || !data.characters || !Array.isArray(data.characters)) {
      console.error('!!DEBUG 던담 API 응답 구조가 예상과 다름:', data);
      throw new Error('던담 API 응답 구조가 올바르지 않습니다.');
    }

    if (rawData) {
      return {
        rawData: data,
        characters: data.characters.map((char) => ({
          name: char.name,
          jobName: char.job,
          baseJob: char.baseJob,
          server: char.server,
          level: char.fame,
          adventureName: char.adventrueName,
          setPoint: char.setPoint,
          skillDamage: char.skillDamage,
          critical: char.cri,
          buffScore: char.buffScore,
          switching: char.switching || '',
          ozma: char.ozma || '',
          bakal: char.bakal || 0,
          key: char.key,
        })),
        total: data.characters.length,
      };
    }

    // 필요한 데이터만 추출하여 변환
    const characters = data.characters.map((char) => ({
      name: char.name,
      jobName: char.job,
      baseJob: char.baseJob,
      server: char.server,
      level: char.fame,
      adventureName: char.adventrueName,
      setPoint: char.setPoint,
      skillDamage: char.skillDamage,
      critical: char.cri,
      buffScore: char.buffScore,
      switching: char.switching || '',
      ozma: char.ozma || '',
      bakal: char.bakal || 0,
      key: char.key,
    }));

    return {
      characters,
      total: characters.length,
    };
  } catch (error) {
    console.error('!!DEBUG Search request failed:', error);
    console.error('!!DEBUG Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    throw error;
  }
}

async function handleRequest(request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept, Origin, Referer, User-Agent',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  const url = new URL(request.url);
  const characterName = url.searchParams.get('name');
  const type = url.searchParams.get('type') || 'character';
  const rawData = url.searchParams.get('rawData') === 'true';
  const userAgent =
    request.headers.get('User-Agent') ||
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36';

  if (!characterName) {
    return new Response('Character name is required', {
      status: 400,
      headers: corsHeaders,
    });
  }

  try {
    console.log('Processing request for character:', characterName);
    console.log('Search type:', type);

    const searchResult = await searchCharacter(characterName, type, userAgent, rawData);
    console.log('Search completed successfully');

    return new Response(JSON.stringify(searchResult), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Request processing failed:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch character data',
        message: '캐릭터 정보를 가져오는데 실패했습니다.',
        details: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
}
