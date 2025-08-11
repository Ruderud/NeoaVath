import { Route, Routes } from 'react-router-dom';
import { Intro } from './pages/Intro';
import { Login } from './pages/Login';
import { CreateGroup } from './pages/CreateGroup';
import { GroupAuthProvider } from './context/GroupAuthContext';
import { DialogOverlayProvider } from './context/DialogOverlayContext';
import { CharacterDetailProvider } from './context/CharacterDetailContext';
import { ErrorBoundary } from 'react-error-boundary';
import GroupPage from './pages/GroupPage';
import GroupSettingPage from './pages/GroupSettingPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GroupAuthProvider>
        <CharacterDetailProvider>
          <DialogOverlayProvider>
            <ErrorBoundary fallbackRender={({ error }) => <div>Error: {error.message}</div>}>
              <Routes>
                <Route path="/" element={<Intro />} />
                <Route path="/login" element={<Login />} />
                <Route path="/create" element={<CreateGroup />} />
                <Route path="/group/:groupName" element={<GroupPage />} />
                <Route path="/group/:groupName/setting" element={<GroupSettingPage />} />
              </Routes>
            </ErrorBoundary>
          </DialogOverlayProvider>
        </CharacterDetailProvider>
      </GroupAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
