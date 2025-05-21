import { StrictMode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import * as ReactDOM from 'react-dom/client';
import App from './app/App';
import { FirebaseProvider } from './app/context/FirebaseContext';
import { QueryClientProvider } from '@tanstack/react-query';
import queryClient from './app/hooks/remote/queryClient';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <StrictMode>
    <BrowserRouter>
      <FirebaseProvider>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </FirebaseProvider>
    </BrowserRouter>
  </StrictMode>,
);
