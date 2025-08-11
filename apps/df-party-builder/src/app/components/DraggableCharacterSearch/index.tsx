import { useState, useRef, useCallback, useEffect } from 'react';
import styled from '@emotion/styled';
import { X, GripVertical } from 'lucide-react';
import { CharacterSearch } from '../CharacterSearch';
import type { CharacterData, Dungeon } from '../../types/types';

type DraggableCharacterSearchProps = {
  isOpen: boolean;
  onClose: () => void;
  onCharacterSelect: (character: CharacterData) => void;
  onCharacterDragStart: (e: React.DragEvent<HTMLDivElement>, character: CharacterData) => void;
  dungeons: Dungeon[];
};

export function DraggableCharacterSearch({ isOpen, onClose, onCharacterSelect, onCharacterDragStart, dungeons }: DraggableCharacterSearchProps) {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ width: 600, height: 400 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeOffset, setResizeOffset] = useState({ x: 0, y: 0 });
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!dialogRef.current) return;

    const rect = dialogRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    setDragOffset({ x: offsetX, y: offsetY });
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // 화면 경계 내로 제한
      const maxX = window.innerWidth - 400; // 다이얼로그 너비
      const maxY = window.innerHeight - 300; // 다이얼로그 높이

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    },
    [isDragging, dragOffset],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  const handleResizeStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = dialogRef.current?.getBoundingClientRect();
    if (!rect) return;

    const offsetX = e.clientX - rect.right;
    const offsetY = e.clientY - rect.bottom;

    setResizeOffset({ x: offsetX, y: offsetY });
    setIsResizing(true);
  }, []);

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = e.clientX - position.x - resizeOffset.x;
      const newHeight = e.clientY - position.y - resizeOffset.y;

      // 최소 크기 제한
      const minWidth = 600;
      const minHeight = 400;

      // 최대 크기 제한 (화면 크기의 80%)
      const maxWidth = window.innerWidth * 0.8;
      const maxHeight = window.innerHeight * 0.8;

      setSize({
        width: Math.max(minWidth, Math.min(newWidth, maxWidth)),
        height: Math.max(minHeight, Math.min(newHeight, maxHeight)),
      });
    },
    [isResizing, position, resizeOffset],
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

  if (!isOpen) return null;

  return (
    <DialogOverlay>
      <DialogContainer
        ref={dialogRef}
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          width: `${size.width}px`,
          height: `${size.height}px`,
          cursor: isDragging ? 'grabbing' : isResizing ? 'nw-resize' : 'default',
        }}
      >
        <DialogHeader onMouseDown={handleMouseDown}>
          <DragHandle>
            <GripVertical size={16} />
          </DragHandle>
          <DialogTitle>캐릭터 검색</DialogTitle>
          <CloseButton onClick={onClose}>
            <X size={16} />
          </CloseButton>
        </DialogHeader>
        <DialogContent>
          <CharacterSearch isOpen={true} onCharacterSelect={onCharacterSelect} onCharacterDragStart={onCharacterDragStart} dungeons={dungeons} />
        </DialogContent>
        <ResizeHandler onMouseDown={handleResizeStart} />
      </DialogContainer>
    </DialogOverlay>
  );
}

const DialogOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  pointer-events: none;
`;

const DialogContainer = styled.div`
  position: absolute;
  background: white;
  border-radius: 8px 8px 0 8px;
  border: 2px solid #2196f3;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(33, 150, 243, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  pointer-events: auto;
  position: relative;
`;

const DialogHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  cursor: grab;
  user-select: none;

  &:active {
    cursor: grabbing;
  }
`;

const DragHandle = styled.div`
  display: flex;
  align-items: center;
  color: #6c757d;
  margin-right: 8px;
`;

const DialogTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  flex: 1;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background: #e9ecef;
    color: #333;
  }
`;

const DialogContent = styled.div`
  flex: 1;
  overflow: hidden;
`;

const ResizeHandler = styled.div`
  position: absolute;
  right: 0;
  bottom: 0;
  width: 0;
  height: 0;
  rotate: 90deg;
  border-left: 12px solid transparent;
  border-right: 0 solid transparent;
  border-bottom: 0 solid transparent;
  border-top: 12px solid #6c757d;
  cursor: nw-resize;
  transition: border-top-color 0.2s ease;

  &:hover {
    border-top-color: #495057;
  }

  &:active {
    border-top-color: #343a40;
  }
`;
