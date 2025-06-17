import { useState } from 'react';
import { Drawer } from './components/Drawer';
import { GroupConfigModal } from './components/GroupConfigModal';
import { useGroupConfig } from './hooks/useGroupConfig';

export default function Home() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [isGroupConfigModalOpen, setIsGroupConfigModalOpen] = useState(false);
  const { config: groupConfig, saveConfig: saveGroupConfig } = useGroupConfig(groupName);

  const handleDrawerToggle = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  return (
    <main>
      <Drawer open={isDrawerOpen} onToggle={handleDrawerToggle} groupName={groupName} onGroupConfigClick={() => setIsGroupConfigModalOpen(true)} />
      {groupConfig && (
        <GroupConfigModal
          isOpen={isGroupConfigModalOpen}
          onClose={() => setIsGroupConfigModalOpen(false)}
          groupName={groupName || ''}
          onSave={saveGroupConfig}
        />
      )}
    </main>
  );
}
