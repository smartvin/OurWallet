/**
 * Wallet connection types for MultiWallet component testing
 * Supports KAIA blockchain and standard Web3 wallets
 */

export type WalletProvider = 'kaia' | 'okx' | 'google' | 'line';

export interface WalletAccount {
  address: string;
  chainId: number;
  provider: WalletProvider;
}

export interface WalletConnection {
  account: WalletAccount;
  isConnected: boolean;
  signer?: any; // ethers.Signer or KAIA signer
}

export interface WalletConnectionResult {
  success: boolean;
  connection?: WalletConnection;
  error?: string;
}

export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting', 
  CONNECTED = 'connected',
  ERROR = 'error'
}

export interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (provider: WalletProvider) => Promise<WalletConnectionResult>;
}