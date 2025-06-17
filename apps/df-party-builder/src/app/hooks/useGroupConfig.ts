import { useState, useEffect } from 'react';
import { useFirebase } from '../context/FirebaseContext';
import type { GroupConfig } from '../types/types';

export function useGroupConfig(groupName: string) {
  const [config, setConfig] = useState<GroupConfig | null>(null);
  const { readData, writeData } = useFirebase();

  useEffect(() => {
    if (groupName) {
      loadConfig();
    }
  }, [groupName]);

  const loadConfig = async () => {
    try {
      const data = await readData(`groups/${groupName}/config`);
      if (data) {
        setConfig(data as GroupConfig);
      } else {
        // 기본 설정 생성
        const defaultConfig: GroupConfig = {
          id: groupName,
          name: groupName,
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setConfig(defaultConfig);
      }
    } catch (error) {
      console.error('그룹 설정 로드 실패:', error);
    }
  };

  const saveConfig = async (newConfig: GroupConfig) => {
    try {
      await writeData(`groups/${groupName}/config`, {
        ...newConfig,
        updatedAt: new Date().toISOString(),
      });
      setConfig(newConfig);
    } catch (error) {
      console.error('그룹 설정 저장 실패:', error);
      throw error;
    }
  };

  return {
    config,
    saveConfig,
  };
}
