/**
 * WalletConnector - Silverlynx Normal Form implementation
 * Single interface for KAIA and OKX wallet connections
 */
import { v6 as kaiaV6 } from '@kaiachain/ethers-ext';
import { ConnectionState } from './types';
export class WalletConnector {
    constructor() {
        this.currentConnection = null;
        this.state = ConnectionState.DISCONNECTED;
    }
    /**
     * Connect to specified wallet provider
     */
    async connect(provider) {
        try {
            this.state = ConnectionState.CONNECTING;
            switch (provider) {
                case 'kaia':
                    return await this.connectKaia();
                case 'okx':
                    return await this.connectOkx();
                default:
                    throw new Error(`Unsupported provider: ${provider}`);
            }
        }
        catch (error) {
            this.state = ConnectionState.ERROR;
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Connect to KAIA wallet (Kaikas or compatible)
     */
    async connectKaia() {
        // Check for KAIA wallet availability
        if (typeof window === 'undefined' || !window.klaytn) {
            throw new Error('KAIA wallet not available');
        }
        // Request account access
        const accounts = await window.klaytn.enable();
        if (!accounts || accounts.length === 0) {
            throw new Error('No KAIA accounts found');
        }
        // Create KAIA provider and signer
        const provider = new kaiaV6.providers.Web3Provider(window.klaytn);
        const network = await provider.getNetwork();
        const signer = provider.getSigner();
        const account = {
            address: accounts[0],
            chainId: Number(network.chainId),
            provider: 'kaia'
        };
        const connection = {
            account,
            isConnected: true,
            signer
        };
        this.currentConnection = connection;
        this.state = ConnectionState.CONNECTED;
        return {
            success: true,
            connection
        };
    }
    /**
     * Connect to OKX wallet
     */
    async connectOkx() {
        // Check for OKX wallet availability
        if (typeof window === 'undefined' || !window.okxwallet) {
            throw new Error('OKX wallet not available');
        }
        // Request account access
        const accounts = await window.okxwallet.request({
            method: 'eth_requestAccounts'
        });
        if (!accounts || accounts.length === 0) {
            throw new Error('No OKX accounts found');
        }
        // Get chain ID
        const chainId = await window.okxwallet.request({
            method: 'eth_chainId'
        });
        // Create ethers provider for OKX  
        const provider = new kaiaV6.providers.Web3Provider(window.okxwallet);
        const signer = provider.getSigner();
        const account = {
            address: accounts[0],
            chainId: parseInt(chainId, 16),
            provider: 'okx'
        };
        const connection = {
            account,
            isConnected: true,
            signer
        };
        this.currentConnection = connection;
        this.state = ConnectionState.CONNECTED;
        return {
            success: true,
            connection
        };
    }
    /**
     * Disconnect current wallet
     */
    disconnect() {
        this.currentConnection = null;
        this.state = ConnectionState.DISCONNECTED;
    }
    /**
     * Get current connection state
     */
    getConnection() {
        return this.currentConnection;
    }
    /**
     * Get current connection state
     */
    getState() {
        return this.state;
    }
    /**
     * Switch to KAIA network for connected wallet
     */
    async switchToKaia() {
        if (!this.currentConnection) {
            return false;
        }
        try {
            const provider = this.currentConnection.signer?.provider;
            if (!provider)
                return false;
            // KAIA Mainnet configuration
            await provider.send('wallet_switchEthereumChain', [
                { chainId: '0x2019' } // KAIA mainnet
            ]);
            // Update connection chain ID
            this.currentConnection.account.chainId = 8217;
            return true;
        }
        catch (error) {
            // If network doesn't exist, add it
            try {
                await this.addKaiaNetwork();
                return await this.switchToKaia();
            }
            catch {
                return false;
            }
        }
    }
    /**
     * Add KAIA network to wallet
     */
    async addKaiaNetwork() {
        const provider = this.currentConnection?.signer?.provider;
        if (!provider)
            throw new Error('No provider available');
        await provider.send('wallet_addEthereumChain', [{
                chainId: '0x2019',
                chainName: 'KAIA Mainnet',
                nativeCurrency: {
                    name: 'KAIA',
                    symbol: 'KAIA',
                    decimals: 18
                },
                rpcUrls: ['https://public-en-cypress.klaytn.net'],
                blockExplorerUrls: ['https://scope.klaytn.com/']
            }]);
    }
}
