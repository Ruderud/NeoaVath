import { ReactNode } from 'react';
import styled from '@emotion/styled';

type DialogOverlayProps = {
  children: ReactNode;
};

export function DialogOverlay({ children }: DialogOverlayProps) {
  return <OverlayContainer>{children}</OverlayContainer>;
}

const OverlayContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  pointer-events: none;
`;
