import styled from '@emotion/styled';
import type { HTMLAttributes } from 'react';

export const ActionSheetOverlay = styled.div<HTMLAttributes<HTMLDivElement>>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
`;

export const ActionSheetContent = styled.div<HTMLAttributes<HTMLDivElement>>`
  background: #1a1a1a;
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
`;

export const ActionSheetHeader = styled.div<HTMLAttributes<HTMLDivElement>>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #333;
`;

export const ActionSheetTitle = styled.h2<HTMLAttributes<HTMLHeadingElement>>`
  margin: 0;
  font-size: 1.2rem;
  color: #fff;
`;

export const CloseButton = styled.button<HTMLAttributes<HTMLButtonElement>>`
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;

  &:hover {
    color: #fff;
  }
`;

export const ActionSheetBody = styled.div<HTMLAttributes<HTMLDivElement>>`
  padding: 8px 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

type ActionButtonProps = {
  variant?: 'default' | 'danger';
};

export const ActionButton = styled.button<ActionButtonProps & HTMLAttributes<HTMLButtonElement>>`
  width: 100%;
  padding: 16px;
  background: ${({ variant }) => (variant === 'danger' ? '#cc0000' : '#2a2a2a')};
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: ${({ variant }) => (variant === 'danger' ? '#990000' : '#333')};
  }
`;
