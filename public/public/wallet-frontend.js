/**
 * Frontend entry point for wallet functionality
 * Compiles to JavaScript for inclusion in HTML pages
 */
/**
 * Initialize wallet functionality when DOM is ready
 */
function initializeWallet() {
    console.log('Initializing MultiWallet frontend...');
    // The WalletModalService will auto-initialize via its constructor
    // and attach to window.walletModal
    // Add event listener for wallet connection events
    document.addEventListener('wallet-connected', (event) => {
        console.log('Wallet connected:', event.detail);
        // Update UI to show connected state
        updateConnectionStatus(true, event.detail);
    });
    // Add any other initialization logic here
}
/**
 * Update connection status in UI
 */
function updateConnectionStatus(isConnected, connection) {
    // Find connection status elements in DOM
    const statusElements = document.querySelectorAll('.wallet-status');
    const connectButtons = document.querySelectorAll('.wallet-connect-btn');
    statusElements.forEach(element => {
        if (isConnected && connection) {
            element.textContent = `Connected: ${connection.account.provider} (${connection.account.address.slice(0, 6)}...)`;
            element.classList.add('connected');
        }
        else {
            element.textContent = 'Not connected';
            element.classList.remove('connected');
        }
    });
    connectButtons.forEach(button => {
        button.textContent = isConnected ? 'Disconnect' : 'Connect Wallet';
    });
}
/**
 * Utility functions for HTML pages
 */
window.WalletUtils = {
    /**
     * Open wallet connection modal
     */
    openWallet() {
        window.walletModal?.open();
    },
    /**
     * Get current wallet connection
     */
    getCurrentConnection() {
        return window.walletModal?.getCurrentConnection();
    },
    /**
     * Check if wallet is connected
     */
    isConnected() {
        const connection = window.walletModal?.getCurrentConnection();
        return connection?.isConnected || false;
    },
    /**
     * Disconnect wallet
     */
    disconnect() {
        window.walletModal?.close();
        updateConnectionStatus(false);
    },
    /**
     * Switch to KAIA network
     */
    async switchToKaia() {
        return await window.walletModal?.switchToKaia() || false;
    }
};
// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWallet);
}
else {
    initializeWallet();
}
export {};
