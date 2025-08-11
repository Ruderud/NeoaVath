import styled from '@emotion/styled';
import type { HTMLAttributes } from 'react';

export const DungeonColumnContainer = styled.div<HTMLAttributes<HTMLDivElement>>`
  display: flex;
  flex-direction: column;
  min-width: 400px;
  background: #1a1a1a;
  border-radius: 8px;
  padding: 16px;
  gap: 16px;
`;

export const DungeonHeader = styled.div<HTMLAttributes<HTMLDivElement>>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 8px;

  h3 {
    margin: 0;
    font-size: 1.2rem;
    color: #fff;
  }

  span {
    color: #666;
    font-size: 0.9rem;
  }
`;

export const DungeonContent = styled.div<HTMLAttributes<HTMLDivElement>>`
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  max-height: calc(100vh - 200px);
  padding: 4px;
`;

export const AddPartyButton = styled.button<HTMLAttributes<HTMLButtonElement>>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px;
  background: #2a2a2a;
  border: 2px dashed #444;
  border-radius: 8px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #333;
    border-color: #666;
    color: #999;
  }
`;
