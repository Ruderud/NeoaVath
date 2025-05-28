import styled from '@emotion/styled';
import type { HTMLAttributes } from 'react';

export const ModalOverlay = styled.div<HTMLAttributes<HTMLDivElement>>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

export const ModalContent = styled.div<HTMLAttributes<HTMLDivElement>>`
  background: #1a1a1a;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
`;

export const ModalHeader = styled.div<HTMLAttributes<HTMLDivElement>>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #333;
`;

export const ModalTitle = styled.h2<HTMLAttributes<HTMLHeadingElement>>`
  margin: 0;
  font-size: 1.5rem;
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

export const ModalBody = styled.div<HTMLAttributes<HTMLDivElement>>`
  padding: 16px;
`;

export const PartyForm = styled.form<HTMLAttributes<HTMLFormElement>>`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const FormGroup = styled.div<HTMLAttributes<HTMLDivElement>>`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const Label = styled.label<HTMLAttributes<HTMLLabelElement>>`
  color: #fff;
  font-size: 0.9rem;
`;

export const Input = styled.input<HTMLAttributes<HTMLInputElement>>`
  padding: 8px 12px;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 4px;
  color: #fff;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: #666;
  }
`;

export const TextArea = styled.textarea<HTMLAttributes<HTMLTextAreaElement>>`
  padding: 8px 12px;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 4px;
  color: #fff;
  font-size: 1rem;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #666;
  }
`;

export const ButtonGroup = styled.div<HTMLAttributes<HTMLDivElement>>`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
`;

export const CancelButton = styled.button<HTMLAttributes<HTMLButtonElement>>`
  padding: 8px 16px;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #333;
    border-color: #666;
  }
`;

export const SaveButton = styled.button<HTMLAttributes<HTMLButtonElement>>`
  padding: 8px 16px;
  background: #0066cc;
  border: none;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: #0052a3;
  }
`;
