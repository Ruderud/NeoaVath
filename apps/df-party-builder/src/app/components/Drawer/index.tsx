import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, FileText, Settings } from 'lucide-react';
import { useFirebase } from '../../context/FirebaseContext';
import { MemoModal } from '../MemoModal';
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
  DrawerButton,
} from './styles';
import { GroupConfigModal } from '../GroupConfigModal';
import { GroupConfig } from 'src/app/types/types';

type DrawerProps = {
  open: boolean;
  groupName: string;
  onToggle: () => void;
};

export function Drawer({ open, onToggle, groupName }: DrawerProps) {
  const [isMemoModalOpen, setIsMemoModalOpen] = useState(false);
  const [memo, setMemo] = useState('');
  const { writeData, readData } = useFirebase();
  const [isGroupConfigOpen, setIsGroupConfigOpen] = useState(false);

  useEffect(() => {
    if (groupName) {
      loadMemo();
    }
  }, [groupName]);

  const loadMemo = async () => {
    if (!groupName) return;
    try {
      const data = await readData(`groups/${groupName}/memo`);
      if (data) {
        setMemo(data as string);
      }
    } catch (error) {
      console.error('메모 로드 실패:', error);
    }
  };

  const handleSaveMemo = async (newMemo: string) => {
    if (!groupName) return;
    try {
      await writeData(`groups/${groupName}/memo`, newMemo);
      setMemo(newMemo);
    } catch (error) {
      console.error('메모 저장 실패:', error);
    }
  };

  const handleGroupConfigClick = () => {
    setIsGroupConfigOpen(true);
  };

  const handleSaveGroupConfig = async (newConfig: GroupConfig) => {
    if (!groupName) return;
    try {
      await writeData(`groups/${groupName}/config`, newConfig);
    } catch (error) {
      console.error('그룹 설정 저장 실패:', error);
    }
  };

  return (
    <>
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

              <DrawerMenuButton onClick={() => setIsMemoModalOpen(true)}>
                <FileText />
                메모장
              </DrawerMenuButton>

              <DrawerButton onClick={handleGroupConfigClick}>
                <Settings size={24} />
                <span>그룹 설정</span>
              </DrawerButton>
            </DrawerMenu>
          </DrawerContent>
        ) : (
          <DrawerCollapsed>
            <DrawerExpandButton onClick={onToggle}>
              <ChevronRight />
            </DrawerExpandButton>
            <DrawerMenuButton onClick={() => alert('아직 안댐 ㅎ')}>
              <DundamIcon src="https://dundam.xyz/favicon.ico" alt="던담" style={{ marginTop: 16 }} />
            </DrawerMenuButton>
            <DrawerMenuButton onClick={() => setIsMemoModalOpen(true)}>
              <FileText />
            </DrawerMenuButton>
          </DrawerCollapsed>
        )}
      </DrawerContainer>

      <MemoModal isOpen={isMemoModalOpen} onClose={() => setIsMemoModalOpen(false)} onSave={handleSaveMemo} initialMemo={memo} />
      <GroupConfigModal isOpen={isGroupConfigOpen} onClose={() => setIsGroupConfigOpen(false)} groupName={groupName} onSave={handleSaveGroupConfig} />
    </>
  );
}
