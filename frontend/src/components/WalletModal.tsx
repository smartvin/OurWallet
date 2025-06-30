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