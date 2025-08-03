import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const OverlayContainer = styled.div<{ isVisible: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  animation: ${fadeIn} 0.3s ease-in-out;
  opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
  visibility: ${({ isVisible }) => (isVisible ? 'visible' : 'hidden')};
  transition: opacity 0.3s ease-in-out, visibility 0.3s ease-in-out;
`;

const ErrorContent = styled.div`
  background-color: white;
  border-radius: 12px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  max-width: 400px;
  text-align: center;
`;

const ErrorIcon = styled.div`
  color: #ef4444;
  font-size: 48px;
`;

const ErrorTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
`;

const ErrorMessage = styled.p`
  margin: 0;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
`;

const RetryButton = styled.button`
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background-color: #2563eb;
  }

  &:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
  }
`;

const SpinningIcon = styled(RefreshCw)<{ isSpinning: boolean }>`
  animation: ${({ isSpinning }) => (isSpinning ? spin : 'none')} 1s linear infinite;
`;

const CloseButton = styled.button`
  background-color: transparent;
  color: #6b7280;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    background-color: #f3f4f6;
    color: #374151;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 8px;
`;

type ErrorOverlayProps = {
  isVisible: boolean;
  title?: string;
  message?: string;
  onRetry?: () => void;
  onClose?: () => void;
  isRetrying?: boolean;
};

export function ErrorOverlay({
  isVisible,
  title = '동기화 실패',
  message = '던담 서버에서 데이터를 가져오는데 실패했습니다. 잠시 후 다시 시도해주세요.',
  onRetry,
  onClose,
  isRetrying = false,
}: ErrorOverlayProps) {
  return (
    <OverlayContainer isVisible={isVisible}>
      <ErrorContent>
        <ErrorIcon>
          <AlertCircle size={48} />
        </ErrorIcon>
        <ErrorTitle>{title}</ErrorTitle>
        <ErrorMessage>{message}</ErrorMessage>
        <ButtonGroup>
          {onRetry && (
            <RetryButton onClick={onRetry} disabled={isRetrying}>
              <SpinningIcon size={16} isSpinning={isRetrying} />
              {isRetrying ? '재시도 중...' : '다시 시도'}
            </RetryButton>
          )}
          {onClose && <CloseButton onClick={onClose}>닫기</CloseButton>}
        </ButtonGroup>
      </ErrorContent>
    </OverlayContainer>
  );
}
