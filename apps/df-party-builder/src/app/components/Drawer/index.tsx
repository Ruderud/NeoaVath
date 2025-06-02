import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  DrawerContainer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DundamIcon,
  DrawerMenu,
  DrawerMenuButton,
  DrawerCollapseButton,
  DrawerCollapsed,
  DrawerExpandButton,
} from './styles';

type DrawerProps = {
  open: boolean;
  groupName?: string;
  onToggle: () => void;
};

export function Drawer({ open, onToggle, groupName }: DrawerProps) {
  return (
    <DrawerContainer open={open}>
      {open ? (
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{groupName}</DrawerTitle>
            <DrawerCollapseButton onClick={onToggle}>
              <ChevronLeft />
            </DrawerCollapseButton>
          </DrawerHeader>
          <DrawerMenu>
            <DrawerMenuButton onClick={() => alert('아직 안댐 ㅎ')}>
              <DundamIcon src="https://dundam.xyz/favicon.ico" alt="던담" />
              동기화
            </DrawerMenuButton>
          </DrawerMenu>
        </DrawerContent>
      ) : (
        <DrawerCollapsed>
          <DrawerExpandButton onClick={onToggle}>
            <ChevronRight />
          </DrawerExpandButton>
          <DundamIcon src="https://dundam.xyz/favicon.ico" alt="던담" style={{ marginTop: 16 }} />
        </DrawerCollapsed>
      )}
    </DrawerContainer>
  );
}
