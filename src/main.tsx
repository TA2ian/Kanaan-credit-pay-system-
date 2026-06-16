import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { FirebaseProvider } from './lib/FirebaseContext.tsx';
import { PopupProvider } from './lib/PopupContext.tsx';
import { registerSW } from 'virtual:pwa-register';
import './index.css';

registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FirebaseProvider>
      <PopupProvider>
        <App />
      </PopupProvider>
    </FirebaseProvider>
  </StrictMode>,
);
