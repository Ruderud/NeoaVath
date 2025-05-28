import styled from '@emotion/styled';

type Action = {
  label: string;
  onClick: () => void;
  variant?: 'danger';
};

type ActionSheetProps = {
  isOpen: boolean;
  title: string;
  actions: Action[];
  onClose: () => void;
};

export function ActionSheet({ isOpen, title, actions, onClose }: ActionSheetProps) {
  if (!isOpen) return null;

  return (
    <Overlay onClick={onClose}>
      <Sheet onClick={(e) => e.stopPropagation()}>
        <SheetHeader>
          <h3>{title}</h3>
        </SheetHeader>
        <SheetContent>
          {actions.map((action, index) => (
            <ActionButton
              key={index}
              onClick={() => {
                action.onClick();
                onClose();
              }}
              variant={action.variant}
            >
              {action.label}
            </ActionButton>
          ))}
        </SheetContent>
      </Sheet>
    </Overlay>
  );
}

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
`;

const Sheet = styled.div`
  background: white;
  border-radius: 20px 20px 0 0;
  padding: 20px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);

  &::before {
    content: '';
    position: absolute;
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
    width: 40px;
    height: 4px;
    background: #ddd;
    border-radius: 2px;
  }
`;

const SheetHeader = styled.div`
  text-align: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;

  h3 {
    font-size: 1.2em;
    font-weight: 600;
    color: #333;
  }
`;

const SheetContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ActionButton = styled.button<{ variant?: 'danger' }>`
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 8px;
  background: ${({ variant }) => (variant === 'danger' ? '#fff1f0' : 'white')};
  color: ${({ variant }) => (variant === 'danger' ? '#ff4d4f' : '#333')};
  font-size: 1em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ variant }) => (variant === 'danger' ? '#ffccc7' : '#f5f5f5')};
  }

  &:active {
    transform: scale(0.98);
  }
`;
