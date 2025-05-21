import styled from '@emotion/styled';
import { Suspense, useState } from 'react';
import { AdventureGuild, CharacterData } from '../../../types/types';
import { SearchType } from '../../../types/search';
import { useDundamQuery } from '../../../hooks/remote/useDundamQuery';
import { DundamFrame } from '../../../components/DundamFrame';

interface SearchResultProps {
  memberId: string;
  searchTerm: string;
  searchType: SearchType;
  onCharacterSelect: (character: CharacterData) => void;
}

function SearchResult({ memberId, searchTerm, searchType, onCharacterSelect }: SearchResultProps) {
  const { data: searchResult } = useDundamQuery(searchTerm, searchType);

  if (!searchResult) return null;
  if (searchResult.characters.length === 0) return <NoResultText>검색 결과가 없습니다.</NoResultText>;

  return <DundamFrame characters={searchResult.characters} onCharacterSelect={onCharacterSelect} />;
}

export function SideMenu() {
  const [adventureGuilds, setAdventureGuilds] = useState<AdventureGuild[]>([]);
  const [searchStates, setSearchStates] = useState<Record<string, { name: string; type: SearchType }>>({});
  const [activeSearchId, setActiveSearchId] = useState<string | null>(null);

  const handleSearch = (memberId: string) => {
    const searchState = searchStates[memberId];
    if (!searchState?.name) return;

    setAdventureGuilds((members) =>
      members.map((m) =>
        m.id === memberId
          ? {
              ...m,
              searchTerm: searchState.name,
              searchType: searchState.type,
              shouldSearch: true,
            }
          : m,
      ),
    );
    setActiveSearchId(memberId);
  };

  const handleCharacterDataUpdate = (data: CharacterData[], memberId: string) => {
    setAdventureGuilds((members) =>
      members.map((m) =>
        m.id === memberId
          ? {
              ...m,
              characters: [...m.characters, ...data],
              shouldSearch: false,
            }
          : m,
      ),
    );
    setActiveSearchId(null);
  };

  const addAdventureGuild = () => {
    const newMember: AdventureGuild = {
      id: Date.now().toString(),
      name: '새 팀원',
      characters: [],
      searchTerm: '',
      searchType: SearchType.CHARACTER,
      shouldSearch: false,
    };
    setAdventureGuilds([...adventureGuilds, newMember]);
  };

  return (
    <SideMenuContainer>
      <SectionTitle>팀 관리</SectionTitle>
      <Button onClick={addAdventureGuild}>모험단 추가</Button>
      <TeamMemberList>
        {adventureGuilds.map((member) => (
          <div key={member.id}>
            <SearchContainer>
              <input
                type="text"
                value={member.name}
                onChange={(e) => setAdventureGuilds((members) => members.map((m) => (m.id === member.id ? { ...m, name: e.target.value } : m)))}
                placeholder="팀원 이름"
                style={{ marginBottom: '8px' }}
              />
              <div className="search-row">
                <select
                  value={searchStates[member.id]?.type || SearchType.CHARACTER}
                  onChange={(e) =>
                    setSearchStates((prev) => ({
                      ...prev,
                      [member.id]: { ...prev[member.id], type: e.target.value as SearchType },
                    }))
                  }
                >
                  <option value={SearchType.CHARACTER}>캐릭터</option>
                  <option value={SearchType.ADVENTURE}>모험단</option>
                </select>
                <input
                  type="text"
                  value={searchStates[member.id]?.name || ''}
                  onChange={(e) =>
                    setSearchStates((prev) => ({
                      ...prev,
                      [member.id]: { ...prev[member.id], name: e.target.value },
                    }))
                  }
                  placeholder={`${searchStates[member.id]?.type === SearchType.CHARACTER ? '캐릭터명' : '모험단명'} 검색`}
                  style={{ flex: 1 }}
                />
                <Button onClick={() => handleSearch(member.id)} style={{ width: 'auto', margin: 0 }}>
                  검색
                </Button>
              </div>
            </SearchContainer>
            {member.shouldSearch && member.id === activeSearchId && member.searchTerm && (
              <Suspense fallback={<LoadingText>검색 중...</LoadingText>}>
                <SearchResult
                  memberId={member.id}
                  searchTerm={member.searchTerm}
                  searchType={member.searchType || SearchType.CHARACTER}
                  onCharacterSelect={(character) => handleCharacterDataUpdate([character], member.id)}
                />
              </Suspense>
            )}
          </div>
        ))}
      </TeamMemberList>
    </SideMenuContainer>
  );
}

const SideMenuContainer = styled.div`
  background: white;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #ddd;
  height: fit-content;
  width: 300px;
  position: sticky;
  top: 20px;
  overflow: hidden;
`;

const SectionTitle = styled.h2`
  margin-bottom: 16px;
  font-size: 1.5em;
  color: #333;
`;

const Button = styled.button`
  padding: 8px 16px;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  width: 100%;
  margin-bottom: 12px;

  &:hover {
    background-color: #1976d2;
  }
`;

const TeamMemberList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
  width: 100%;
  overflow-x: hidden;
`;

const SearchContainer = styled.div`
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
  width: 100%;
`;

const LoadingText = styled.div`
  text-align: center;
  color: #666;
  padding: 16px;
`;

const NoResultText = styled.div`
  text-align: center;
  color: #666;
  padding: 16px;
`;

const SearchResultList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
`;

const SearchResultItem = styled.div`
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #f5f5f5;
    border-color: #2196f3;
  }

  .character-info {
    .name {
      font-weight: 600;
      margin-bottom: 4px;
    }

    .server {
      color: #666;
      font-size: 0.9em;
    }

    .level {
      color: #2196f3;
      font-size: 0.9em;
    }
  }
`;
