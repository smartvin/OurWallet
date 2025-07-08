import React, { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import liff from '@line/liff';

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
        case 'line':
          userData = await handleLineWallet();
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

  const handleLineWallet = async () => {
    // Persistent logging function
    const logDebug = (message: string, data?: any) => {
      console.log(message, data);
      const logs = JSON.parse(sessionStorage.getItem('line_debug_logs') || '[]');
      logs.push({ timestamp: new Date().toISOString(), message, data });
      sessionStorage.setItem('line_debug_logs', JSON.stringify(logs.slice(-20))); // Keep last 20 logs
    };

    logDebug('🔷 handleLineWallet: Starting LINE authentication');
    
    const liffId = (import.meta as any).env.VITE_LINE_LIFF_ID;
    const backendUrl = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:3001';
    
    logDebug('🔷 Configuration:', { liffId, backendUrl });
    
    if (!liffId) {
      throw new Error('LINE LIFF ID not configured');
    }

    // Simple LIFF authentication flow
    logDebug('🔷 Starting LIFF authentication flow');
    
    return new Promise((resolve, reject) => {
      // Step 1: Initialize LIFF SDK
      logDebug('🔷 Initializing LIFF SDK');
      liff.init({ liffId }).then(() => {
        logDebug('✅ LIFF initialized successfully');
        logDebug('🔷 LIFF login status:', liff.isLoggedIn());
        
        // Step 2: Handle login state
        if (!liff.isLoggedIn()) {
          logDebug('🔷 User not logged in, calling liff.login()');
          liff.login(); // This will handle OpenID Connect + bot_prompt automatically
          return; // liff.login() redirects, so execution stops here
        }
        
        // Step 3: Get ID token for backend verification
        const idToken = liff.getIDToken();
        logDebug('🔷 ID Token available:', !!idToken);
        
        if (idToken) {
          logDebug('✅ ID token found, verifying with backend');
          
          // Verify ID token with backend (LIFF handles nonce internally)
          verifyLiffIdTokenWithBackend(idToken, backendUrl)
            .then(result => {
              logDebug('✅ Token verification successful:', result);
              resolve(result);
            })
            .catch(error => {
              logDebug('❌ Token verification failed:', error);
              reject(error);
            });
        } else {
          logDebug('❌ No ID token available');
          reject(new Error('No ID token available'));
        }
      }).catch(error => {
        logDebug('❌ LIFF initialization failed:', error);
        reject(new Error('LIFF initialization failed'));
      });
    });
  };

  // Helper function for LIFF ID token verification
  const verifyLiffIdTokenWithBackend = async (idToken: string, backendUrl: string) => {
    const verifyResponse = await fetch(`${backendUrl}/auth/line/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    });

    if (!verifyResponse.ok) {
      throw new Error('LINE token verification failed');
    }

    const data = await verifyResponse.json();
    
    return {
      provider: 'line',
      lineID: data.user.lineID,
      displayName: data.user.displayName,
      pictureUrl: data.user.pictureUrl,
      verified: data.verified
    };
  }

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
              onClick={() => handleConnect('line')}
              disabled={connectionState === 'connecting'}
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