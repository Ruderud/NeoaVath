interface CharacterInfo {
  server: string;
  job: string;
  name: string;
  adventureName: string;
  level: string;
  buffScore?: string;
  damage?: string;
  setPoint: string;
  criticalRate: string;
}

export async function fetchDundamInfo(
  characterName: string
): Promise<CharacterInfo[]> {
  try {
    const response = await fetch(
      `/dundam/search?server=adven&name=${encodeURIComponent(characterName)}`
    );
    const html = await response.text();
    console.log('html', html);
    // HTML 파싱을 위한 DOMParser 사용
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // 캐릭터 정보 추출
    const elements = Array.from(doc.querySelectorAll('.scon'));
    return elements.map((el) => {
      const server =
        el.querySelector('.seh_sever .sev')?.textContent?.trim() || '';
      const job = el.querySelector('.seh_job .sev')?.textContent?.trim() || '';
      const nameElement = el.querySelector('.seh_name .name');
      const name = nameElement?.firstChild?.textContent?.trim() || '';
      const adventureName =
        nameElement?.querySelector('.introd')?.textContent?.trim() || '';
      const level =
        el.querySelector('.seh_name .level .val')?.textContent?.trim() || '';
      const buffScore =
        el.querySelector('.stat_b .statc .val')?.textContent?.trim() || '';
      const damage =
        el.querySelector('.stat_a .statc .val')?.textContent?.trim() || '';
      const setPoint =
        el.querySelector('.sainf-tr .saninf-setp')?.textContent?.trim() || '';
      const criticalRate =
        el.querySelector('.sainf-tr .saint-critical')?.textContent?.trim() ||
        '';

      return {
        server,
        job,
        name,
        adventureName,
        level,
        buffScore,
        damage,
        setPoint,
        criticalRate,
      };
    });
  } catch (error) {
    console.error('Error fetching Dundam data:', error);
    throw new Error('던담 데이터를 가져오는데 실패했습니다.');
  }
}
