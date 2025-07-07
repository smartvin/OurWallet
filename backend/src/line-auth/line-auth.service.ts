import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';

interface NonceRecord {
  nonce: string;
  createdAt: Date;
  used: boolean;
}

interface VerificationResult {
  valid: boolean;
  user?: {
    userId: string;
    displayName: string;
    pictureUrl: string;
    email?: string;
  };
}

@Injectable()
export class LineAuthService {
  // In-memory storage for demo - replace with database in DePick.BE
  private nonceStore = new Map<string, NonceRecord>();

  /**
   * Generate nonce and nonceID for OpenID Connect security
   */
  async generateNonce(): Promise<{ nonce: string; nonceId: string }> {
    const nonce = randomBytes(16).toString('hex');
    const nonceId = randomBytes(8).toString('hex');
    
    // Store nonce with expiration (5 minutes)
    this.nonceStore.set(nonceId, {
      nonce,
      createdAt: new Date(),
      used: false
    });

    // Cleanup expired nonces (older than 5 minutes)
    this.cleanupExpiredNonces();

    return { nonce, nonceId };
  }

  /**
   * Verify ID token with LINE Platform using OpenID Connect protocol
   */
  async verifyIdTokenWithNonce(idToken: string, nonceId: string): Promise<VerificationResult> {
    // Retrieve nonce from storage
    const nonceRecord = this.nonceStore.get(nonceId);
    
    if (!nonceRecord || nonceRecord.used) {
      return { valid: false };
    }

    // Check if nonce is expired (5 minutes)
    const now = new Date();
    const expirationTime = new Date(nonceRecord.createdAt.getTime() + 5 * 60 * 1000);
    
    if (now > expirationTime) {
      this.nonceStore.delete(nonceId);
      return { valid: false };
    }

    try {
      // Verify ID token with LINE Platform (OpenID Connect endpoint)
      const verificationResponse = await fetch('https://api.line.me/oauth2/v2.1/verify', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          id_token: idToken,
          client_id: process.env.LINE_CHANNEL_ID || '2007331425',
          nonce: nonceRecord.nonce
        })
      });

      if (!verificationResponse.ok) {
        console.error('LINE verification failed:', await verificationResponse.text());
        return { valid: false };
      }

      const verificationData = await verificationResponse.json();

      // Mark nonce as used and delete it
      this.nonceStore.delete(nonceId);

      return {
        valid: true,
        user: {
          userId: verificationData.sub,
          displayName: verificationData.name,
          pictureUrl: verificationData.picture,
          email: verificationData.email
        }
      };

    } catch (error) {
      console.error('Error verifying ID token:', error);
      return { valid: false };
    }
  }

  /**
   * Exchange OAuth2 authorization code for tokens (supports bot_prompt flow)
   */
  async exchangeCodeForTokens(code: string): Promise<any> {
    const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.LINE_REDIRECT_URI || 'http://localhost:5173/',
        client_id: process.env.LINE_CHANNEL_ID || '2007331425',
        client_secret: process.env.LINE_CHANNEL_SECRET!
      })
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${error}`);
    }

    const tokens = await tokenResponse.json();

    // Get user profile using access token
    const profileResponse = await fetch('https://api.line.me/v2/profile', {
      headers: { 'Authorization': `Bearer ${tokens.access_token}` }
    });

    if (!profileResponse.ok) {
      throw new Error('Failed to get user profile');
    }

    const userProfile = await profileResponse.json();

    return {
      tokens,
      user: {
        userId: userProfile.userId,
        displayName: userProfile.displayName,
        pictureUrl: userProfile.pictureUrl
      }
    };
  }

  /**
   * Clean up expired nonces (older than 5 minutes)
   */
  private cleanupExpiredNonces(): void {
    const now = new Date();
    const expirationTime = 5 * 60 * 1000; // 5 minutes

    for (const [nonceId, record] of this.nonceStore.entries()) {
      if (now.getTime() - record.createdAt.getTime() > expirationTime) {
        this.nonceStore.delete(nonceId);
      }
    }
  }
}