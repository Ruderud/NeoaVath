import { Route, Routes } from 'react-router-dom';
import { Intro } from './pages/Intro';
import { Login } from './pages/Login';
import { CreateGroup } from './pages/CreateGroup';
import { GroupAuthProvider } from './context/GroupAuthContext';
import { ErrorBoundary } from 'react-error-boundary';
import GroupPage from './pages/GroupPage';
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
        <ErrorBoundary fallbackRender={({ error }) => <div>Error: {error.message}</div>}>
          <Routes>
            <Route path="/" element={<Intro />} />
            <Route path="/login" element={<Login />} />
            <Route path="/create" element={<CreateGroup />} />
            <Route path="/group/:groupName" element={<GroupPage />} />
          </Routes>
        </ErrorBoundary>
      </GroupAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
