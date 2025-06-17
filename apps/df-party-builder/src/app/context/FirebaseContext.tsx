import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, off, set, get, child, Database } from 'firebase/database';
import type { GroupConfig } from '../types/types';

const firebaseConfig = {
  apiKey: 'AIzaSyASapJ_v8qy-HqDXqmWLLAle7Sn_MqQltw',
  authDomain: 'df-party-builder.firebaseapp.com',
  projectId: 'df-party-builder',
  storageBucket: 'df-party-builder.firebasestorage.app',
  messagingSenderId: '1031358597697',
  appId: '1:1031358597697:web:722491bfefbc84728894c0',
  measurementId: 'G-SMNE4YMR29',
};

type FirebaseContextType = {
  database: Database;
  writeData: (path: string, data: unknown) => Promise<void>;
  readData: (path: string) => Promise<unknown>;
  findGroup: (groupName: string) => Promise<unknown>;
  subscribeToData: (path: string, callback: (data: unknown) => void) => () => void;
  getGroupConfig: (groupName: string) => Promise<GroupConfig>;
  saveGroupConfig: (groupName: string, config: GroupConfig) => Promise<void>;
};

const FirebaseContext = createContext<FirebaseContextType | null>(null);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const app = initializeApp(firebaseConfig);
  // const analytics = getAnalytics(app);
  const database = getDatabase(app);

  const writeData = async (path: string, data: unknown) => {
    const dbRef = ref(database, path);
    await set(dbRef, data);
  };

  const readData = async (path: string) => {
    const dbRef = ref(database);
    try {
      const snapshot = await get(child(dbRef, path));
      if (snapshot.exists()) {
        return snapshot.val();
      }
      console.log('데이터가 없습니다');
      return null;
    } catch (error) {
      console.error('데이터를 가져오는데 실패했습니다:', error);
      return null;
    }
  };

  const findGroup = async (groupName: string) => {
    const dbRef = ref(database, 'group-names');
    const snapshot = await get(child(dbRef, groupName));
    console.log('snapshot', snapshot.val());
    return snapshot.val();
  };

  const subscribeToData = (path: string, callback: (data: unknown) => void) => {
    const dataRef = ref(database, path);
    onValue(dataRef, (snapshot) => {
      callback(snapshot.val());
    });

    return () => {
      off(dataRef);
    };
  };

  const getGroupConfig = async (groupName: string): Promise<GroupConfig> => {
    try {
      const snapshot = await get(child(ref(database), `groups/${groupName}/config`));
      if (snapshot.exists()) {
        return snapshot.val() as GroupConfig;
      }
      // 기본 설정 반환
      return {
        id: groupName,
        name: groupName,
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('그룹 설정 로드 실패:', error);
      throw error;
    }
  };

  const saveGroupConfig = async (groupName: string, config: GroupConfig): Promise<void> => {
    try {
      await set(ref(database, `groups/${groupName}/config`), {
        ...config,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('그룹 설정 저장 실패:', error);
      throw error;
    }
  };

  const value = {
    database,
    writeData,
    readData,
    findGroup,
    subscribeToData,
    getGroupConfig,
    saveGroupConfig,
  };

  return <FirebaseContext.Provider value={value}>{children}</FirebaseContext.Provider>;
}

// 커스텀 훅 생성
export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}
