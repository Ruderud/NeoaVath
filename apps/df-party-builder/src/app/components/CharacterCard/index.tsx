import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const showMultipleBuffScore = Boolean(character.buffScore && character.buffScore3 && character.buffScore4);
  const { showCharacterDetail } = useCharacterDetail();
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDetailClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    showCharacterDetail(character);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (helperText && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + rect.width / 2 + window.scrollX,
      });
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
    <>
      <StyledComponents.Container
        ref={containerRef}
        {...restCardProps}
        width={width}
        height={height}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
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

            {/* buff score Section - 븝퍼제외 */}
            {!showMultipleBuffScore && character.buffScore ? <div className="score">{character.buffScore}</div> : null}

            {/* buff score Section - 븝퍼 */}
            {showMultipleBuffScore && character.buffScore ? <div className="score">(2인) {character.buffScore}</div> : null}
            {showMultipleBuffScore && character.buffScore3 ? <div className="score">(3인) {character.buffScore3}</div> : null}
            {showMultipleBuffScore && character.buffScore4 ? <div className="score">(4인) {character.buffScore4}</div> : null}

            {/* rank damage Section */}
            {character.rankDamage ? <div className="score">{character.rankDamage}</div> : null}
          </StyledComponents.MainInfo>
        </StyledComponents.Info>
      </StyledComponents.Container>

      {/* tooltip Section - Portal을 사용해서 DOM 최상위에 렌더링 */}
      {helperText &&
        createPortal(
          <StyledComponents.Tooltip visible={isTooltipVisible} top={tooltipPosition.top} left={tooltipPosition.left}>
            {helperText}
          </StyledComponents.Tooltip>,
          document.body,
        )}
    </>
  );
}
