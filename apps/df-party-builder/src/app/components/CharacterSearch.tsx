import { useState } from 'react';
import styled from '@emotion/styled';
import { fetchDundamInfo } from '../api/dundam';

const SearchContainer = styled.div`
  margin: 20px 0;
`;

const SearchForm = styled.form`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
`;

const Input = styled.input`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  flex: 1;
`;

const Button = styled.button`
  padding: 8px 16px;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #1976d2;
  }
`;

const CharacterList = styled.div`
  display: grid;
  gap: 16px;
`;

const CharacterCard = styled.div`
  padding: 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: white;
`;

const CharacterInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;

  span:first-of-type {
    font-weight: bold;
    color: #666;
    font-size: 0.9em;
  }

  span:last-of-type {
    font-size: 1.1em;
  }
`;

interface CharacterSearchProps {
  onCharacterSelect?: (characterInfo: any) => void;
}

export function CharacterSearch({ onCharacterSelect }: CharacterSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [characters, setCharacters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const results = await fetchDundamInfo(searchTerm);
      console.log('results', results);
      setCharacters(results);
    } catch (err) {
      setError('캐릭터 정보를 가져오는데 실패했습니다.');
      setCharacters([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SearchContainer>
      <SearchForm onSubmit={handleSearch}>
        <Input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="캐릭터명을 입력하세요" />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? '검색 중...' : '검색'}
        </Button>
      </SearchForm>

      {error && <div style={{ color: 'red', marginBottom: '16px' }}>{error}</div>}

      <CharacterList>
        {characters.map((char, index) => (
          <CharacterCard key={index} onClick={() => onCharacterSelect?.(char)} style={{ cursor: onCharacterSelect ? 'pointer' : 'default' }}>
            <CharacterInfo>
              <InfoItem>
                <span>서버</span>
                <span>{char.server}</span>
              </InfoItem>
              <InfoItem>
                <span>직업</span>
                <span>{char.job}</span>
              </InfoItem>
              <InfoItem>
                <span>캐릭터명</span>
                <span>{char.name}</span>
              </InfoItem>
              <InfoItem>
                <span>모험단</span>
                <span>{char.adventureName}</span>
              </InfoItem>
              <InfoItem>
                <span>레벨</span>
                <span>{char.level}</span>
              </InfoItem>
              {char.buffScore && (
                <InfoItem>
                  <span>버프 점수</span>
                  <span>{char.buffScore}</span>
                </InfoItem>
              )}
              {char.damage && (
                <InfoItem>
                  <span>데미지</span>
                  <span>{char.damage}</span>
                </InfoItem>
              )}
              <InfoItem>
                <span>세트 포인트</span>
                <span>{char.setPoint}</span>
              </InfoItem>
              <InfoItem>
                <span>크리티컬</span>
                <span>{char.criticalRate}%</span>
              </InfoItem>
            </CharacterInfo>
          </CharacterCard>
        ))}
      </CharacterList>
    </SearchContainer>
  );
}
