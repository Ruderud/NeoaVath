import { useState } from 'react';
import { Info as InfoIcon, X } from 'lucide-react';
import type { CharacterData } from '../../types/types';
import { useCharacterDetail } from '../../context/CharacterDetailContext';
import { CharacterCard as StyledComponents } from './styles';

type CharacterCardProps = React.HTMLAttributes<HTMLDivElement> & {
  character: CharacterData;
  helperText?: string;
  width?: number;
  height?: number;
  onDelete?: () => void;
};

export function CharacterCard(props: CharacterCardProps) {
  const { character, helperText, width, height, onDelete, ...restCardProps } = props;
  const { showCharacterDetail } = useCharacterDetail();
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  const handleDetailClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    showCharacterDetail(character);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (helperText) {
      setIsTooltipVisible(true);
    }
    restCardProps.onMouseEnter?.(e);
  };
  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (helperText) {
      setIsTooltipVisible(false);
    }
    restCardProps.onMouseLeave?.(e);
  };

  return (
    <StyledComponents.Container {...restCardProps} width={width} height={height} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {/* icon button Section */}
      <StyledComponents.DetailButton onClick={handleDetailClick}>
        <InfoIcon size={14} />
      </StyledComponents.DetailButton>
      {onDelete && (
        <StyledComponents.DeleteButton onClick={handleDeleteClick}>
          <X size={14} />
        </StyledComponents.DeleteButton>
      )}

      {/* image Section */}
      <StyledComponents.ImageContainer>
        <img
          src={`https://img-api.neople.co.kr/df/servers/${character.server}/characters/${character.key}?zoom=1`}
          alt={`${character.name} 캐릭터 이미지`}
          draggable="false"
        />
      </StyledComponents.ImageContainer>

      {/* info Section */}
      <StyledComponents.Info>
        <StyledComponents.MainInfo>
          <div className="level">명성 {character.level}</div>
          <div className="name">{character.name}</div>
          <div className="adventure">{character.adventureName}</div>
        </StyledComponents.MainInfo>
        {character.buffScore ? (
          <div className="score">버프력 {character.buffScore}</div>
        ) : character.rankDamage ? (
          <div className="score">랭킹 {character.rankDamage}</div>
        ) : null}
      </StyledComponents.Info>

      {/* tooltip Section - card center popup */}
      {helperText && <StyledComponents.Tooltip visible={isTooltipVisible}>{helperText}</StyledComponents.Tooltip>}
    </StyledComponents.Container>
  );
}
