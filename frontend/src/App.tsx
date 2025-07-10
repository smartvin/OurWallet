import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import WalletModal from './components/WalletModal';
import './App.css';

function App() {
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [user, setUser] = useState<any>(null);

  const googleClientId = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID;

  const handleAuthSuccess = (userData: any) => {
    setUser(userData);
    setShowWalletModal(false);
  };

  const handleLogout = () => {
    setUser(null);
  };

  // Check for LINE OAuth callback on page load
  useEffect(() => {
    const checkLineCallback = async () => {
      // Persistent logging function
      const logDebug = (message: string, data?: any) => {
        console.log(message, data);
        try {
          const logs = JSON.parse(sessionStorage.getItem('line_debug_logs') || '[]');
          logs.push({ timestamp: new Date().toISOString(), message, data });
          sessionStorage.setItem('line_debug_logs', JSON.stringify(logs.slice(-20)));
        } catch (error) {
          const logs = [{ timestamp: new Date().toISOString(), message, data }];
          sessionStorage.setItem('line_debug_logs', JSON.stringify(logs));
        }
      };

      const urlParams = new URLSearchParams(window.location.search);
      const authToken = urlParams.get('auth_token');
      const authSuccess = urlParams.get('auth_success') === 'true';
      const authError = urlParams.get('auth_error');
      
      logDebug('App mounted - checking for LINE OAuth callback:', {
        fullUrl: window.location.href,
        search: window.location.search,
        rawParams: Object.fromEntries(urlParams.entries()),
        authToken: authToken,
        authTokenLength: authToken?.length || 0,
        authSuccess: authSuccess,
        authError: authError || 'none',
        shouldDetectCallback: !!(authSuccess && authToken)
      });
      
      if (authSuccess && authToken) {
        logDebug('LINE OAuth callback detected in App! Processing authentication token...');
        
        try {
          // Decode JWT token (client-side)
          logDebug('Starting JWT token decode, token length:', authToken.length);
          const tokenParts = authToken.split('.');
          logDebug('JWT token parts:', { partsCount: tokenParts.length, hasParts: tokenParts.map(p => !!p) });
          
          const tokenPayload = JSON.parse(atob(tokenParts[1]));
          logDebug('JWT token decoded successfully:', {
            lineId: tokenPayload.lineId,
            displayName: tokenPayload.displayName,
            verified: tokenPayload.verified,
            fullPayload: tokenPayload
          });
          
          const userData = {
            provider: 'line',
            lineID: tokenPayload.lineId,
            displayName: tokenPayload.displayName,
            pictureUrl: tokenPayload.pictureUrl,
            verified: tokenPayload.verified,
            token: authToken
          };
          
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
          
          logDebug('Calling handleAuthSuccess with userData:', userData);
          
          try {
            handleAuthSuccess(userData);
            logDebug('handleAuthSuccess call completed successfully');
          } catch (authError) {
            logDebug('handleAuthSuccess call failed:', authError);
            throw authError;
          }
          
          logDebug('LINE authentication process completed successfully in App');
        } catch (err: any) {
          logDebug('LINE token processing failed in App:', err);
          // Could set an error state here if needed
        }
      } else if (authError) {
        logDebug('LINE OAuth error detected in App:', authError);
        // Could set an error state here if needed
      } else {
        logDebug('No LINE OAuth callback detected - normal page load');
      }
    };

    checkLineCallback();
  }, []);

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