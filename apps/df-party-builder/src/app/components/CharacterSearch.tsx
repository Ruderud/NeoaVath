import { useState, useCallback, useRef } from 'react';
import styled from '@emotion/styled';
import { useDundamQuery } from '../hooks/remote/useDundamQuery';
import type { CharacterData } from '../types/types';
import { CharacterCard } from './CharacterCard';
import { debounce } from 'es-toolkit';

const SearchContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-radius: 8px;
  overflow: hidden;
`;

const SearchHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  height: 60px;
`;

const SearchTitle = styled.h2`
  font-size: 1.5em;
  font-weight: 600;
  color: #333;
  margin: 0;
  white-space: nowrap;
`;

const SearchForm = styled.form`
  display: flex;
  gap: 10px;
  flex: 1;
`;

const SearchTypeSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  min-width: 120px;

  &:focus {
    outline: none;
    border-color: #2196f3;
  }
`;

const Input = styled.input`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  flex: 1;

  &:focus {
    outline: none;
    border-color: #2196f3;
  }
`;

const Button = styled.button`
  padding: 8px 16px;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background-color: #1976d2;
  }
`;

const CharacterList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 16px;
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
  position: relative;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`;

const NoResultsMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100px;
  color: #666;
  font-size: 1rem;
  font-style: italic;
`;

interface CharacterSearchProps {
  isOpen: boolean;
  onCharacterSelect?: (characterInfo: CharacterData) => void;
  onCharacterDragStart?: (e: React.DragEvent<HTMLDivElement>, character: CharacterData) => void;
  dungeons: Array<{
    id: string;
    name: string;
    parties: Array<{
      id: string;
      title: string;
      slots: Array<CharacterData | 'empty'>;
    }>;
  }>;
}

type SearchType = 'character' | 'adventure';

export function CharacterSearch({ isOpen, onCharacterSelect, onCharacterDragStart, dungeons }: CharacterSearchProps) {
  const [searchParams, setSearchParams] = useState<{ name: string; type: SearchType }>({ name: '', type: 'character' });
  const { data, isLoading, error } = useDundamQuery(searchParams.name, searchParams.type);
  const [hoveredCharacter, setHoveredCharacter] = useState<CharacterData | null>(null);
  const [helperText, setHelperText] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const findCharacterParties = useCallback(
    (character: CharacterData) => {
      const characterParties = dungeons.flatMap((dungeon) =>
        dungeon.parties
          .filter((party) => party.slots.some((slot) => slot !== 'empty' && slot.key === character.key))
          .map((party) => ({
            dungeonName: dungeon.name,
            partyTitle: party.title,
          })),
      );

      if (characterParties.length === 0) return '';

      return characterParties.map(({ dungeonName, partyTitle }) => `${dungeonName} - ${partyTitle}`).join('\n');
    },
    [dungeons],
  );

  const handleMouseEnter = useCallback(
    (character: CharacterData) => {
      setHoveredCharacter(character);
      const parties = findCharacterParties(character);
      setHelperText(parties);
    },
    [findCharacterParties],
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredCharacter(null);
    setHelperText('');
  }, []);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const searchInputValue = searchInputRef.current?.value;
    if (!searchInputValue) return;

    setSearchParams((prev) => ({ ...prev, name: searchInputValue }));
  };

  const handleSearchTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchParams((prev) => ({ ...prev, type: e.target.value as SearchType }));
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, character: CharacterData) => {
    e.dataTransfer.setData('data', JSON.stringify(character));
    e.dataTransfer.setData('type', 'character');
    e.currentTarget.classList.add('dragging');
    onCharacterDragStart?.(e, character);
  };

  return (
    <SearchContainer className={isOpen ? '' : 'closed'}>
      <SearchHeader>
        <SearchTitle>캐릭터 검색</SearchTitle>
        <SearchForm onSubmit={handleSearch}>
          <SearchTypeSelect value={searchParams.type} onChange={handleSearchTypeChange}>
            <option value="character">캐릭터명</option>
            <option value="adventure">모험단명</option>
          </SearchTypeSelect>
          <Input ref={searchInputRef} type="text" placeholder={searchParams.type === 'character' ? '캐릭터명을 입력하세요' : '모험단명을 입력하세요'} />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? '검색 중...' : '검색'}
          </Button>
        </SearchForm>
      </SearchHeader>

      {error && <div style={{ color: 'red', marginBottom: '16px' }}>캐릭터 정보를 가져오는데 실패했습니다.</div>}

      <CharacterList>
        {data ? (
          data.characters.map((character) => (
            <CharacterCard
              key={character.key}
              character={character}
              onClick={() => onCharacterSelect?.(character)}
              onDragStart={(e) => handleDragStart(e, character)}
              helperText={hoveredCharacter?.key === character.key ? helperText : ''}
              onMouseEnter={() => handleMouseEnter(character)}
              onMouseLeave={handleMouseLeave}
              width={200}
              height={280}
            />
          ))
        ) : (
          <NoResultsMessage>검색 결과가 없습니다.</NoResultsMessage>
        )}
      </CharacterList>
    </SearchContainer>
  );
}
