import { useState, useCallback } from 'react';
import styled from '@emotion/styled';
import { useDundamQuery } from '../hooks/remote/useDundamQuery';
import type { CharacterData } from '../types/types';
import { X } from 'lucide-react';
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

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #333;
  }
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
  white-space: nowrap;

  &:hover {
    background-color: #1976d2;
  }
`;

const CharacterList = styled.div`
  display: flex;
  gap: 16px;
  padding: 16px;
  overflow-x: auto;
  overflow-y: hidden;
  flex: 1;

  &::-webkit-scrollbar {
    height: 8px;
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

interface CharacterSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onCharacterSelect?: (characterInfo: CharacterData) => void;
  onCharacterDragStart?: (e: React.DragEvent<HTMLDivElement>, partyId: string, slotIndex: number, character: CharacterData) => void;
}

export function CharacterSearch({ isOpen, onClose, onCharacterSelect, onCharacterDragStart }: CharacterSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const { data, isLoading, error } = useDundamQuery(debouncedSearchTerm, 'character');

  const debouncedSetSearchTerm = useCallback(
    debounce((value: string) => {
      setDebouncedSearchTerm(value);
    }, 500),
    [],
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSetSearchTerm(value);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, character: CharacterData) => {
    e.dataTransfer.setData('character', JSON.stringify(character));
    e.dataTransfer.setData('type', 'character');
    e.currentTarget.classList.add('dragging');
    onCharacterDragStart?.(e, '', -1, character);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('dragging');
  };

  return (
    <SearchContainer className={isOpen ? '' : 'closed'}>
      <SearchHeader>
        <SearchTitle>캐릭터 검색</SearchTitle>
        <SearchForm onSubmit={handleSearch}></SearchForm>
        <Input type="text" value={searchTerm} onChange={handleInputChange} placeholder="캐릭터명을 입력하세요" />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? '검색 중...' : '검색'}
        </Button>
      </SearchHeader>

      {error && <div style={{ color: 'red', marginBottom: '16px' }}>캐릭터 정보를 가져오는데 실패했습니다.</div>}

      <CharacterList>
        {data?.characters.map((char) => (
          <CharacterCard key={char.key} character={char} onClick={() => onCharacterSelect?.(char)} onDragStart={(e) => handleDragStart(e, char)} />
        ))}
      </CharacterList>
    </SearchContainer>
  );
}
