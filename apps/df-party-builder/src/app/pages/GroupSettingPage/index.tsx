import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useErrorBoundary } from 'react-error-boundary';
import { PasswordDialog } from '../../components/PasswordDialog';
import { useFirebase } from '../../context/FirebaseContext';
import { getLocalStorageItem, setLocalStorageItem } from '../../utils/localStorage';
import { Group, GroupConfig } from '../../types/types';
import { Settings, Users, Tag, Calendar, Save, X } from 'lucide-react';
import { Drawer } from '../../components/Drawer';
import { Toast } from '../../components/Toast';
import { MultiAccountSettings } from './components/MultiAccountSettings';
import {
  PageContainer,
  MainContent,
  Section,
  SectionTitle,
  SettingSection,
  SettingItem,
  SettingLabel,
  SettingInput,
  SettingButton,
  SaveButton,
  CancelButton,
  ButtonGroup,
  TagContainer,
  TagItem,
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
    multiAccounts: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  const [originalGroupConfig, setOriginalGroupConfig] = useState<GroupConfig>({
    id: '',
    name: '',
    tags: [],
    multiAccounts: [],
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

  // 변경사항이 있는지 확인
  const hasChanges = () => {
    const currentString = JSON.stringify(groupConfig);
    const originalString = JSON.stringify(originalGroupConfig);
    const hasChangesResult = currentString !== originalString;

    return hasChangesResult;
  };

  // 그룹 데이터 로드
  useEffect(() => {
    if (!groupName) return;

    const loadGroupData = async () => {
      try {
        // 전체 group 데이터 로드
        const data = await readData(`groups/${groupName}`);
        if (data) {
          const validatedGroup = data as Group;
          setGroup(validatedGroup);

          // config 데이터도 별도로 로드 (백업용)
          let configData = validatedGroup.config;
          if (!configData) {
            try {
              configData = (await readData(`groups/${groupName}/config`)) as GroupConfig;
            } catch (configError) {
              console.error('!!DEBUG config 별도 로드 실패, 기본값 사용', configError);
            }
          }

          const config = configData || {
            id: groupName,
            name: groupName,
            tags: [],
            multiAccounts: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          setGroupConfig({
            ...config,
            multiAccounts: config.multiAccounts || [],
          });
          setOriginalGroupConfig({
            ...config,
            multiAccounts: config.multiAccounts || [],
          });
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
      const storedGroups =
        getLocalStorageItem<{
          recentGroups?: {
            name: string;
            id: string;
            lastVisited: string;
          }[];
        }>('recentGroups')?.recentGroups || [];

      const existingGroupIndex = storedGroups.findIndex((group) => group.name === groupName);

      if (existingGroupIndex !== -1) {
        storedGroups[existingGroupIndex].lastVisited = new Date().toISOString();
      } else {
        storedGroups.push({
          name: groupName,
          id: groupName,
          lastVisited: new Date().toISOString(),
        });
      }

      // 최근 10개만 유지
      const sortedGroups = storedGroups.sort((a, b) => new Date(b.lastVisited).getTime() - new Date(a.lastVisited).getTime()).slice(0, 10);

      setLocalStorageItem('recentGroups', { recentGroups: sortedGroups });
    };

    addToRecentGroups();
  }, [groupName]);

  const handleSaveConfig = async () => {
    if (!groupName || !group) return;

    console.log('!!DEBUG 저장 시작:', {
      groupName,
      groupConfig,
      multiAccounts: groupConfig.multiAccounts,
    });

    try {
      const updatedConfig = {
        ...groupConfig,
        updatedAt: new Date().toISOString(),
      };

      const updatedGroup = {
        ...group,
        config: updatedConfig,
      };

      // 전체 group 객체를 저장
      await writeData(`groups/${groupName}`, updatedGroup);

      // config만 별도로도 저장 (백업용)
      await writeData(`groups/${groupName}/config`, updatedConfig);

      setGroup(updatedGroup);
      setGroupConfig(updatedConfig);
      setOriginalGroupConfig(updatedConfig);

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

  const handleCancelChanges = () => {
    if (hasChanges()) {
      const confirmed = window.confirm('저장되지 않은 변경사항이 있습니다. 정말로 취소하시겠습니까?');
      if (confirmed) {
        setGroupConfig(originalGroupConfig);
        setNewTagName('');
        setNewTagColor('#2196f3');
      }
    }
  };

  const handleAddTag = () => {
    if (!newTagName.trim()) return;

    const newTag = {
      id: Date.now().toString(),
      name: newTagName.trim(),
      color: {
        background: newTagColor,
        text: getContrastColor(newTagColor),
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

  // 색상 대비를 계산하는 함수
  const getContrastColor = (hexColor: string) => {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  };

  if (showPasswordDialog) {
    return <PasswordDialog groupName={groupName} onSuccess={() => setShowPasswordDialog(false)} onFailure={() => navigate('/')} />;
  }

  return (
    <>
      <Drawer
        open={isDrawerOpen}
        groupName={groupName || ''}
        onToggle={handleToggleDrawer}
        onUpdateGroupCharacters={async () => {
          // 설정 페이지에서는 업데이트 기능을 사용하지 않음
        }}
        onOpenCharacterSearch={() => {
          // 설정 페이지에서는 검색 기능을 사용하지 않음
        }}
      />
      <PageContainer drawerOpen={isDrawerOpen}>
        <MainContent>
          <Section>
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleConfigChange('name', e.target.value)}
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
                  <SettingInput
                    type="text"
                    value={newTagName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTagName(e.target.value)}
                    placeholder="새 태그 이름"
                    style={{ flex: 1 }}
                  />
                  <ColorPicker type="color" value={newTagColor} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTagColor(e.target.value)} />
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

              <MultiAccountSettings
                multiAccounts={groupConfig.multiAccounts || []}
                onMultiAccountsChange={(newMultiAccounts) =>
                  setGroupConfig((prev) => ({
                    ...prev,
                    multiAccounts: newMultiAccounts,
                  }))
                }
                onShowToast={(message) => {
                  setToastMessage(message);
                  setIsToastVisible(true);
                  setTimeout(() => setIsToastVisible(false), 3000);
                }}
              />
            </SettingSection>

            <ButtonGroup>
              <CancelButton onClick={handleCancelChanges} disabled={!hasChanges()}>
                <X size={20} />
                취소
              </CancelButton>
              <SaveButton
                onClick={handleSaveConfig}
                disabled={!hasChanges()}
                title={`변경사항: ${hasChanges() ? '있음' : '없음'}, 다계정: ${groupConfig.multiAccounts?.length || 0}개`}
              >
                <Save size={20} />
                저장
              </SaveButton>
            </ButtonGroup>
          </Section>
        </MainContent>
      </PageContainer>
      <Toast message={toastMessage} isVisible={isToastVisible} />
    </>
  );
}

export default GroupSettingPage;
