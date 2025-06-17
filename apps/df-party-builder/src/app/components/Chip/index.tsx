import styled from '@emotion/styled';
import { HexColorPicker } from 'react-colorful';
import { useState } from 'react';

type ChipColor = {
  background: string;
  text: string;
  border: string;
};

type ChipProps = {
  color: ChipColor;
  value: string;
  isSelected?: boolean;
  onClick?: () => void;
  onColorChange?: (color: ChipColor) => void;
};

const ChipContainer = styled.div<{ $color: ChipColor; $isSelected?: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: ${({ $isSelected }) => ($isSelected ? 'default' : 'pointer')};
  transition: all 0.2s ease;
  border: 1px solid ${({ $color }) => $color.border};
  background-color: ${({ $color }) => $color.background};
  color: ${({ $color }) => $color.text};

  &:hover {
    opacity: ${({ $isSelected }) => ($isSelected ? 1 : 0.8)};
  }
`;

const ColorPickerContainer = styled.div`
  position: absolute;
  z-index: 1000;
  background: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  margin-top: 8px;
`;

const ColorPickerWrapper = styled.div`
  position: relative;
  display: inline-block;
`;

export function Chip({ color, value, isSelected, onClick, onColorChange }: ChipProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleColorChange = (hex: string) => {
    // 배경색을 기준으로 텍스트 색상과 테두리 색상을 자동으로 계산
    const textColor = getContrastColor(hex);
    const borderColor = adjustColor(hex, -20); // 배경색보다 약간 어두운 색상

    onColorChange?.({
      background: hex,
      text: textColor,
      border: borderColor,
    });
  };

  return (
    <ColorPickerWrapper>
      <ChipContainer
        $color={color}
        $isSelected={isSelected}
        onClick={() => {
          if (onClick) onClick();
          if (onColorChange) setShowColorPicker(!showColorPicker);
        }}
      >
        {value}
      </ChipContainer>
      {showColorPicker && onColorChange && (
        <ColorPickerContainer>
          <HexColorPicker color={color.background} onChange={handleColorChange} />
        </ColorPickerContainer>
      )}
    </ColorPickerWrapper>
  );
}

// 배경색에 따른 텍스트 색상 계산 함수
function getContrastColor(hexColor: string): string {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#FFFFFF';
}

// 색상 밝기 조절 함수
function adjustColor(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const newR = Math.max(0, Math.min(255, r + amount));
  const newG = Math.max(0, Math.min(255, g + amount));
  const newB = Math.max(0, Math.min(255, b + amount));

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}
