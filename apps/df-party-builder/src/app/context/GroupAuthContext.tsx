import { createContext, useContext, useState, ReactNode } from 'react';

interface GroupAuthContextType {
  authenticatedGroups: Set<string>;
  addAuthenticatedGroup: (groupId: string) => void;
  isGroupAuthenticated: (groupId: string) => boolean;
}

const GroupAuthContext = createContext<GroupAuthContextType | null>(null);

export function GroupAuthProvider({ children }: { children: ReactNode }) {
  const [authenticatedGroups] = useState<Set<string>>(new Set());

  const addAuthenticatedGroup = (groupId: string) => {
    authenticatedGroups.add(groupId);
  };

  const isGroupAuthenticated = (groupId: string) => {
    return authenticatedGroups.has(groupId);
  };

  return (
    <GroupAuthContext.Provider
      value={{
        authenticatedGroups,
        addAuthenticatedGroup,
        isGroupAuthenticated,
      }}
    >
      {children}
    </GroupAuthContext.Provider>
  );
}

export function useGroupAuth() {
  const context = useContext(GroupAuthContext);
  if (!context) {
    throw new Error('useGroupAuth must be used within a GroupAuthProvider');
  }
  return context;
}
