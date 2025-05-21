import { createContext, useContext, ReactNode } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, child, Database } from 'firebase/database';

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

  const value = {
    database,
    writeData,
    readData,
    findGroup,
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
