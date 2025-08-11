import { useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import styled from '@emotion/styled';
import { X, GripVertical } from 'lucide-react';
import { useDialogOverlay } from '../../context/DialogOverlayContext';

type DraggableDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  dialogId: string;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
  minSize?: { width: number; height: number };
  maxSize?: { width: number; height: number };
  onFocus?: () => void;
  zIndex?: number;
};

export function DraggableDialog({
  isOpen,
  onClose,
  title,
  children,
  dialogId,
  initialPosition = { x: 100, y: 100 },
  initialSize = { width: 600, height: 400 },
  minSize = { width: 400, height: 300 },
  maxSize = { width: window.innerWidth * 0.8, height: window.innerHeight * 0.8 },
  onFocus,
  zIndex = 1000,
}: DraggableDialogProps) {
  const { addDialog, updateDialog, removeDialog } = useDialogOverlay();
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeOffset, setResizeOffset] = useState({ x: 0, y: 0 });
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;

      setDragOffset({ x: offsetX, y: offsetY });
      setDragStartPos({ x: e.clientX, y: e.clientY });
      setHasDragged(false);
      setIsDragging(true);

      // 클릭 시 포커스 이벤트 발생
      onFocus?.();
    },
    [onFocus],
  );

  const handleDialogClick = useCallback(() => {
    // 드래그가 아닌 클릭일 때만 포커스 이벤트 발생
    if (!hasDragged) {
      onFocus?.();
    }
  }, [onFocus, hasDragged]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      // 드래그가 시작되었음을 표시
      setHasDragged(true);

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // 화면 경계 내로 제한
      const maxX = window.innerWidth - size.width;
      const maxY = window.innerHeight - size.height;

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    },
    [isDragging, dragOffset, size],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const rect = e.currentTarget.parentElement?.getBoundingClientRect();
      if (!rect) return;

      const offsetX = e.clientX - rect.right;
      const offsetY = e.clientY - rect.bottom;

      setResizeOffset({ x: offsetX, y: offsetY });
      setIsResizing(true);

      // 리사이즈 시에도 포커스 이벤트 발생
      onFocus?.();
    },
    [onFocus],
  );

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = e.clientX - position.x - resizeOffset.x;
      const newHeight = e.clientY - position.y - resizeOffset.y;

      setSize({
        width: Math.max(minSize.width, Math.min(newWidth, maxSize.width)),
        height: Math.max(minSize.height, Math.min(newHeight, maxSize.height)),
      });
    },
    [isResizing, position, resizeOffset, minSize, maxSize],
  );

  // 마우스 이벤트 리스너 등록
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', isDragging ? handleMouseMove : handleResizeMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', isDragging ? handleMouseMove : handleResizeMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleResizeMove, handleMouseUp]);

  // dialog 등록/해제
  useEffect(() => {
    if (isOpen) {
      addDialog(dialogId, {
        id: dialogId,
        position,
        size,
        isDragging,
        isResizing,
        zIndex,
        title,
        onClose,
        children,
        onMouseDown: handleMouseDown,
        onClick: handleDialogClick,
        onResizeStart: handleResizeStart,
      });
    } else {
      removeDialog(dialogId);
    }

    return () => {
      removeDialog(dialogId);
    };
  }, [isOpen, dialogId, addDialog, removeDialog]);

  // dialog 데이터 업데이트
  useEffect(() => {
    if (isOpen) {
      updateDialog(dialogId, {
        position,
        size,
        isDragging,
        isResizing,
        zIndex,
        title,
        onClose,
        children,
        onMouseDown: handleMouseDown,
        onClick: handleDialogClick,
        onResizeStart: handleResizeStart,
      });
    }
  }, [
    isOpen,
    dialogId,
    position.x,
    position.y,
    size.width,
    size.height,
    isDragging,
    isResizing,
    zIndex,
    title,
    onClose,
    children,
    handleMouseDown,
    handleDialogClick,
    handleResizeStart,
    updateDialog,
  ]);

  return null;
}
