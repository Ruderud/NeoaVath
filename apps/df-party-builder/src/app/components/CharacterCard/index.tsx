import styled from '@emotion/styled';
import type { CharacterData } from '../../types/types';

type CharacterCardProps = {
  character: CharacterData;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, character: CharacterData) => void;
  onClick?: () => void;
};

export function CharacterCard({ character, onDragStart, onClick }: CharacterCardProps) {
  return (
    <Card draggable={!!onDragStart} onDragStart={(e) => onDragStart?.(e, character)} onClick={onClick}>
      <JobIcon>{character.job}</JobIcon>
      <CharacterInfo>
        <CharacterName>{character.name}</CharacterName>
        <ServerName>{character.server}</ServerName>
      </CharacterInfo>
    </Card>
  );
}

const Card = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f5f5f5;
  }
`;

const JobIcon = styled.div`
  width: 32px;
  height: 32px;
  background: #eee;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8em;
  color: #666;
`;

const CharacterInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const CharacterName = styled.div`
  font-weight: 600;
  font-size: 0.9em;
`;

const ServerName = styled.div`
  font-size: 0.8em;
  color: #666;
`;
