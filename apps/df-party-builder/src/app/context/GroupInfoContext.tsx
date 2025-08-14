import { createContext, useContext, useState, ReactNode } from 'react';
import { Group } from '../types/types';

type GroupInfoContextType = {
  group: Group | null;
  setGroup: (group: Group | null) => void;
};

const GroupInfoContext = createContext<GroupInfoContextType | undefined>(undefined);

export function GroupInfoProvider({ children }: { children: ReactNode }) {
  const [group, setGroup] = useState<Group | null>(null);

  return <GroupInfoContext.Provider value={{ group, setGroup }}>{children}</GroupInfoContext.Provider>;
}

export function useGroupInfo() {
  const context = useContext(GroupInfoContext);
  if (context === undefined) {
    throw new Error('useGroupInfo must be used within a GroupInfoProvider');
  }
  return context;
}
