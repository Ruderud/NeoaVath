import { DraggableDialog } from '../DraggableDialog';
import { useZIndex } from '../../hooks/useZIndex';
import { MemoContent } from '../MemoContent';

type DraggableMemoProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (memo: string) => Promise<void>;
  initialMemo: string;
};

export function DraggableMemo({ isOpen, onClose, onSave, initialMemo }: DraggableMemoProps) {
  const { zIndex, bringToFront } = useZIndex('memo');

  return (
    <DraggableDialog
      isOpen={isOpen}
      onClose={onClose}
      title="메모장"
      dialogId="memo"
      onFocus={bringToFront}
      zIndex={zIndex}
      initialPosition={{ x: 200, y: 150 }}
      initialSize={{ width: 500, height: 400 }}
    >
      <MemoContent onSave={onSave} initialMemo={initialMemo} />
    </DraggableDialog>
  );
}
