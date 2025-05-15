addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

const DUNDAM_BASE_URL = 'https://dundam.xyz';

async function searchCharacter(name) {
  try {
    console.log('Searching for character:', name);

    const searchResponse = await fetch(
      `${DUNDAM_BASE_URL}/dat/searchData.jsp?name=${encodeURIComponent(
        name
      )}&server=adven`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/plain, */*',
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
          Origin: DUNDAM_BASE_URL,
          Referer: `${DUNDAM_BASE_URL}/search?server=adven&name=${encodeURIComponent(
            name
          )}`,
        },
        body: '{}',
      }
    );

    console.log('API Response status:', searchResponse.status);

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('API Error response:', errorText);
      throw new Error(`Search request failed: ${searchResponse.status}`);
    }

    const responseText = await searchResponse.text();
    // JSON 문자열 추출 (앞뒤 불필요한 텍스트 제거)
    const jsonStr = responseText.replace('Raw HTML response: ', '').trim();
    const data = JSON.parse(jsonStr);

    // 필요한 데이터만 추출하여 변환
    const characters = data.characters.map((char) => ({
      name: char.name,
      jobName: char.job,
      baseJob: char.baseJob,
      server: char.server,
      level: char.fame, // 명성치를 레벨로 사용
      adventureName: char.adventrueName,
      // 추가 정보
      setPoint: char.setPoint,
      skillDamage: char.skillDamage,
      critical: char.cri,
      buffScore: char.buffScore,
      switching: char.switching || '',
      ozma: char.ozma || '',
      bakal: char.bakal || 0,
      key: char.key, // 캐릭터 이미지 URL용 key 추가
    }));

    return {
      characters,
      total: characters.length,
    };
  } catch (error) {
    console.error('Search request failed:', error);
    throw error;
  }
}

async function handleRequest(request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Accept, Origin, Referer, User-Agent',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  const url = new URL(request.url);
  const characterName = url.searchParams.get('name');

  if (!characterName) {
    return new Response('Character name is required', {
      status: 400,
      headers: corsHeaders,
    });
  }

  try {
    console.log('Processing request for character:', characterName);

    const searchResult = await searchCharacter(characterName);
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
      }
    );
  }
}
