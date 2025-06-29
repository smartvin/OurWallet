/**
 * WalletConnector unit tests
 */

import { WalletConnector } from './WalletConnector';
import { ConnectionState } from './types';

describe('WalletConnector', () => {
  let connector: WalletConnector;

  beforeEach(() => {
    connector = new WalletConnector();
  });

  test('should initialize with disconnected state', () => {
    expect(connector.getState()).toBe(ConnectionState.DISCONNECTED);
    expect(connector.getConnection()).toBeNull();
  });

  test('should handle unsupported provider', async () => {
    const result = await connector.connect('google' as any);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Unsupported provider');
    expect(connector.getState()).toBe(ConnectionState.ERROR);
  });

  test('should handle missing KAIA wallet', async () => {
    // Mock window without klaytn
    Object.defineProperty(global, 'window', {
      value: {},
      writable: true
    });

    const result = await connector.connect('kaia');
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('KAIA wallet not available');
  });

  test('should handle missing OKX wallet', async () => {
    // Mock window without okxwallet
    Object.defineProperty(global, 'window', {
      value: {},
      writable: true
    });

    const result = await connector.connect('okx');
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('OKX wallet not available');
  });

  test('should disconnect successfully', () => {
    connector.disconnect();
    
    expect(connector.getState()).toBe(ConnectionState.DISCONNECTED);
    expect(connector.getConnection()).toBeNull();
  });
});