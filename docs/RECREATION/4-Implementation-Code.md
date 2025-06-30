# MultiWallet Recreation Implementation Code

## Complete Implementation Guide

### 1. Project Setup and Dependencies

#### package.json (Essential Dependencies)
```json
{
  "name": "wallet-management",
  "version": "1.0.0",
  "description": "Secure wallet management system",
  "scripts": {
    "build": "tsc",
    "build:frontend": "vite build", 
    "start": "node dist/main.js",
    "dev": "ts-node-dev --respawn src/main.ts",
    "dev:frontend": "vite",
    "dev:both": "concurrently \"npm run dev\" \"npm run dev:frontend\"",
    "test": "jest",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\""
  },
  "dependencies": {
    "@react-oauth/google": "^0.12.2",
    "react": "^19.1.0", 
    "react-dom": "^19.1.0"
  },
  "devDependencies": {
    "@types/react": "^19.1.8",
    "@types/react-dom": "^19.1.6", 
    "@vitejs/plugin-react": "^4.6.0",
    "concurrently": "^9.2.0",
    "typescript": "^5.1.3",
    "vite": "^6.3.5"
  }
}
```

#### vite.config.ts
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: 'frontend',
  build: {
    outDir: '../public/dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

### 2. Environment Configuration

#### frontend/.env.local
```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### 3. TypeScript Declarations

#### frontend/src/vite-env.d.ts
```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

#### frontend/src/types/global.d.ts
```typescript
/**
 * Global type declarations for browser wallet extensions and APIs
 */

declare global {
  interface Window {
    // Google API
    gapi: any;
    
    // KAIA Wallet (Kaikas)
    klaytn?: {
      enable(): Promise<string[]>;
      isEnabled(): boolean;
      networkVersion: string;
    };
    
    // OKX Wallet
    okxwallet?: {
      request(args: { method: string; params?: any[] }): Promise<any>;
      isConnected(): boolean;
    };
  }
}

export {};
```

### 4. HTML Entry Point

#### frontend/index.html
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MultiWallet - Clean Authentication</title>
</head>
<body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

### 5. React Application Entry Point

#### frontend/src/main.tsx
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

#### frontend/src/index.css
```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  line-height: 1.5;
  color: #333;
  background-color: #f5f5f5;
}

button {
  cursor: pointer;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 500;
  transition: all 0.2s ease;
}

button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}
```

### 6. Main Application Component

#### frontend/src/App.tsx
```typescript
import React, { useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import WalletModal from './components/WalletModal';
import './App.css';

function App() {
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [user, setUser] = useState<any>(null);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleAuthSuccess = (userData: any) => {
    setUser(userData);
    setShowWalletModal(false);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!googleClientId) {
    return <div>Error: VITE_GOOGLE_CLIENT_ID not configured</div>;
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <div className="app">
        <header className="app-header">
          <h1>MultiWallet - Clean Authentication</h1>
          <div className="header-controls">
            <span className={`wallet-status ${user ? 'connected' : ''}`}>
              {user ? `Connected: ${user.provider} (${(user.address || user.email || '').slice(0, 6)}...)` : 'Not connected'}
            </span>
            <button 
              className="wallet-connect-btn"
              onClick={() => user ? handleLogout() : setShowWalletModal(true)}
            >
              {user ? 'Disconnect' : 'Connect Wallet'}
            </button>
          </div>
        </header>

        <main className="app-main">
          {!user ? (
            <div className="auth-section">
              <h2>Please connect your wallet to continue</h2>
              <p>Choose from Google OAuth, KAIA Wallet, or OKX Wallet</p>
            </div>
          ) : (
            <div className="user-section">
              <h2>✅ Authentication Successful</h2>
              <div className="user-info">
                <p><strong>Provider:</strong> {user.provider}</p>
                <p><strong>Identity:</strong> {user.address || user.email}</p>
                {user.chainId && <p><strong>Chain ID:</strong> {user.chainId}</p>}
              </div>
            </div>
          )}
        </main>

        {showWalletModal && (
          <WalletModal 
            onClose={() => setShowWalletModal(false)}
            onAuthSuccess={handleAuthSuccess}
          />
        )}
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;
```

#### frontend/src/App.css
```css
/* Import the existing wallet modal CSS */
@import url('../../public/wallet-modal.css');

.app {
  min-height: 100vh;
  background: #f5f5f5;
}

.app-header {
  background: white;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.app-header h1 {
  margin: 0;
  color: #1a1a1a;
  font-size: 24px;
  font-weight: 600;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.app-main {
  padding: 40px 20px;
  text-align: center;
}

.auth-section {
  max-width: 500px;
  margin: 0 auto;
}

.auth-section h2 {
  color: #1a1a1a;
  margin-bottom: 16px;
  font-size: 28px;
  font-weight: 600;
}

.auth-section p {
  color: #666;
  font-size: 16px;
  margin-bottom: 32px;
}

.user-section {
  max-width: 500px;
  margin: 0 auto;
  background: white;
  padding: 32px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.user-section h2 {
  color: #00c853;
  margin-bottom: 24px;
  font-size: 24px;
  font-weight: 600;
}

.user-info {
  text-align: left;
  margin-bottom: 24px;
}

.user-info p {
  margin: 8px 0;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #00c853;
}

.user-info strong {
  color: #1a1a1a;
}

@media (max-width: 768px) {
  .app-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-controls {
    justify-content: space-between;
  }
  
  .app-main {
    padding: 20px;
  }
}
```

### 7. Core WalletModal Component

#### frontend/src/components/WalletModal.tsx
```typescript
import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';

interface WalletModalProps {
  onClose: () => void;
  onAuthSuccess: (userData: any) => void;
}

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error';

const WalletModal: React.FC<WalletModalProps> = ({ onClose, onAuthSuccess }) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [error, setError] = useState<string>('');

  const handleConnect = async (provider: string) => {
    setConnectionState('connecting');
    setError('');

    try {
      let userData;
      
      switch (provider) {
        case 'google':
          userData = await handleGoogleOAuth();
          break;
        case 'kaia':
          userData = await handleKaiaWallet();
          break;
        case 'okx':
          userData = await handleOkxWallet();
          break;
        default:
          throw new Error('Unsupported provider');
      }

      setConnectionState('connected');
      onAuthSuccess(userData);
    } catch (err: any) {
      setConnectionState('error');
      setError(err.message || 'Connection failed');
    }
  };

  // Handle Google login using exact dePick approach
  const googleLogin = useGoogleLogin({
    onSuccess: async (response) => {
      try {
        setConnectionState('connecting');
        const googleData = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { 'Authorization': `Bearer ${response.access_token}` }
        }).then(res => res.json());

        const userData = {
          provider: 'google',
          email: googleData.email,
          name: googleData.name,
          picture: googleData.picture,
          token: response.access_token
        };

        setConnectionState('connected');
        onAuthSuccess(userData);
      } catch (error: any) {
        setConnectionState('error');
        setError(error.message || 'Google sign-in failed');
      }
    },
    onError: (error) => {
      console.error('Google login failed:', error);
      setConnectionState('error');
      setError('Google sign-in failed');
    }
  });

  const handleGoogleOAuth = async () => {
    googleLogin();
  };

  const handleKaiaWallet = async () => {
    // Use existing KAIA wallet logic (Kaikas uses window.klaytn)
    if (!(window as any).klaytn) {
      throw new Error('KAIA wallet not found. Please install Kaikas extension.');
    }

    const accounts = await (window as any).klaytn.enable();
    if (!accounts || accounts.length === 0) {
      throw new Error('No KAIA accounts found.');
    }

    return {
      provider: 'kaia',
      address: accounts[0],
      chainId: 8217
    };
  };

  const handleOkxWallet = async () => {
    // Use existing OKX wallet logic
    if (!(window as any).okxwallet) {
      throw new Error('OKX wallet not found. Please install OKX Wallet extension.');
    }

    const accounts = await (window as any).okxwallet.request({
      method: 'eth_requestAccounts'
    });

    if (!accounts || accounts.length === 0) {
      throw new Error('No OKX accounts found.');
    }

    return {
      provider: 'okx',
      address: accounts[0],
      chainId: 8217
    };
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="wallet-modal-overlay" onClick={handleOverlayClick}>
      <div className="wallet-modal">
        <div className="wallet-modal-header">
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>
        
        <div className="wallet-modal-content">
          <div className="logo-section">
            <div className="logo-circle">
              <div className="logo-icon">💼</div>
            </div>
            <h2 className="modal-title">Mini Dapp</h2>
            <p className="modal-subtitle">Connect your wallet</p>
          </div>

          <div className="wallet-options">
            <button 
              className="wallet-button google" 
              onClick={() => handleConnect('google')}
              disabled={connectionState === 'connecting'}
            >
              <div className="wallet-icon google-icon">G</div>
              <span>Connect with Google</span>
            </button>

            <button 
              className="wallet-button line" 
              disabled
              title="LINE login will be added in Phase 2"
            >
              <div className="wallet-icon line-icon">💬</div>
              <span>Connect with LINE</span>
            </button>

            <button 
              className="wallet-button kaia" 
              onClick={() => handleConnect('kaia')}
              disabled={connectionState === 'connecting'}
            >
              <div className="wallet-icon kaia-icon">🔗</div>
              <span>Connect with KAIA Wallet</span>
            </button>

            <button 
              className="wallet-button okx" 
              onClick={() => handleConnect('okx')}
              disabled={connectionState === 'connecting'}
            >
              <div className="wallet-icon okx-icon">⚡</div>
              <span>Connect with OKX Wallet</span>
            </button>
          </div>

          {connectionState === 'connecting' && (
            <div className="loading-section">
              <div className="spinner"></div>
              <p>Connecting...</p>
            </div>
          )}

          {connectionState === 'error' && error && (
            <div className="error-section">
              <p className="error-message">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletModal;
```

### 8. Modal Styling (Exact LINE.MultiWallet.png Design)

#### public/wallet-modal.css
```css
/**
 * Wallet Modal Styles - Clean CSS separated from TypeScript logic
 */

.wallet-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.wallet-modal {
  background: white;
  border-radius: 16px;
  width: 380px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.wallet-modal-header {
  display: flex;
  justify-content: flex-end;
  padding: 16px 20px 0;
}

.close-button {
  background: none;
  border: none;
  font-size: 18px;
  color: #666;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
}

.close-button:hover {
  background: #f5f5f5;
}

.wallet-modal-content {
  padding: 0 24px 32px;
}

.logo-section {
  text-align: center;
  margin-bottom: 32px;
}

.logo-circle {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #00c853, #00e676);
  border-radius: 50%;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-icon {
  font-size: 24px;
  color: white;
}

.modal-title {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 8px;
}

.modal-subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.wallet-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.wallet-button {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 16px 20px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  background: white;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.wallet-button:hover:not(:disabled) {
  border-color: #00c853;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 200, 83, 0.15);
}

.wallet-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.wallet-icon {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: white;
}

.google-icon {
  background: #4285f4;
}

.line-icon {
  background: #00c300;
}

.kaia-icon {
  background: #ff6b35;
}

.okx-icon {
  background: #000;
}

.loading-section {
  text-align: center;
  padding: 24px 0;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #00c853;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-section {
  padding: 16px 0;
  text-align: center;
}

.error-message {
  color: #d32f2f;
  font-size: 14px;
  margin: 0;
  padding: 12px;
  background: #ffebee;
  border-radius: 8px;
  border: 1px solid #ffcdd2;
}

/* Additional styles for wallet status in main UI */
.wallet-status {
  margin-right: 16px;
  font-weight: 500;
}

.wallet-status.connected {
  color: #00c853;
}

.wallet-connect-btn {
  padding: 8px 16px;
  background: #00c853;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s ease;
}

.wallet-connect-btn:hover {
  background: #00a846;
}
```

### 9. Installation and Setup Commands

#### Step 1: Initialize Project
```bash
mkdir MultiWallet
cd MultiWallet
npm init -y
```

#### Step 2: Install Dependencies
```bash
# Install React and required dependencies
npm install react react-dom @react-oauth/google

# Install development dependencies
npm install --save-dev vite @vitejs/plugin-react typescript @types/react @types/react-dom concurrently
```

#### Step 3: Create Directory Structure
```bash
mkdir -p frontend/src/components
mkdir -p frontend/src/types
mkdir -p public
mkdir -p docs/RECREATION
```

#### Step 4: Create Configuration Files
```bash
# Create all the files listed above in their respective directories
# Copy the exact content from each code block
```

#### Step 5: Set Environment Variables
```bash
# Create frontend/.env.local
echo "VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com" > frontend/.env.local
```

#### Step 6: Development Commands
```bash
# Start frontend development server
npm run dev:frontend

# Build for production
npm run build:frontend

# Run both backend and frontend (if backend exists)
npm run dev:both
```

### 10. Testing and Verification

#### Verification Checklist
1. **Environment Setup**:
   - [ ] Node.js 18+ installed
   - [ ] NPM dependencies installed successfully
   - [ ] Environment variables configured

2. **Development Server**:
   - [ ] Vite server starts on port 5173
   - [ ] No console errors on page load
   - [ ] Google Client ID loaded correctly

3. **Google Authentication**:
   - [ ] Google button triggers popup
   - [ ] Authentication completes successfully
   - [ ] User data returned (email, name, picture)
   - [ ] No CSP violations in console

4. **Wallet Authentication**:
   - [ ] KAIA button detects Kaikas extension
   - [ ] OKX button detects OKX extension
   - [ ] Proper error messages for missing extensions
   - [ ] Successful wallet connections return address

5. **UI/UX**:
   - [ ] Modal design matches LINE.MultiWallet.png
   - [ ] Loading states display correctly
   - [ ] Error states show clear messages
   - [ ] Modal closes on successful authentication

### 11. Common Issues and Solutions

#### Issue: "VITE_GOOGLE_CLIENT_ID not found"
**Solution**: Ensure `.env.local` is in `frontend/` directory with correct variable name

#### Issue: "Google OAuth popup blocked"
**Solution**: Allow popups for localhost:5173 in browser settings

#### Issue: Wallet not detected
**Solution**: Install browser extensions (Kaikas, OKX) and refresh page

#### Issue: CSP violations
**Solution**: Verify using @react-oauth/google library (not deprecated gapi)

#### Issue: TypeScript errors
**Solution**: Ensure all type declaration files are created and imported correctly

This implementation guide provides everything needed to recreate the exact working authentication modal from scratch.