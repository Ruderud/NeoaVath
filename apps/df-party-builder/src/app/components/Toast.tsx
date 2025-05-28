import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

const slideIn = keyframes`
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(-100%);
    opacity: 0;
  }
`;

const ToastContainer = styled.div<{ isVisible: boolean }>`
  position: fixed;
  bottom: 20px;
  left: 20px;
  background-color: #ff4d4f;
  color: white;
  padding: 12px 24px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  animation: ${({ isVisible }) => (isVisible ? slideIn : slideOut)} 0.3s ease-in-out;
  display: ${({ isVisible }) => (isVisible ? 'block' : 'none')};
`;

type ToastProps = {
  message: string;
  isVisible: boolean;
};

export function Toast({ message, isVisible }: ToastProps) {
  return <ToastContainer isVisible={isVisible}>{message}</ToastContainer>;
}
