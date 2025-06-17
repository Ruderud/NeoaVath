import styled from '@emotion/styled';
import { HexColorPicker } from 'react-colorful';
import { useState } from 'react';

type ColorPickerProps = {
  value: string;
  onChange: (color: string) => void;
  label?: string;
};

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <Container>
      {label && <Label>{label}</Label>}
      <ColorButton style={{ backgroundColor: value }} onClick={() => setShowPicker(!showPicker)} />
      {showPicker && (
        <PickerContainer>
          <HexColorPicker color={value} onChange={onChange} />
        </PickerContainer>
      )}
    </Container>
  );
}

const Container = styled.div`
  position: relative;
  display: inline-block;
`;

const Label = styled.div`
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 4px;
`;

const ColorButton = styled.button`
  width: 32px;
  height: 32px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  padding: 0;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: #2196f3;
  }
`;

const PickerContainer = styled.div`
  position: absolute;
  z-index: 1000;
  background: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  margin-top: 8px;
`;
