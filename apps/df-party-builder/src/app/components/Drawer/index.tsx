import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, FileText, Settings, Search, Home } from 'lucide-react';
import { useFirebase } from '../../context/FirebaseContext';
import { MemoModal } from '../MemoModal';
import { LoadingOverlay } from '../LoadingOverlay';
import { ErrorOverlay } from '../ErrorOverlay';
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

type DrawerProps = {
  open: boolean;
  groupName: string;
  onToggle: () => void;
  onUpdateGroupCharacters: () => Promise<void>;
  onOpenCharacterSearch: () => void;
};

export function Drawer({ open, onToggle, groupName, onUpdateGroupCharacters, onOpenCharacterSearch }: DrawerProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMemoModalOpen, setIsMemoModalOpen] = useState(false);
  const [memo, setMemo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const { writeData, readData } = useFirebase();

  // 현재 페이지가 설정 페이지인지 확인
  const isSettingPage = location.pathname.includes('/setting');

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
    navigate(`/group/${groupName}/setting`);
  };

  const handleMainClick = () => {
    navigate(`/group/${groupName}`);
  };

  const handleSyncClick = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onUpdateGroupCharacters();
    } catch (error: any) {
      console.error('!!DEBUG 동기화 실패:', error);
      setError({
        title: '동기화 실패',
        message: error?.response?.data?.message || error?.message || '던담 서버에서 데이터를 가져오는데 실패했습니다. 잠시 후 다시 시도해주세요.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    setError(null);
    try {
      await onUpdateGroupCharacters();
    } catch (error: any) {
      console.error('!!DEBUG 재시도 실패:', error);
      setError({
        title: '동기화 실패',
        message: error?.response?.data?.message || error?.message || '던담 서버에서 데이터를 가져오는데 실패했습니다. 잠시 후 다시 시도해주세요.',
      });
    } finally {
      setIsRetrying(false);
    }
  };

  const handleCloseError = () => {
    setError(null);
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
              <DrawerMenuButton onClick={handleMainClick}>
                <Home size={20} />
                메인
              </DrawerMenuButton>

              <div style={{ paddingLeft: '8px' }}>
                <DrawerMenuButton onClick={handleSyncClick} disabled={isLoading || isSettingPage}>
                  <DundamIcon src="https://dundam.xyz/favicon.ico" alt="던담" />
                  동기화
                </DrawerMenuButton>

                <DrawerMenuButton onClick={onOpenCharacterSearch} disabled={isSettingPage}>
                  <Search size={20} />
                  캐릭터/모험단 검색
                </DrawerMenuButton>
              </div>

              <DrawerMenuButton onClick={() => setIsMemoModalOpen(true)}>
                <FileText />
                메모장
              </DrawerMenuButton>

              <DrawerButton onClick={handleGroupConfigClick} style={{ marginTop: 'auto' }}>
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
            <DrawerMenuButton onClick={handleMainClick}>
              <Home size={20} />
            </DrawerMenuButton>
            <div style={{ paddingLeft: '8px' }}>
              <DrawerMenuButton onClick={() => alert('아직 안댐 ㅎ')} disabled={isSettingPage}>
                <DundamIcon src="https://dundam.xyz/favicon.ico" alt="던담" style={{ marginTop: 16 }} />
              </DrawerMenuButton>
              <DrawerMenuButton onClick={onOpenCharacterSearch} disabled={isSettingPage}>
                <Search />
              </DrawerMenuButton>
            </div>
            <DrawerMenuButton onClick={() => setIsMemoModalOpen(true)}>
              <FileText />
            </DrawerMenuButton>
            <DrawerMenuButton onClick={handleGroupConfigClick} style={{ marginTop: 'auto' }}>
              <Settings size={20} />
            </DrawerMenuButton>
          </DrawerCollapsed>
        )}
      </DrawerContainer>

      <LoadingOverlay isVisible={isLoading || isRetrying} message={isRetrying ? '재시도 중...' : '동기화 중...'} />
      <ErrorOverlay
        isVisible={!!error}
        title={error?.title}
        message={error?.message}
        onRetry={handleRetry}
        onClose={handleCloseError}
        isRetrying={isRetrying}
      />
      <MemoModal isOpen={isMemoModalOpen} onClose={() => setIsMemoModalOpen(false)} onSave={handleSaveMemo} initialMemo={memo} />
    </>
  );
}
