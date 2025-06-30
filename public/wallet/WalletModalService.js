/**
 * TypeScript service for integrating WalletModal with existing HTML pages
 * Bridges the gap between React component and vanilla DOM
 */
import { WalletConnector } from './WalletConnector';
import { ConnectionState } from './types';
export class WalletModalService {
    constructor() {
        this.isOpen = false;
        this.connectionState = ConnectionState.DISCONNECTED;
        this.error = '';
        this.modalElement = null;
        this.connector = new WalletConnector();
        this.createModalDOM();
        this.bindEvents();
    }
    /**
     * Create modal DOM structure in TypeScript
     */
    createModalDOM() {
        const modalHTML = `
      <div id="wallet-modal-overlay" class="wallet-modal-overlay" style="display: none;">
        <div class="wallet-modal">
          <div class="wallet-modal-header">
            <button id="modal-close-btn" class="close-button">✕</button>
          </div>
          
          <div class="wallet-modal-content">
            <div class="logo-section">
              <div class="logo-circle">
                <div class="logo-icon">💼</div>
              </div>
              <h2 class="modal-title">Mini Dapp</h2>
              <p class="modal-subtitle">Connect your wallet</p>
            </div>

            <div class="wallet-options">
              <button class="wallet-button google" data-provider="google" disabled>
                <div class="wallet-icon google-icon">G</div>
                <span>Connect with Google</span>
              </button>

              <button class="wallet-button line" data-provider="line" disabled>
                <div class="wallet-icon line-icon">💬</div>
                <span>Connect with LINE</span>
              </button>

              <button class="wallet-button kaia" data-provider="kaia">
                <div class="wallet-icon kaia-icon">🔗</div>
                <span>Connect with KAIA Wallet</span>
              </button>

              <button class="wallet-button okx" data-provider="okx">
                <div class="wallet-icon okx-icon">⚡</div>
                <span>Connect with OKX Wallet</span>
              </button>
            </div>

            <div id="loading-section" class="loading-section" style="display: none;">
              <div class="spinner"></div>
              <p>Connecting...</p>
            </div>

            <div id="error-section" class="error-section" style="display: none;">
              <p id="error-message" class="error-message"></p>
            </div>
          </div>
        </div>
      </div>
    `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modalElement = document.getElementById('wallet-modal-overlay');
    }
    /**
     * Bind event listeners with proper TypeScript typing
     */
    bindEvents() {
        // Close button
        const closeBtn = document.getElementById('modal-close-btn');
        closeBtn?.addEventListener('click', () => this.close());
        // Wallet provider buttons
        const walletButtons = document.querySelectorAll('.wallet-button[data-provider]');
        walletButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                const provider = e.currentTarget.getAttribute('data-provider');
                if (provider) {
                    await this.handleConnect(provider);
                }
            });
        });
        // Click outside to close
        this.modalElement?.addEventListener('click', (e) => {
            if (e.target === this.modalElement) {
                this.close();
            }
        });
    }
    /**
     * Handle wallet connection with full error handling
     */
    async handleConnect(provider) {
        this.setConnectionState(ConnectionState.CONNECTING);
        this.setError('');
        try {
            const result = await this.connector.connect(provider);
            if (result.success && result.connection) {
                this.setConnectionState(ConnectionState.CONNECTED);
                this.close();
                // Emit custom event for other parts of the app to listen
                this.emitConnectionEvent('wallet-connected', result.connection);
                console.log('Wallet connected successfully:', result.connection);
            }
            else {
                this.setConnectionState(ConnectionState.ERROR);
                this.setError(result.error || 'Connection failed');
            }
        }
        catch (error) {
            this.setConnectionState(ConnectionState.ERROR);
            this.setError(error instanceof Error ? error.message : 'Unknown error');
        }
    }
    /**
     * Update connection state with UI feedback
     */
    setConnectionState(state) {
        this.connectionState = state;
        const buttons = document.querySelectorAll('.wallet-button');
        const loadingSection = document.getElementById('loading-section');
        if (state === ConnectionState.CONNECTING) {
            buttons.forEach(btn => btn.disabled = true);
            loadingSection.style.display = 'block';
        }
        else {
            buttons.forEach(btn => {
                // Re-enable only active wallet buttons
                const provider = btn.getAttribute('data-provider');
                btn.disabled = provider === 'google' || provider === 'line';
            });
            loadingSection.style.display = 'none';
        }
    }
    /**
     * Display error messages to user
     */
    setError(error) {
        this.error = error;
        const errorSection = document.getElementById('error-section');
        const errorMessage = document.getElementById('error-message');
        if (error) {
            errorMessage.textContent = error;
            errorSection.style.display = 'block';
        }
        else {
            errorSection.style.display = 'none';
        }
    }
    /**
     * Emit custom events for integration with existing app
     */
    emitConnectionEvent(eventName, data) {
        const event = new CustomEvent(eventName, {
            detail: data,
            bubbles: true
        });
        document.dispatchEvent(event);
    }
    /**
     * Public API methods
     */
    open() {
        this.isOpen = true;
        if (this.modalElement) {
            this.modalElement.style.display = 'flex';
        }
    }
    close() {
        this.isOpen = false;
        if (this.modalElement) {
            this.modalElement.style.display = 'none';
        }
        this.setConnectionState(ConnectionState.DISCONNECTED);
        this.setError('');
    }
    getCurrentConnection() {
        return this.connector.getConnection();
    }
    getConnectionState() {
        return this.connectionState;
    }
    async switchToKaia() {
        return await this.connector.switchToKaia();
    }
}
// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.walletModal = new WalletModalService();
});
