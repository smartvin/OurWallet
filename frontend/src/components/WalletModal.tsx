import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';

interface WalletModalProps {
  onClose: () => void;
  onAuthSuccess: (userData: any) => void;
}

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error';

declare global {
  interface Window {
    TelegramLoginWidget?: {
      dataOnauth?: (user: any) => void;
    };
  }
}

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
          userData = await handleLineOAuth();
          break;
        case 'telegram':
          userData = await handleTelegramLogin();
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
        
        // Send access token to backend for validation and JWT creation
        const backendUrl = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:3001';
        const validationResponse = await fetch(`${backendUrl}/auth/google/validate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
          body: JSON.stringify({
            access_token: response.access_token
          })
        });

        if (!validationResponse.ok) {
          const errorText = await validationResponse.text();
          throw new Error(`Google token validation failed: ${errorText}`);
        }

        const validationResult = await validationResponse.json();
        
        // Create user data with our JWT token
        const googleAuth = {
          provider: 'google',
          googleId: validationResult.user_data.googleId,
          email: validationResult.user_data.email,
          name: validationResult.user_data.name,
          picture: validationResult.user_data.picture,
          verified: validationResult.user_data.verified,
          token: validationResult.auth_token
        };

        setConnectionState('connected');
        onAuthSuccess(googleAuth);
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

      logDebug('Google login failed:', error);
      setConnectionState('error');
      setError('Google sign-in failed');
    }
  });

  const handleGoogleOAuth = async () => {
    googleLogin();
  };

  const handleLineOAuth = async () => {
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

    logDebug('handleLineOAuth: Starting LINE OAuth 2.0 authentication');

    // Check if we're in LIFF context (arrived via LIFF URL)
    const currentUrl = window.location.href;
    const hasSourceLine = currentUrl.includes('source=line');
    logDebug('LIFF context check:', {
      currentUrl,
      hasSourceLine,
      inLiffContext: hasSourceLine
    });

    const channelID = (import.meta as any).env.VITE_LINE_CHANNEL_ID || '2007331425';
    const authURL = (import.meta as any).env.VITE_AUTH_URL || 'https://access.line.me/oauth2/v2.1/authorize';

    const backendURL = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:3001';
    const callbackUrl = `${backendURL}/auth/line/callback`;

    logDebug('Configuration:', { channelID, backendURL });

    try {
      // Step 1: Get nonce from backend
      logDebug('Requesting nonce from backend', `${backendURL}/auth/line/nonce`);
      const nonceResponse = await fetch(`${backendURL}/auth/line/nonce`, {
        headers: {
          /// @notice only needed for local ngrok tunnels
          'ngrok-skip-browser-warning': 'true'
        }
      });
      logDebug('Response status:', nonceResponse.status);
      logDebug('Response headers:', Object.fromEntries(nonceResponse.headers.entries()));

      if (!nonceResponse.ok) {
        console.log('Failed to get nonce:', nonceResponse.status);
        throw new Error('Failed to get authentication nonce');
      }

      const responseText = await nonceResponse.text();

      const { nonce, nonceId } = JSON.parse(responseText);
      logDebug('Nonce received:', { nonceId });

      // Step 2: Build OAuth 2.0 URL with backend callback

      // Build OAuth URL - bot_prompt should NOT be URL encoded
      const fullAuthUrl = `${authURL}` + `?` +
        `response_type=code&` +
        `client_id=${channelID}&` +
        `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
        `state=${encodeURIComponent(nonceId)}&` +
        `bot_prompt=aggressive&` +
        `scope=${encodeURIComponent('profile openid')}&` +
        `nonce=${nonce}`;

      logDebug('OAuth URL built:', {
        inLiffContext: hasSourceLine,
        callbackUrl,
        encodedCallbackUrl: encodeURIComponent(callbackUrl),
        hasNonce: !!nonce,
        hasState: !!nonceId,
        botPrompt: 'aggressive'
      });

      // Step 3: Redirect to LINE OAuth (backend will handle callback)
      logDebug('Redirecting to LINE OAuth...');
      window.location.href = fullAuthUrl;

    } catch (error) {
      logDebug('OAuth setup failed:', error);
      throw new Error('LINE authentication setup failed');
    }
  };


  const handleKaiaWallet = async () => {
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

    logDebug('handleKaiaWallet: Starting KAIA wallet authentication');

    // Check if KAIA wallet is available
    if (!(window as any).klaytn && !(window as any).kaiawallet) {
      throw new Error('KAIA wallet not found. Please install Kaikas extension.');
    }

    const backendUrl = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:3001';
    
    try {
      // Step 1: Connect to wallet and get account
      logDebug('Connecting to KAIA wallet...');
      
      let accounts: string[] = [];
      let walletProvider: any;
      
      // Try new kaiawallet API first, fallback to legacy klaytn
      if ((window as any).kaiawallet) {
        walletProvider = (window as any).kaiawallet;
        accounts = await walletProvider.request({
          method: 'eth_requestAccounts'
        });
        logDebug('Using kaiawallet API');
      } else if ((window as any).klaytn) {
        walletProvider = (window as any).klaytn;
        accounts = await walletProvider.enable();
        logDebug('Using legacy klaytn API');
      }
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No KAIA accounts found.');
      }
      
      const address = accounts[0];
      logDebug('Wallet connected:', { address });

      // Step 2: Get current chain ID
      let chainIdNumber: number;
      
      if ((window as any).kaiawallet) {
        const chainId = await walletProvider.request({ method: 'eth_chainId' });
        chainIdNumber = parseInt(chainId, 16); // hex to decimal
      } else {
        const chainId = await walletProvider.networkVersion;
        chainIdNumber = parseInt(chainId, 10);
      }
      
      logDebug('Chain ID detected:', { chainId: chainIdNumber });

      // Step 3: Validate chain ID (8217 = KAIA Mainnet, 1001 = KAIA Testnet)
      if (chainIdNumber !== 8217 && chainIdNumber !== 1001) {
        throw new Error(
          `Unsupported KAIA network. Please switch to KAIA Mainnet (8217) or KAIA Testnet (1001). Current: ${chainIdNumber}`
        );
      }

      // Step 4: Request challenge from backend
      logDebug('Requesting challenge from backend...');
      const challengeResponse = await fetch(`${backendUrl}/auth/kaia/challenge`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (!challengeResponse.ok) {
        throw new Error('Failed to get authentication challenge');
      }

      const { challengeId, message, expiresAt } = await challengeResponse.json();
      logDebug('Challenge received:', { challengeId, expiresAt });

      // Step 5: Sign challenge message
      logDebug('Requesting signature from wallet...');
      
      let signature: string;
      if ((window as any).kaiawallet) {
        // Use new kaiawallet API
        signature = await walletProvider.request({
          method: 'personal_sign',
          params: [message, address]
        });
        logDebug('Signature received from kaiawallet API');
      } else {
        // Use legacy klaytn API
        signature = await walletProvider.request({
          method: 'personal_sign',
          params: [message, address]
        });
        logDebug('Signature received from legacy klaytn API');
      }

      // Step 6: Submit proof to backend
      logDebug('Submitting proof to backend...');
      const verifyResponse = await fetch(`${backendUrl}/auth/kaia/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          challengeId,
          address,
          signature,
          message,
          chainId: chainIdNumber
        })
      });

      if (!verifyResponse.ok) {
        const errorText = await verifyResponse.text();
        throw new Error(`KAIA signature verification failed: ${errorText}`);
      }

      const result = await verifyResponse.json();
      logDebug('Signature verification successful:', result.user_data);

      // Step 7: Create user data with our JWT token
      return {
        provider: 'kaia',
        address: result.user_data.address,
        chainId: result.user_data.chainId,
        chainName: result.user_data.chainName,
        verified: result.user_data.verified,
        token: result.auth_token
      };

    } catch (error) {
      logDebug('KAIA wallet authentication failed:', error);
      throw error;
    }
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

  const handleTelegramLogin = async () => {
    // Persistent logging function
    const logDebug = (message: string, data?: any) => {
      console.log(message, data);
      try {
        const logs = JSON.parse(sessionStorage.getItem('telegram_debug_logs') || '[]');
        logs.push({ timestamp: new Date().toISOString(), message, data });
        sessionStorage.setItem('telegram_debug_logs', JSON.stringify(logs.slice(-20)));
      } catch (error) {
        const logs = [{ timestamp: new Date().toISOString(), message, data }];
        sessionStorage.setItem('telegram_debug_logs', JSON.stringify(logs));
      }
    };

    logDebug('handleTelegramLogin: Starting Telegram authentication');

    const botUsername = (import.meta as any).env.VITE_TELEGRAM_BOT_USERNAME;
    if (!botUsername || botUsername === 'YourBotUsername') {
      logDebug('Bot username not configured');
      throw new Error('Telegram bot not configured. Please set VITE_TELEGRAM_BOT_USERNAME');
    }

    const backendUrl = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:3001';
    logDebug('Bot username:', botUsername);
    logDebug('Backend URL:', backendUrl);

    // Use redirect method with return URL
    const currentUrl = window.location.href;
    const returnUrl = `${backendUrl}/auth/telegram/callback?return_url=${encodeURIComponent(currentUrl)}`;

    logDebug('Redirect URL:', returnUrl);

    // Save state to detect when we return from Telegram
    sessionStorage.setItem('telegram_auth_pending', 'true');
    sessionStorage.setItem('telegram_auth_time', Date.now().toString());

    return new Promise((resolve, reject) => {
      // Create a container for the widget
      const container = document.createElement('div');
      container.id = 'telegram-login-container';
      container.style.position = 'fixed';
      container.style.top = '50%';
      container.style.left = '50%';
      container.style.transform = 'translate(-50%, -50%)';
      container.style.zIndex = '10000';
      container.style.backgroundColor = 'white';
      container.style.padding = '20px';
      container.style.borderRadius = '10px';
      container.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';

      // Add instructions
      const instructions = document.createElement('div');
      instructions.innerHTML = '<p style="margin-bottom: 15px; text-align: center;">Click the button below to login with Telegram</p>';
      container.appendChild(instructions);

      // Create widget container
      const widgetContainer = document.createElement('div');
      widgetContainer.style.textAlign = 'center';
      container.appendChild(widgetContainer);

      // Add close button
      const closeBtn = document.createElement('button');
      closeBtn.textContent = 'Cancel';
      closeBtn.style.marginTop = '15px';
      closeBtn.style.padding = '8px 16px';
      closeBtn.style.cursor = 'pointer';
      closeBtn.onclick = () => {
        container.remove();
        sessionStorage.removeItem('telegram_auth_pending');
        reject(new Error('User cancelled Telegram login'));
      };
      container.appendChild(closeBtn);

      document.body.appendChild(container);

      // Load Telegram Widget script with redirect URL
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.async = true;
      script.setAttribute('data-telegram-login', botUsername);
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-auth-url', returnUrl);
      script.setAttribute('data-request-access', 'write');

      script.onload = () => {
        logDebug('Telegram widget script loaded successfully with redirect URL');
      };

      script.onerror = () => {
        logDebug('Failed to load Telegram widget script');
        container.remove();
        sessionStorage.removeItem('telegram_auth_pending');
        reject(new Error('Failed to load Telegram widget'));
      };

      widgetContainer.appendChild(script);
    });
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
              className="wallet-button telegram"
              onClick={() => handleConnect('telegram')}
              disabled={connectionState === 'connecting'}
            >
              <div className="wallet-icon telegram-icon">✈️</div>
              <span>Connect with Telegram</span>
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