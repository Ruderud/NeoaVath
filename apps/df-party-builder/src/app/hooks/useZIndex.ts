import { useState, useCallback, useEffect } from 'react';

// 전역 z-index 관리자
class ZIndexManager {
  private static instance: ZIndexManager;
  private dialogZIndices = new Map<string, number>();
  private maxZIndex = 1000;
  private listeners = new Set<() => void>();

  static getInstance(): ZIndexManager {
    if (!ZIndexManager.instance) {
      ZIndexManager.instance = new ZIndexManager();
    }
    return ZIndexManager.instance;
  }

  registerDialog(dialogId: string): number {
    const zIndex = this.maxZIndex + 1;
    this.dialogZIndices.set(dialogId, zIndex);
    this.maxZIndex = zIndex;
    this.notifyListeners();
    return zIndex;
  }

  unregisterDialog(dialogId: string): void {
    this.dialogZIndices.delete(dialogId);
    this.notifyListeners();
  }

  bringToFront(dialogId: string): number {
    const zIndex = this.maxZIndex + 1;
    this.dialogZIndices.set(dialogId, zIndex);
    this.maxZIndex = zIndex;
    this.notifyListeners();
    return zIndex;
  }

  getZIndex(dialogId: string): number {
    return this.dialogZIndices.get(dialogId) || 1000;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }
}

export function useZIndex(dialogId: string) {
  const manager = ZIndexManager.getInstance();
  const [zIndex, setZIndex] = useState(() => manager.getZIndex(dialogId));

  useEffect(() => {
    // dialog 등록
    const initialZIndex = manager.registerDialog(dialogId);
    setZIndex(initialZIndex);

    // 변경사항 구독
    const unsubscribe = manager.subscribe(() => {
      setZIndex(manager.getZIndex(dialogId));
    });

    // cleanup
    return () => {
      unsubscribe();
      manager.unregisterDialog(dialogId);
    };
  }, [dialogId]);

  const bringToFront = useCallback(() => {
    const newZIndex = manager.bringToFront(dialogId);
    setZIndex(newZIndex);
  }, [dialogId]);

  return { zIndex, bringToFront };
}
