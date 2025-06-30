/**
 * Controller to serve wallet frontend TypeScript functionality
 * Handles wallet operations and serves compiled assets
 */

import { Controller, Get, Post, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { WalletProvider, WalletConnectionResult } from './types';

@Controller('wallet-frontend')
export class WalletFrontendController {

  /**
   * Serve the compiled wallet TypeScript as JavaScript
   */
  @Get('wallet.js')
  getWalletScript(@Res() res: Response): void {
    const script = `
      // TypeScript-generated wallet frontend script
      class WalletManager {
        constructor() {
          this.isOpen = false;
          this.connectionState = 'disconnected';
          this.error = '';
          this.initializeModal();
        }

        initializeModal() {
          const modalHTML = \`
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
          \`;

          document.body.insertAdjacentHTML('beforeend', modalHTML);
          this.bindEvents();
        }

        bindEvents() {
          document.getElementById('modal-close-btn').addEventListener('click', () => this.close());
          
          document.querySelectorAll('.wallet-button[data-provider]').forEach(button => {
            button.addEventListener('click', async (e) => {
              const provider = e.currentTarget.getAttribute('data-provider');
              await this.handleConnect(provider);
            });
          });

          document.getElementById('wallet-modal-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'wallet-modal-overlay') {
              this.close();
            }
          });
        }

        async handleConnect(provider) {
          this.setConnectionState('connecting');
          this.setError('');

          try {
            // Use browser-side wallet detection and connection
            if (provider === 'kaia') {
              await this.connectKaiaWallet();
            } else if (provider === 'okx') {
              await this.connectOkxWallet();
            } else {
              throw new Error('Social login not implemented yet');
            }
          } catch (error) {
            this.setConnectionState('error');
            this.setError(error.message || 'Unknown error');
          }
        }

        async connectKaiaWallet() {
          if (!window.klaytn) {
            throw new Error('KAIA wallet not found. Please install Kaikas extension.');
          }

          const accounts = await window.klaytn.enable();
          if (!accounts || accounts.length === 0) {
            throw new Error('No KAIA accounts found.');
          }

          this.setConnectionState('connected');
          this.close();
          this.updateUI(true, {
            account: {
              address: accounts[0],
              chainId: 8217,
              provider: 'kaia'
            },
            isConnected: true
          });
        }

        async connectOkxWallet() {
          if (!window.okxwallet) {
            throw new Error('OKX wallet not found. Please install OKX Wallet extension.');
          }

          const accounts = await window.okxwallet.request({
            method: 'eth_requestAccounts'
          });

          if (!accounts || accounts.length === 0) {
            throw new Error('No OKX accounts found.');
          }

          this.setConnectionState('connected');
          this.close();
          this.updateUI(true, {
            account: {
              address: accounts[0],
              chainId: 8217,
              provider: 'okx'
            },
            isConnected: true
          });
        }

        setConnectionState(state) {
          this.connectionState = state;
          const buttons = document.querySelectorAll('.wallet-button');
          const loading = document.getElementById('loading-section');
          
          if (state === 'connecting') {
            buttons.forEach(btn => btn.disabled = true);
            loading.style.display = 'block';
          } else {
            buttons.forEach(btn => {
              const provider = btn.getAttribute('data-provider');
              btn.disabled = provider === 'google' || provider === 'line';
            });
            loading.style.display = 'none';
          }
        }

        setError(error) {
          this.error = error;
          const errorSection = document.getElementById('error-section');
          const errorMessage = document.getElementById('error-message');
          
          if (error) {
            errorMessage.textContent = error;
            errorSection.style.display = 'block';
          } else {
            errorSection.style.display = 'none';
          }
        }

        updateUI(isConnected, connection) {
          const statusElements = document.querySelectorAll('.wallet-status');
          const connectButtons = document.querySelectorAll('.wallet-connect-btn');
          
          statusElements.forEach(element => {
            if (isConnected && connection) {
              element.textContent = \`Connected: \${connection.account.provider} (\${connection.account.address.slice(0, 6)}...)\`;
              element.classList.add('connected');
            } else {
              element.textContent = 'Not connected';
              element.classList.remove('connected');
            }
          });
          
          connectButtons.forEach(button => {
            button.textContent = isConnected ? 'Disconnect' : 'Connect Wallet';
          });
        }

        open() {
          this.isOpen = true;
          document.getElementById('wallet-modal-overlay').style.display = 'flex';
        }

        close() {
          this.isOpen = false;
          document.getElementById('wallet-modal-overlay').style.display = 'none';
          this.setConnectionState('disconnected');
          this.setError('');
        }
      }

      // Global wallet utilities
      window.WalletUtils = {
        openWallet() { window.walletManager.open(); },
        closeWallet() { window.walletManager.close(); },
        isConnected() { return window.walletManager.connectionState === 'connected'; }
      };

      // Initialize when DOM is ready
      document.addEventListener('DOMContentLoaded', () => {
        window.walletManager = new WalletManager();
      });
    `;

    res.setHeader('Content-Type', 'application/javascript');
    res.send(script);
  }
}