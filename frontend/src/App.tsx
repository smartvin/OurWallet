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