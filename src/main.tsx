import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.scss';
import '@nfid/identitykit/react/styles.css';
import { IdentityKitProvider, IdentityKitTheme } from '@nfid/identitykit/react';
import {
  NFIDW,
  IdentityKitAuthType,
  Plug,
  InternetIdentity,
  // Stoic,
} from '@nfid/identitykit';

const signers = [NFIDW, Plug, InternetIdentity];

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <IdentityKitProvider
      signers={signers}
      theme={IdentityKitTheme.DARK} // LIGHT, DARK, SYSTEM (by default)
    >
      <App />
    </IdentityKitProvider>
  </React.StrictMode>,
);
