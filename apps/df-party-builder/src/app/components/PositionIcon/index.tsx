import styled from '@emotion/styled';
import { getCharacterColor } from '../../consts/character-colors';

type PositionIconProps = {
  position?: string;
  size?: number;
};

export function PositionIcon({ position, size = 16 }: PositionIconProps) {
  const characterColor = getCharacterColor(position);
  const positionText = position === '시너지' ? 'S' : position === '버퍼' ? 'B' : 'D';

  return (
    <IconContainer size={size} backgroundColor={characterColor.primary}>
      {positionText}
    </IconContainer>
  );
}

const IconContainer = styled.div<{ size: number; backgroundColor: string }>`
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
  background: ${({ backgroundColor }) => backgroundColor};
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ size }) => Math.max(8, size * 0.6)}px;
  font-weight: bold;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
`;
