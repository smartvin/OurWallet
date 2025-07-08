import React, { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';

interface WalletModalProps {
  onClose: () => void;
  onAuthSuccess: (userData: any) => void;
}

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error';

const WalletModal: React.FC<WalletModalProps> = ({ onClose, onAuthSuccess }) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [error, setError] = useState<string>('');

  // LINE OAuth callback detection is now handled in App.tsx on page load

  const handleConnect = async (provider: string) => {
    setConnectionState('connecting');
    setError('');

    try {
      let userData: any;
      
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
      // Persistent logging function
      const logDebug = (message: string, data?: any) => {
        console.log(message, data);
        try {
          const logs = JSON.parse(sessionStorage.getItem('line_debug_logs') || '[]');
          logs.push({ timestamp: new Date().toISOString(), message, data });
          sessionStorage.setItem('line_debug_logs', JSON.stringify(logs.slice(-20)));
        } catch (error) {
          // If sessionStorage is corrupted, reset it
          const logs = [{ timestamp: new Date().toISOString(), message, data }];
          sessionStorage.setItem('line_debug_logs', JSON.stringify(logs));
        }
      };
      
      logDebug('❌ Google login failed:', error);
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
      try {
        const logs = JSON.parse(sessionStorage.getItem('line_debug_logs') || '[]');
        logs.push({ timestamp: new Date().toISOString(), message, data });
        sessionStorage.setItem('line_debug_logs', JSON.stringify(logs.slice(-20)));
      } catch (error) {
        const logs = [{ timestamp: new Date().toISOString(), message, data }];
        sessionStorage.setItem('line_debug_logs', JSON.stringify(logs));
      }
    };

    logDebug('🔷 handleLineWallet: Starting LINE OAuth 2.0 authentication');
    
    // Check if we're in LIFF context (arrived via LIFF URL)
    const currentUrl = window.location.href;
    const hasSourceLine = currentUrl.includes('source=line');
    logDebug('🔷 LIFF context check:', { 
      currentUrl, 
      hasSourceLine,
      inLiffContext: hasSourceLine 
    });
    
    const channelId = (import.meta as any).env.VITE_LINE_CHANNEL_ID || '2007331425';
    const backendUrl = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:3001';
    
    logDebug('🔷 Configuration:', { channelId, backendUrl });
    
    try {
      // Step 1: Get nonce from backend
      logDebug('🔷 Requesting nonce from backend', `${backendUrl}/auth/line/nonce`);
      const nonceResponse = await fetch(`${backendUrl}/auth/line/nonce`, {
        headers: {
          /// @notice only needed for local ngrok tunnels
          'ngrok-skip-browser-warning': 'true'
        }
      });
      logDebug('🔷 Response status:', nonceResponse.status);
      logDebug('🔷 Response headers:', Object.fromEntries(nonceResponse.headers.entries()));
      
      if (!nonceResponse.ok) {
        console.log('❌ Failed to get nonce:', nonceResponse.status);
        throw new Error('Failed to get authentication nonce');
      }
      
      const responseText = await nonceResponse.text();
      logDebug('🔷 Raw response text:', responseText);
      
      const { nonce, nonceId } = JSON.parse(responseText);
      logDebug('✅ Nonce received:', { nonceId });

      // Step 2: Build OAuth 2.0 URL with backend callback
      const callbackUrl = `${backendUrl}/auth/line/callback`;
      
      // When in LIFF context, we still use OAuth but the flow is the same
      const authUrl = `https://access.line.me/oauth2/v2.1/authorize?` +
        `response_type=code&` +
        `client_id=${channelId}&` +
        `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
        `scope=${encodeURIComponent('profile openid')}&` +
        `state=${encodeURIComponent(nonceId)}&` +
        `bot_prompt=aggressive&` +
        `nonce=${nonce}`;
      
      logDebug('🔷 OAuth URL built:', {
        inLiffContext: hasSourceLine,
        callbackUrl,
        encodedCallbackUrl: encodeURIComponent(callbackUrl),
        hasNonce: !!nonce,
        hasState: !!nonceId,
        botPrompt: 'aggressive'
      });
      logDebug('🔷 Complete OAuth URL:', authUrl);
      
      // Step 3: Redirect to LINE OAuth (backend will handle callback)
      logDebug('🔷 Redirecting to LINE OAuth...');
      window.location.href = authUrl;
      
    } catch (error) {
      logDebug('❌ OAuth setup failed:', error);
      throw new Error('LINE authentication setup failed');
    }
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