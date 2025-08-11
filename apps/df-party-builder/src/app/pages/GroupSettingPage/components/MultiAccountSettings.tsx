import { useState } from 'react';
import { MultiAccount } from '../../../types/types';
import { Plus, UserPlus, Search } from 'lucide-react';
import { getDundamData } from '../../../api/dundam';
import {
  SettingItem,
  SettingLabel,
  SettingInput,
  SettingButton,
  MultiAccountContainer,
  MultiAccountItem,
  AdventureNameList,
  AdventureNameItem,
  TagButton,
} from '../styles';

type MultiAccountSettingsProps = {
  multiAccounts: MultiAccount[];
  onMultiAccountsChange: (multiAccounts: MultiAccount[]) => void;
  onShowToast: (message: string) => void;
};

export function MultiAccountSettings({ multiAccounts, onMultiAccountsChange, onShowToast }: MultiAccountSettingsProps) {
  const [newUsername, setNewUsername] = useState('');
  const [newAdventureName, setNewAdventureName] = useState('');
  const [isAddingNewAccount, setIsAddingNewAccount] = useState(false);
  const [isSearchingAdventure, setIsSearchingAdventure] = useState(false);

  const handleAddMultiAccount = () => {
    if (!newUsername.trim()) return;

    const newMultiAccount: MultiAccount = {
      id: Date.now().toString(),
      username: newUsername.trim(),
      adventureNames: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedMultiAccounts = [...(multiAccounts || []), newMultiAccount];

    console.log('!!DEBUG 다계정 추가:', {
      newMultiAccount,
      updatedMultiAccounts,
      currentLength: multiAccounts?.length || 0,
      newLength: updatedMultiAccounts.length,
    });

    onMultiAccountsChange(updatedMultiAccounts);
    setNewUsername('');
    setNewAdventureName('');
    setIsAddingNewAccount(false);
  };

  const handleCancelAddAccount = () => {
    setNewUsername('');
    setNewAdventureName('');
    setIsAddingNewAccount(false);
  };

  const handleRemoveMultiAccount = (accountId: string) => {
    onMultiAccountsChange((multiAccounts || []).filter((account) => account.id !== accountId));
  };

  const handleAddAdventureName = async (accountId: string) => {
    if (!newAdventureName.trim()) return;

    setIsSearchingAdventure(true);

    try {
      // 던담 API로 모험단 검색
      const result = await getDundamData({
        name: newAdventureName.trim(),
        type: 'adventure',
      });

      if (result.characters && result.characters.length > 0) {
        // 검색 결과가 있으면 모험단 추가
        onMultiAccountsChange(
          (multiAccounts || []).map((account) =>
            account.id === accountId
              ? {
                  ...account,
                  adventureNames: [...(account.adventureNames || []), newAdventureName.trim()],
                  updatedAt: new Date().toISOString(),
                }
              : account,
          ),
        );
        setNewAdventureName('');
        onShowToast(`모험단 "${newAdventureName.trim()}"이(가) 추가되었습니다.`);
      } else {
        // 검색 결과가 없으면 토스트 메시지 표시
        onShowToast(`"${newAdventureName.trim()}" 모험단으로 검색된 내용이 없습니다.`);
      }
    } catch (error) {
      console.error('!!DEBUG 모험단 검색 실패:', error);
      onShowToast('모험단 검색 중 오류가 발생했습니다.');
    } finally {
      setIsSearchingAdventure(false);
    }
  };

  const handleRemoveAdventureName = (accountId: string, adventureName: string) => {
    onMultiAccountsChange(
      (multiAccounts || []).map((account) =>
        account.id === accountId
          ? {
              ...account,
              adventureNames: (account.adventureNames || []).filter((name) => name !== adventureName),
              updatedAt: new Date().toISOString(),
            }
          : account,
      ),
    );
  };

  return (
    <SettingItem>
      <SettingLabel>
        <UserPlus size={20} />
        다계정 설정
      </SettingLabel>

      <MultiAccountContainer>
        {(multiAccounts || []).map((account) => (
          <MultiAccountItem key={account.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <strong>{account.username}</strong>
              <TagButton onClick={() => handleRemoveMultiAccount(account.id)}>×</TagButton>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <SettingInput
                type="text"
                value={newAdventureName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAdventureName(e.target.value)}
                placeholder="모험단 이름"
                style={{ flex: 1 }}
                disabled={isSearchingAdventure}
              />
              <SettingButton onClick={() => handleAddAdventureName(account.id)} disabled={!newAdventureName.trim() || isSearchingAdventure}>
                {isSearchingAdventure ? <Search size={16} /> : <Plus size={16} />}
                {isSearchingAdventure ? '검색중...' : '추가'}
              </SettingButton>
            </div>
            <AdventureNameList>
              {(account.adventureNames || []).map((adventureName, index) => (
                <AdventureNameItem key={index}>
                  {adventureName}
                  <TagButton onClick={() => handleRemoveAdventureName(account.id, adventureName)}>×</TagButton>
                </AdventureNameItem>
              ))}
            </AdventureNameList>
          </MultiAccountItem>
        ))}

        {(multiAccounts || []).length === 0 && !isAddingNewAccount && (
          <div
            style={{
              textAlign: 'center',
              padding: '32px 16px',
              color: '#666',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              border: '1px dashed #ddd',
            }}
          >
            <div style={{ marginBottom: '16px', fontSize: '1.1em' }}>설정된 다계정이 없습니다</div>
            <SettingButton onClick={() => setIsAddingNewAccount(true)}>
              <UserPlus size={16} />
              다계정 추가
            </SettingButton>
          </div>
        )}

        {isAddingNewAccount && (
          <MultiAccountItem>
            <div style={{ marginBottom: '16px' }}>
              <strong>새 다계정 추가</strong>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <SettingInput
                type="text"
                value={newUsername}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUsername(e.target.value)}
                placeholder="사용자 이름"
                style={{ flex: 1 }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <SettingButton onClick={handleAddMultiAccount} disabled={!newUsername.trim()}>
                <Plus size={16} />
                추가
              </SettingButton>
              <SettingButton onClick={handleCancelAddAccount} style={{ backgroundColor: '#f5f5f5', color: '#666' }}>
                취소
              </SettingButton>
            </div>
          </MultiAccountItem>
        )}

        {(multiAccounts || []).length > 0 && !isAddingNewAccount && (
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <SettingButton onClick={() => setIsAddingNewAccount(true)}>
              <UserPlus size={16} />
              다계정 추가
            </SettingButton>
          </div>
        )}
      </MultiAccountContainer>
    </SettingItem>
  );
}
