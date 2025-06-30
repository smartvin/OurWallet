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