import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useErrorBoundary } from 'react-error-boundary';
import { PasswordDialog } from '../../components/PasswordDialog';
import { useFirebase } from '../../context/FirebaseContext';
import { getLocalStorageItem, setLocalStorageItem } from '../../utils/localStorage';
import { Group, GroupConfig } from '../../types/types';
import { ArrowLeft, Settings, Users, Tag, Calendar, Save } from 'lucide-react';
import { Drawer } from '../../components/Drawer';
import { Toast } from '../../components/Toast';
import {
  PageContainer,
  MainContent,
  Section,
  SectionTitle,
  SettingSection,
  SettingItem,
  SettingLabel,
  SettingInput,
  SettingTextarea,
  SettingButton,
  BackButton,
  SaveButton,
  ButtonGroup,
  TagContainer,
  TagItem,
  TagInput,
  TagButton,
  ColorPicker,
} from './styles';

const isExistGroupLoginData = (groupName?: string): boolean => {
  if (!groupName) return false;

  const storedGroups =
    getLocalStorageItem<{
      recentGroups?: {
        name: string;
        id: string;
        lastVisited: string;
      }[];
    }>('recentGroups')?.recentGroups || [];

  const result = Boolean(storedGroups.find((group) => group.name === groupName));

  return !result;
};

export function GroupSettingPage() {
  const { groupName } = useParams<{ groupName: string }>();
  const navigate = useNavigate();
  const [showPasswordDialog, setShowPasswordDialog] = useState(isExistGroupLoginData(groupName));
  const [group, setGroup] = useState<Group | null>(null);
  const [groupConfig, setGroupConfig] = useState<GroupConfig>({
    id: '',
    name: '',
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#2196f3');
  const { showBoundary } = useErrorBoundary();
  const { writeData, readData } = useFirebase();

  // Drawer 토글 함수
  const handleToggleDrawer = () => {
    setIsDrawerOpen((prev) => !prev);
  };

  // 그룹 데이터 로드
  useEffect(() => {
    if (!groupName) return;

    const loadGroupData = async () => {
      try {
        const data = await readData(`groups/${groupName}`);
        if (data) {
          const validatedGroup = data as Group;
          setGroup(validatedGroup);
          setGroupConfig(
            validatedGroup.config || {
              id: groupName,
              name: groupName,
              tags: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          );
        }
      } catch (error) {
        console.error('!!DEBUG 그룹 데이터 로드 실패:', error);
      }
    };

    loadGroupData();
  }, [groupName, readData]);

  // 로컬스토리지에 방문 정보 저장
  useEffect(() => {
    if (!groupName) return;

    const addToRecentGroups = () => {
      const storedGroups = localStorage.getItem('recentGroups');
      let recentGroups = storedGroups ? JSON.parse(storedGroups) : [];

      // 이미 존재하는 그룹이면 제거
      recentGroups = recentGroups.filter((g: unknown) => (g as { id: string }).id !== groupName);

      // 새로운 그룹 정보를 맨 앞에 추가
      recentGroups.unshift({
        id: groupName,
        name: groupName,
        lastVisited: new Date().toISOString(),
      });

      // 최대 5개까지만 저장
      recentGroups = recentGroups.slice(0, 5);

      localStorage.setItem('recentGroups', JSON.stringify(recentGroups));
    };

    // 인증이 완료된 경우에만 방문 정보 저장
    const isAuthenticated = sessionStorage.getItem(`auth_${groupName}`);
    if (isAuthenticated) {
      addToRecentGroups();
    }
  }, [groupName]);

  const handleBackClick = () => {
    navigate(`/group/${groupName}`);
  };

  const handleSaveConfig = async () => {
    if (!groupName) return;

    try {
      const updatedConfig = {
        ...groupConfig,
        updatedAt: new Date().toISOString(),
      };

      await writeData(`groups/${groupName}/config`, updatedConfig);
      setGroupConfig(updatedConfig);

      setToastMessage('설정이 저장되었습니다.');
      setIsToastVisible(true);
      setTimeout(() => setIsToastVisible(false), 3000);
    } catch (error) {
      console.error('!!DEBUG 설정 저장 실패:', error);
      setToastMessage('설정 저장에 실패했습니다.');
      setIsToastVisible(true);
      setTimeout(() => setIsToastVisible(false), 3000);
    }
  };

  const handleAddTag = () => {
    if (!newTagName.trim()) return;

    const newTag = {
      id: Date.now().toString(),
      name: newTagName.trim(),
      color: {
        background: newTagColor,
        text: '#ffffff',
        border: newTagColor,
      },
    };

    setGroupConfig((prev) => ({
      ...prev,
      tags: [...prev.tags, newTag],
    }));

    setNewTagName('');
    setNewTagColor('#2196f3');
  };

  const handleRemoveTag = (tagId: string) => {
    setGroupConfig((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag.id !== tagId),
    }));
  };

  const handleConfigChange = (field: keyof GroupConfig, value: string) => {
    setGroupConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (showPasswordDialog) {
    return (
      <PasswordDialog
        groupName={groupName}
        onSuccess={(groupId) => {
          setShowPasswordDialog(false);
          const currentRecentGroups =
            getLocalStorageItem<{
              recentGroups?: {
                name: string;
                id: string;
                lastVisited: string;
              }[];
            }>('recentGroups')?.recentGroups || [];
          setLocalStorageItem('recentGroups', {
            recentGroups: [
              ...currentRecentGroups,
              {
                name: groupName,
                id: groupId,
                lastVisited: new Date().toISOString(),
              },
            ],
          });
        }}
        onFailure={() => showBoundary(new Error('인증에 실패했습니다.'))}
      />
    );
  }

  return (
    <>
      <Drawer
        open={isDrawerOpen}
        groupName={groupName || ''}
        onToggle={handleToggleDrawer}
        onUpdateGroupCharacters={async () => {}}
        onOpenCharacterSearch={() => {}}
      />
      <PageContainer drawerOpen={isDrawerOpen}>
        <MainContent>
          <Section>
            <ButtonGroup>
              <BackButton onClick={handleBackClick}>
                <ArrowLeft size={20} />
                뒤로 가기
              </BackButton>
              <SaveButton onClick={handleSaveConfig}>
                <Save size={20} />
                저장
              </SaveButton>
            </ButtonGroup>

            <SectionTitle>
              <Settings size={24} />
              그룹 설정
            </SectionTitle>

            <SettingSection>
              <SettingItem>
                <SettingLabel>
                  <Users size={20} />
                  그룹 이름
                </SettingLabel>
                <SettingInput
                  type="text"
                  value={groupConfig.name}
                  onChange={(e) => handleConfigChange('name', e.target.value)}
                  placeholder="그룹 이름을 입력하세요"
                />
              </SettingItem>

              <SettingItem>
                <SettingLabel>
                  <Tag size={20} />
                  태그 관리
                </SettingLabel>
                <TagContainer>
                  {groupConfig.tags.map((tag) => (
                    <TagItem key={tag.id} style={{ backgroundColor: tag.color.background, color: tag.color.text }}>
                      {tag.name}
                      <TagButton onClick={() => handleRemoveTag(tag.id)}>×</TagButton>
                    </TagItem>
                  ))}
                </TagContainer>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <SettingInput type="text" value={newTagName} onChange={(e) => setNewTagName(e.target.value)} placeholder="새 태그 이름" style={{ flex: 1 }} />
                  <ColorPicker type="color" value={newTagColor} onChange={(e) => setNewTagColor(e.target.value)} />
                  <SettingButton onClick={handleAddTag}>추가</SettingButton>
                </div>
              </SettingItem>

              <SettingItem>
                <SettingLabel>
                  <Calendar size={20} />
                  생성일
                </SettingLabel>
                <div style={{ color: '#666', fontSize: '0.9em' }}>{new Date(groupConfig.createdAt).toLocaleDateString('ko-KR')}</div>
              </SettingItem>

              <SettingItem>
                <SettingLabel>
                  <Calendar size={20} />
                  수정일
                </SettingLabel>
                <div style={{ color: '#666', fontSize: '0.9em' }}>{new Date(groupConfig.updatedAt).toLocaleDateString('ko-KR')}</div>
              </SettingItem>
            </SettingSection>
          </Section>
        </MainContent>
      </PageContainer>
      <Toast message={toastMessage} isVisible={isToastVisible} />
    </>
  );
}

export default GroupSettingPage;
