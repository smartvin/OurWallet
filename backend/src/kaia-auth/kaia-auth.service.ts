import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as jwt from 'jsonwebtoken';
import { keccak256 } from 'js-sha3';
import { ethers } from 'ethers';

interface WalletChallenge {
  nonce: string;
  timestamp: number;
  domain: string;
  purpose: string;
  expiresAt: number;
}

interface ChallengeResponse {
  challengeId: string;
  message: string;
  expiresAt: number;
}

// Supported KAIA networks
const SUPPORTED_KAIA_CHAINS = {
  8217: 'KAIA Mainnet (Cypress)',
  1001: 'KAIA Testnet (Kairos)'
} as const;

type SupportedChainId = keyof typeof SUPPORTED_KAIA_CHAINS;

@Injectable()
export class KaiaAuthService {
  // In-memory storage for challenges (replace with Redis in production)
  private challengeStore = new Map<string, WalletChallenge>();

  /**
   * Generate cryptographic challenge for wallet authentication
   */
  async generateChallenge(): Promise<ChallengeResponse> {
    console.log('[KAIA SERVICE] Generating cryptographic challenge');
    
    // Generate cryptographically secure components
    const nonce = '0x' + randomBytes(32).toString('hex');
    const timestamp = Math.floor(Date.now() / 1000);
    const challengeId = randomBytes(16).toString('hex');
    const domain = process.env.APP_DOMAIN || 'localhost:3001';
    const expiresAt = Date.now() + (5 * 60 * 1000); // 5 minutes
    
    const challenge: WalletChallenge = {
      nonce,
      timestamp,
      domain,
      purpose: 'Sign in to MultiWallet',
      expiresAt
    };
    
    // Store challenge for verification
    this.challengeStore.set(challengeId, challenge);
    
    // Construct deterministic message format
    const message = this.constructChallengeMessage(challenge);
    
    // Cleanup expired challenges
    this.cleanupExpiredChallenges();
    
    console.log('[KAIA SERVICE] Challenge generated:', { challengeId, expiresAt });
    
    return {
      challengeId,
      message,
      expiresAt
    };
  }

  /**
   * Verify cryptographic signature and issue JWT
   */
  async verifySignature(
    challengeId: string,
    claimedAddress: string,
    signature: string,
    receivedMessage: string,
    chainId: number
  ): Promise<{ jwtToken: string; userData: any }> {
    console.log('[KAIA SERVICE] Starting signature verification');
    console.log('[KAIA SERVICE] Challenge ID:', challengeId);
    console.log('[KAIA SERVICE] Claimed address:', claimedAddress);
    console.log('[KAIA SERVICE] Chain ID:', chainId);
    
    try {
      // Step 1: Validate chain ID
      this.validateChainId(chainId);
      
      // Step 2: Validate challenge
      const challenge = this.validateChallenge(challengeId);
      
      // Step 3: Verify message format
      this.verifyMessageFormat(receivedMessage, challenge);
      
      // Step 4: Cryptographic verification
      const verifiedAddress = this.performCryptographicVerification(
        receivedMessage,
        signature,
        claimedAddress
      );
      
      console.log('[KAIA SERVICE] Cryptographic verification successful');
      
      // Step 5: Create JWT token
      const userData = {
        provider: 'kaia',
        address: verifiedAddress,
        chainId: chainId,
        chainName: SUPPORTED_KAIA_CHAINS[chainId as SupportedChainId],
        verified: true,
        signatureMethod: 'ECDSA-secp256k1',
        authenticatedAt: new Date().toISOString()
      };
      
      const jwtToken = jwt.sign(
        userData,
        process.env.JWT_SECRET || 'default-secret-key',
        { expiresIn: '1h' }
      );
      
      // Step 5: Cleanup used challenge
      this.challengeStore.delete(challengeId);
      console.log('[KAIA SERVICE] Challenge consumed and removed');
      
      console.log('[KAIA SERVICE] KAIA wallet authentication complete');
      
      return { jwtToken, userData };
      
    } catch (error) {
      console.error('[KAIA SERVICE] Signature verification failed:', error);
      throw error;
    }
  }

  /**
   * Construct deterministic challenge message
   */
  private constructChallengeMessage(challenge: WalletChallenge): string {
    return `${challenge.purpose}\n` +
           `Domain: ${challenge.domain}\n` +
           `Nonce: ${challenge.nonce}\n` +
           `Timestamp: ${challenge.timestamp}`;
  }

  /**
   * Validate chain ID is supported KAIA network
   */
  private validateChainId(chainId: number): void {
    if (!SUPPORTED_KAIA_CHAINS[chainId as SupportedChainId]) {
      const supportedChains = Object.entries(SUPPORTED_KAIA_CHAINS)
        .map(([id, name]) => `${id} (${name})`)
        .join(', ');
      
      console.error('[KAIA SERVICE] Unsupported chain ID:', chainId);
      console.error('[KAIA SERVICE] Supported chains:', supportedChains);
      
      throw new Error(
        `Unsupported KAIA chain ID: ${chainId}. ` +
        `Supported chains: ${supportedChains}`
      );
    }
    
    console.log('[KAIA SERVICE] Chain ID validated:', chainId, SUPPORTED_KAIA_CHAINS[chainId as SupportedChainId]);
  }

  /**
   * Validate challenge exists and hasn't expired
   */
  private validateChallenge(challengeId: string): WalletChallenge {
    const challenge = this.challengeStore.get(challengeId);
    
    if (!challenge) {
      console.error('[KAIA SERVICE] Challenge not found:', challengeId);
      throw new Error('Invalid challenge ID');
    }
    
    // Check expiration
    if (Date.now() > challenge.expiresAt) {
      this.challengeStore.delete(challengeId);
      console.error('[KAIA SERVICE] Challenge expired:', challengeId);
      throw new Error('Challenge has expired');
    }
    
    console.log('[KAIA SERVICE] Challenge validated successfully');
    return challenge;
  }

  /**
   * Verify message format matches expected structure
   */
  private verifyMessageFormat(receivedMessage: string, challenge: WalletChallenge): void {
    const expectedMessage = this.constructChallengeMessage(challenge);
    
    if (receivedMessage !== expectedMessage) {
      console.error('[KAIA SERVICE] Message format mismatch');
      console.error('[KAIA SERVICE] Expected:', expectedMessage);
      console.error('[KAIA SERVICE] Received:', receivedMessage);
      throw new Error('Message format verification failed');
    }
    
    console.log('[KAIA SERVICE] Message format verified');
  }

  /**
   * Perform ECDSA signature verification and address recovery
   */
  private performCryptographicVerification(
    message: string,
    signature: string,
    claimedAddress: string
  ): string {
    console.log('[KAIA SERVICE] Starting cryptographic verification');
    
    try {
      // Use ethers.js for robust signature verification
      const recoveredAddress = ethers.verifyMessage(message, signature);
      console.log('[KAIA SERVICE] Address recovered from signature:', recoveredAddress);
      
      // Verify addresses match (case-insensitive)
      if (recoveredAddress.toLowerCase() !== claimedAddress.toLowerCase()) {
        console.error('[KAIA SERVICE] Address mismatch');
        console.error('[KAIA SERVICE] Recovered:', recoveredAddress);
        console.error('[KAIA SERVICE] Claimed:', claimedAddress);
        throw new Error('Signature verification failed - address mismatch');
      }
      
      console.log('[KAIA SERVICE] Address verification successful');
      return recoveredAddress;
      
    } catch (error) {
      console.error('[KAIA SERVICE] Cryptographic verification error:', error);
      throw new Error('Cryptographic signature verification failed');
    }
  }


  /**
   * Clean up expired challenges
   */
  private cleanupExpiredChallenges(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [challengeId, challenge] of this.challengeStore.entries()) {
      if (now > challenge.expiresAt) {
        this.challengeStore.delete(challengeId);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log('[KAIA SERVICE] Cleaned up expired challenges:', cleanedCount);
    }
  }
}