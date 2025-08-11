import { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import styled from '@emotion/styled';
import { X, GripVertical } from 'lucide-react';
import { DialogOverlay } from '../components/DialogOverlay';

type DialogData = {
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isDragging: boolean;
  isResizing: boolean;
  zIndex: number;
  title: string;
  onClose: () => void;
  children: ReactNode;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  onClick: () => void;
  onResizeStart: (e: React.MouseEvent<HTMLDivElement>) => void;
};

type DialogOverlayContextType = {
  addDialog: (id: string, data: DialogData) => void;
  updateDialog: (id: string, data: Partial<DialogData>) => void;
  removeDialog: (id: string) => void;
};

const DialogOverlayContext = createContext<DialogOverlayContextType | null>(null);

export function DialogOverlayProvider({ children }: { children: ReactNode }) {
  const [dialogs, setDialogs] = useState<Map<string, DialogData>>(new Map());

  const addDialog = useCallback((id: string, data: DialogData) => {
    setDialogs((prev) => {
      const newMap = new Map(prev);
      newMap.set(id, data);
      return newMap;
    });
  }, []);

  const updateDialog = useCallback((id: string, data: Partial<DialogData>) => {
    setDialogs((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(id);
      if (existing) {
        newMap.set(id, { ...existing, ...data });
      }
      return newMap;
    });
  }, []);

  const removeDialog = useCallback((id: string) => {
    setDialogs((prev) => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  }, []);

  return (
    <DialogOverlayContext.Provider value={{ addDialog, updateDialog, removeDialog }}>
      {children}
      <DialogOverlay>
        {Array.from(dialogs.values()).map((dialogData) => (
          <DialogRenderer key={dialogData.id} data={dialogData} />
        ))}
      </DialogOverlay>
    </DialogOverlayContext.Provider>
  );
}

function DialogRenderer({ data }: { data: DialogData }) {
  return (
    <DialogContainer
      style={{
        transform: `translate(${data.position.x}px, ${data.position.y}px)`,
        width: `${data.size.width}px`,
        height: `${data.size.height}px`,
        cursor: data.isResizing ? 'nw-resize' : 'default',
        zIndex: data.zIndex,
      }}
    >
      <DialogHeader onMouseDown={data.onMouseDown}>
        <DragHandle>
          <GripVertical size={16} />
        </DragHandle>
        <DialogTitle>{data.title}</DialogTitle>
        <CloseButton onClick={data.onClose}>
          <X size={16} />
        </CloseButton>
      </DialogHeader>
      <DialogContent onClick={data.onClick}>{data.children}</DialogContent>
      <ResizeHandler onMouseDown={data.onResizeStart} />
    </DialogContainer>
  );
}

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

export function useDialogOverlay() {
  const context = useContext(DialogOverlayContext);
  if (!context) {
    throw new Error('useDialogOverlay must be used within a DialogOverlayProvider');
  }
  return context;
}
