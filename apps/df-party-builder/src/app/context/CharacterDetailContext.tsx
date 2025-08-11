import { createContext, useContext, useState, ReactNode } from 'react';
import type { CharacterData } from '../types/types';

type CharacterDetailContextType = {
  showCharacterDetail: (character: CharacterData) => void;
  hideCharacterDetail: () => void;
  selectedCharacter: CharacterData | null;
  isOpen: boolean;
};

const CharacterDetailContext = createContext<CharacterDetailContextType | undefined>(undefined);

type CharacterDetailProviderProps = {
  children: ReactNode;
};

export function CharacterDetailProvider({ children }: CharacterDetailProviderProps) {
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterData | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const showCharacterDetail = (character: CharacterData) => {
    setSelectedCharacter(character);
    setIsOpen(true);
  };

  const hideCharacterDetail = () => {
    setIsOpen(false);
    setSelectedCharacter(null);
  };

  return (
    <CharacterDetailContext.Provider
      value={{
        showCharacterDetail,
        hideCharacterDetail,
        selectedCharacter,
        isOpen,
      }}
    >
      {children}
    </CharacterDetailContext.Provider>
  );
}

export function useCharacterDetail() {
  const context = useContext(CharacterDetailContext);
  if (context === undefined) {
    throw new Error('useCharacterDetail must be used within a CharacterDetailProvider');
  }
  return context;
}
