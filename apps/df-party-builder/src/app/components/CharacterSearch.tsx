import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import type { CharacterData, MultiAccount, Group } from '../types/types';
import { CharacterCard } from './CharacterCard/index';
import { useFirebase } from '../context/FirebaseContext';

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

  &:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
  }
`;

const MultiAccountSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  flex: 1;

  &:focus {
    outline: none;
    border-color: #2196f3;
  }

  &:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
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

  &:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
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

  &:hover:not(:disabled) {
    background-color: #1976d2;
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
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

const TabContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #e0e0e0;
  background: #f9f9f9;
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 12px 16px;
  border: none;
  background: ${({ active }) => (active ? 'white' : 'transparent')};
  color: ${({ active }) => (active ? '#2196f3' : '#666')};
  cursor: pointer;
  border-bottom: 2px solid ${({ active }) => (active ? '#2196f3' : 'transparent')};
  font-weight: ${({ active }) => (active ? '600' : '400')};

  &:hover {
    background: ${({ active }) => (active ? 'white' : '#f0f0f0')};
  }
`;

const LoadingMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
  color: #666;
  font-size: 1.1em;
`;

const NoResultsMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
  color: #666;
  font-size: 1.1em;
`;

interface CharacterSearchProps {
  isOpen: boolean;
  groupName?: string;
  onCharacterSelect?: (characterInfo: CharacterData) => void;
  onCharacterDragStart?: (e: React.DragEvent<HTMLDivElement>, character: CharacterData) => void;
}

type SearchType = 'character' | 'adventure' | 'multi-account';

export function CharacterSearch({ isOpen, groupName, onCharacterSelect, onCharacterDragStart }: CharacterSearchProps) {
  const [searchType, setSearchType] = useState<SearchType>('character');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMultiAccount, setSelectedMultiAccount] = useState<string>('');
  const [multiAccounts, setMultiAccounts] = useState<MultiAccount[]>([]);
  const [searchResults, setSearchResults] = useState<{ [key: string]: CharacterData[] }>({});
  const [activeTab, setActiveTab] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const { readData } = useFirebase();

  // 그룹 설정에서 다계정 정보 로드
  useEffect(() => {
    const loadMultiAccounts = async () => {
      if (!groupName) return;

      try {
        // 먼저 전체 group 데이터에서 config 확인
        const groupData = (await readData(`groups/${groupName}`)) as Group;

        let multiAccountsData = groupData?.config?.multiAccounts;

        // config에 multiAccounts가 없으면 별도 경로에서 로드 시도
        if (!multiAccountsData) {
          try {
            const configData = (await readData(`groups/${groupName}/config`)) as any;
            multiAccountsData = configData?.multiAccounts;
          } catch (configError) {}
        }

        if (multiAccountsData && Array.isArray(multiAccountsData)) {
          setMultiAccounts(multiAccountsData);
        } else {
          setMultiAccounts([]);
        }
      } catch (error) {
        console.error('!!DEBUG 다계정 정보 로드 실패:', error);
        setMultiAccounts([]);
      }
    };

    loadMultiAccounts();
  }, [groupName, readData]);

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (searchType === 'multi-account' && !selectedMultiAccount) return;
    if (searchType !== 'multi-account' && !searchTerm.trim()) return;

    setIsSearching(true);
    setSearchResults({});

    try {
      if (searchType === 'multi-account') {
        // 다계정 검색
        const selectedAccount = multiAccounts.find((account) => account.id === selectedMultiAccount);
        if (!selectedAccount) return;

        const results: { [key: string]: CharacterData[] } = {};

        // 각 모험단별로 검색
        for (const adventureName of selectedAccount.adventureNames) {
          try {
            const result = await fetch(`https://dundam-proxy.ruderud00552780.workers.dev/search?name=${adventureName}&type=adventure`);
            const data = await result.json();

            if (data.characters && data.characters.length > 0) {
              results[adventureName] = data.characters;
            }
          } catch (error) {
            console.error(`!!DEBUG 모험단 "${adventureName}" 검색 실패:`, error);
          }
        }

        setSearchResults(results);
        if (Object.keys(results).length > 0) {
          setActiveTab(Object.keys(results)[0]);
        }
      } else {
        // 일반 검색 (캐릭터/모험단)
        const result = await fetch(`https://dundam-proxy.ruderud00552780.workers.dev/search?name=${searchTerm}&type=${searchType}`);
        const data = await result.json();

        if (data.characters && data.characters.length > 0) {
          setSearchResults({ [searchTerm]: data.characters });
          setActiveTab(searchTerm);
        }
      }
    } catch (error) {
      console.error('!!DEBUG 검색 실패:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchType(e.target.value as SearchType);
    setSearchTerm('');
    setSelectedMultiAccount('');
    setSearchResults({});
    setActiveTab('');
  };

  const handleMultiAccountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMultiAccount(e.target.value);
    setSearchResults({});
    setActiveTab('');
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, character: CharacterData) => {
    onCharacterDragStart?.(e, character);
  };

  const isMultiAccountDisabled = multiAccounts.length === 0;
  const isSearchDisabled = (searchType === 'multi-account' && !selectedMultiAccount) || (searchType !== 'multi-account' && !searchTerm.trim()) || isSearching;

  return (
    <SearchContainer>
      <SearchHeader>
        <SearchTitle>캐릭터 검색</SearchTitle>
        <SearchForm onSubmit={handleSearch}>
          <SearchTypeSelect value={searchType} onChange={handleSearchTypeChange} disabled={isMultiAccountDisabled && searchType === 'multi-account'}>
            <option value="character">캐릭터</option>
            <option value="adventure">모험단</option>
            <option value="multi-account" disabled={isMultiAccountDisabled}>
              다계정 {isMultiAccountDisabled ? '(설정 없음)' : ''}
            </option>
          </SearchTypeSelect>

          {searchType === 'multi-account' ? (
            <MultiAccountSelect
              value={selectedMultiAccount}
              onChange={handleMultiAccountChange}
              disabled={isMultiAccountDisabled}
              title={`다계정 ${multiAccounts.length}개 로드됨`}
            >
              <option value="">다계정 선택 ({multiAccounts.length}개)</option>
              {multiAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.username} ({account.adventureNames.length}개 모험단)
                </option>
              ))}
            </MultiAccountSelect>
          ) : (
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`${searchType === 'character' ? '캐릭터' : '모험단'} 이름을 입력하세요`}
              disabled={isSearching}
            />
          )}

          <Button type="submit" disabled={isSearchDisabled}>
            {isSearching ? '검색중...' : '검색'}
          </Button>
        </SearchForm>
      </SearchHeader>

      {Object.keys(searchResults).length > 0 && (
        <TabContainer>
          {Object.keys(searchResults).map((tabName) => (
            <Tab key={tabName} active={activeTab === tabName} onClick={() => setActiveTab(tabName)}>
              {tabName} ({searchResults[tabName].length})
            </Tab>
          ))}
        </TabContainer>
      )}

      <CharacterList>
        {isSearching ? (
          <LoadingMessage>검색중...</LoadingMessage>
        ) : Object.keys(searchResults).length > 0 ? (
          searchResults[activeTab]?.map((character) => <CharacterCard key={character.key} character={character} onDragStart={handleDragStart} />)
        ) : (
          <NoResultsMessage>{searchType === 'multi-account' ? '다계정을 선택하고 검색해주세요' : '검색 결과가 없습니다'}</NoResultsMessage>
        )}
      </CharacterList>
    </SearchContainer>
  );
}
