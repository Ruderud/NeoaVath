import { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';

const ResultContainer = styled.div`
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  width: 100%;
  overflow-x: hidden;
`;

const CharacterCard = styled.div`
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease-in-out;
  cursor: move;
  min-height: 240px;
  width: 100%;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const CharacterImage = styled.div`
  width: auto;
  height: 100px;
  border-radius: 4px;
  overflow: hidden;
  position: relative;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    pointer-events: none; // 이미지 드래그 방지
  }
`;

const CharacterInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-align: center;
  width: 100%;
`;

const MainInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: 100%;

  .level {
    font-size: 1em;
    font-weight: 600;
    color: #2196f3;
  }

  .name {
    font-size: 0.95em;
    font-weight: 600;
  }

  .adventure {
    color: #666;
    font-size: 0.85em;
  }

  .score {
    margin-top: 2px;
    font-weight: 500;
    color: #e91e63;
    font-size: 0.9em;
  }
`;

export interface CharacterData {
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
}

interface DundamFrameProps {
  characterName?: string;
  shouldSearch?: boolean;
  searchType?: 'character' | 'adventure';
  onCharacterDataUpdate?: (data: CharacterData[]) => void;
}

export function DundamFrame({
  characterName,
  shouldSearch,
  searchType = 'character',
  onCharacterDataUpdate,
}: DundamFrameProps) {
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const prevSearchRef = useRef(false);

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    char: CharacterData
  ) => {
    e.dataTransfer.setData('character', JSON.stringify(char));
  };

  const fetchCharacterData = async (name: string) => {
    try {
      const response = await fetch(
        `https://dundam-proxy.ruderud00552780.workers.dev?name=${encodeURIComponent(
          name
        )}&type=${searchType}`
      );

      if (!response.ok) {
        throw new Error('Worker API 요청 실패');
      }

      const data = await response.json();
      const characters = data.characters.map((char: any) => ({
        job: char.jobName,
        name: char.name,
        server: char.server,
        adventureName: char.adventureName,
        level: char.level,
        baseJob: char.baseJob,
        setPoint: char.setPoint,
        skillDamage: char.skillDamage,
        critical: char.critical,
        buffScore: char.buffScore,
        switching: char.switching,
        ozma: char.ozma,
        bakal: char.bakal,
        key: char.key,
      }));

      setCharacters(characters);
      onCharacterDataUpdate?.(characters);
    } catch (error) {
      console.error('캐릭터 데이터 가져오기 실패:', error);
    }
  };

  useEffect(() => {
    if (characterName && shouldSearch && !prevSearchRef.current) {
      fetchCharacterData(characterName);
      prevSearchRef.current = true;
    } else if (!shouldSearch) {
      prevSearchRef.current = false;
    }
  }, [characterName, shouldSearch]);

  return (
    <ResultContainer>
      {characters.map((char, index) => (
        <CharacterCard
          key={char.key || index}
          draggable
          onDragStart={(e) => handleDragStart(e, char)}
        >
          <CharacterImage>
            <img
              src={`https://img-api.neople.co.kr/df/servers/${char.server}/characters/${char.key}?zoom=1`}
              alt={`${char.name} 캐릭터 이미지`}
              draggable="false"
            />
          </CharacterImage>
          <CharacterInfo>
            <MainInfo>
              <div className="level">명성 {char.level}</div>
              <div className="name">{char.name}</div>
              <div className="adventure">{char.adventureName}</div>
              {char.buffScore ? (
                <div className="score">버프력 {char.buffScore}</div>
              ) : char.ozma ? (
                <div className="score">랭킹 {char.ozma}</div>
              ) : null}
            </MainInfo>
          </CharacterInfo>
        </CharacterCard>
      ))}
    </ResultContainer>
  );
}
