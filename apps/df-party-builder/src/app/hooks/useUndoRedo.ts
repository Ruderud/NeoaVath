import { useState, useEffect, useCallback } from 'react';
import { Dungeon } from '../types/types';

interface UndoRedoState {
  snapshots: Dungeon[][];
  currentIndex: number;
}

interface UseUndoRedoReturn {
  canUndo: boolean;
  canRedo: boolean;
  saveSnapshot: (dungeons: Dungeon[]) => void;
  undo: () => Dungeon[] | null;
  redo: () => Dungeon[] | null;
  clearHistory: () => void;
}

export const useUndoRedo = (groupName: string, maxSnapshots = 30): UseUndoRedoReturn => {
  const storageKey = `undoRedo_${groupName}`;

  const [state, setState] = useState<UndoRedoState>(() => {
    // 세션스토리지에서 초기 상태 복원
    const savedState = sessionStorage.getItem(storageKey);
    if (savedState) {
      try {
        return JSON.parse(savedState);
      } catch (error) {
        console.error('!!DEBUG 세션스토리지에서 undo/redo 상태 복원 실패:', error);
      }
    }
    return {
      snapshots: [],
      currentIndex: -1,
    };
  });

  // 상태가 변경될 때마다 세션스토리지에 저장
  useEffect(() => {
    sessionStorage.setItem(storageKey, JSON.stringify(state));
  }, [state, storageKey]);

  const canUndo = state.currentIndex > 0;
  const canRedo = state.currentIndex < state.snapshots.length - 1;

  const saveSnapshot = useCallback(
    (dungeons: Dungeon[]) => {
      const dungeonsCopy = JSON.parse(JSON.stringify(dungeons)) as Dungeon[];

      setState((prevState) => {
        // 현재 인덱스 이후의 스냅샷들을 제거 (새로운 변경사항이 있으므로)
        const newSnapshots = prevState.snapshots.slice(0, prevState.currentIndex + 1);

        // 새로운 스냅샷 추가
        newSnapshots.push(dungeonsCopy);

        // 최대 개수 제한
        if (newSnapshots.length > maxSnapshots) {
          newSnapshots.shift();
        }

        return {
          snapshots: newSnapshots,
          currentIndex: newSnapshots.length - 1,
        };
      });
    },
    [maxSnapshots],
  );

  const undo = useCallback((): Dungeon[] | null => {
    if (!canUndo) return null;

    setState((prevState) => ({
      ...prevState,
      currentIndex: prevState.currentIndex - 1,
    }));

    return JSON.parse(JSON.stringify(state.snapshots[state.currentIndex - 1]));
  }, [canUndo, state.snapshots, state.currentIndex]);

  const redo = useCallback((): Dungeon[] | null => {
    if (!canRedo) return null;

    setState((prevState) => ({
      ...prevState,
      currentIndex: prevState.currentIndex + 1,
    }));

    return JSON.parse(JSON.stringify(state.snapshots[state.currentIndex + 1]));
  }, [canRedo, state.snapshots, state.currentIndex]);

  const clearHistory = useCallback(() => {
    setState({
      snapshots: [],
      currentIndex: -1,
    });
  }, []);

  return {
    canUndo,
    canRedo,
    saveSnapshot,
    undo,
    redo,
    clearHistory,
  };
};
