import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as jwt from 'jsonwebtoken';

interface NonceRecord {
  nonce: string;
  createdAt: Date;
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
  // In-memory storage for nonces (replace with database in production)
  private nonceStore = new Map<string, NonceRecord>();

  /**
   * Generate nonce for OAuth 2.0 security
   */
  async generateNonce(): Promise<{ nonce: string; nonceId: string }> {
    console.log('🔷 [LINE SERVICE] Generating nonce for OAuth 2.0 flow');
    
    const nonce = randomBytes(16).toString('hex');
    const nonceId = randomBytes(8).toString('hex');
    
    // Store nonce with expiration (5 minutes)
    this.nonceStore.set(nonceId, {
      nonce,
      createdAt: new Date()
    });

    // Cleanup expired nonces
    this.cleanupExpiredNonces();

    console.log('✅ [LINE SERVICE] Nonce generated:', { nonceId });
    return { nonce, nonceId };
  }

  /**
   * Handle OAuth 2.0 callback - exchange code for tokens and create user session
   */
  async handleOAuthCallback(authCode: string, state: string): Promise<{ userToken: string; userData: any }> {
    console.log('🔷 [LINE SERVICE] Starting OAuth 2.0 callback processing');
    console.log('🔷 [LINE SERVICE] Auth code length:', authCode.length);
    console.log('🔷 [LINE SERVICE] State (nonceId):', state);

    // Step 1: Verify state parameter (nonceId)
    const nonceRecord = this.nonceStore.get(state);
    if (!nonceRecord) {
      console.error('❌ [LINE SERVICE] Invalid or expired state parameter');
      throw new Error('Invalid or expired state parameter');
    }

    // Check nonce expiration (5 minutes)
    const now = new Date();
    const expirationTime = new Date(nonceRecord.createdAt.getTime() + 5 * 60 * 1000);
    if (now > expirationTime) {
      this.nonceStore.delete(state);
      console.error('❌ [LINE SERVICE] Nonce expired');
      throw new Error('Nonce expired');
    }

    try {
      // Step 2: Exchange authorization code for tokens
      console.log('🔷 [LINE SERVICE] Exchanging authorization code for tokens');
      const redirectUri = process.env.LINE_CALLBACK_URL || 'http://localhost:3001/auth/line/callback';
      console.log("process.env.LINE_CALLBACK_URL %s", process.env.LINE_CALLBACK_URL)
      console.log('🔷 [LINE SERVICE] Using redirect_uri:', redirectUri);
      
      const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: authCode,
          redirect_uri: redirectUri,
          client_id: process.env.LINE_CHANNEL_ID || '2007331425',
          client_secret: process.env.LINE_CHANNEL_SECRET!
        })
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('❌ [LINE SERVICE] Token exchange failed:', tokenResponse.status, errorText);
        throw new Error(`Token exchange failed: ${errorText}`);
      }

      const tokens = await tokenResponse.json();
      console.log('✅ [LINE SERVICE] Token exchange successful');
      console.log('🔷 [LINE SERVICE] Received tokens:', {
        hasAccessToken: !!tokens.access_token,
        hasIdToken: !!tokens.id_token,
        tokenType: tokens.token_type
      });

      // Step 3: Verify ID token with nonce
      console.log('🔷 [LINE SERVICE] Verifying ID token with nonce');
      const verifyResponse = await fetch('https://api.line.me/oauth2/v2.1/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          id_token: tokens.id_token,
          client_id: process.env.LINE_CHANNEL_ID || '2007331425',
          nonce: nonceRecord.nonce
        })
      });

      if (!verifyResponse.ok) {
        const errorText = await verifyResponse.text();
        console.error('❌ [LINE SERVICE] ID token verification failed:', verifyResponse.status, errorText);
        throw new Error(`ID token verification failed: ${errorText}`);
      }

      const verificationData = await verifyResponse.json();
      console.log('✅ [LINE SERVICE] ID token verification successful');

      // Step 4: Get user profile
      console.log('🔷 [LINE SERVICE] Fetching user profile');
      const profileResponse = await fetch('https://api.line.me/v2/profile', {
        headers: { 'Authorization': `Bearer ${tokens.access_token}` }
      });

      if (!profileResponse.ok) {
        const errorText = await profileResponse.text();
        console.error('❌ [LINE SERVICE] Profile fetch failed:', profileResponse.status, errorText);
        throw new Error(`Profile fetch failed: ${errorText}`);
      }

      const userProfile = await profileResponse.json();
      console.log('✅ [LINE SERVICE] User profile retrieved');
      console.log('🔷 [LINE SERVICE] User data:', {
        userId: userProfile.userId,
        displayName: userProfile.displayName,
        hasPictureUrl: !!userProfile.pictureUrl
      });

      // Step 5: Create JWT token with user data
      console.log('🔷 [LINE SERVICE] Creating JWT token');
      const userData = {
        provider: 'line',
        lineId: userProfile.userId,
        displayName: userProfile.displayName,
        pictureUrl: userProfile.pictureUrl,
        verified: true,
        authenticatedAt: new Date().toISOString()
      };

      const userToken = jwt.sign(
        userData,
        process.env.JWT_SECRET || 'default-secret-key',
        { expiresIn: '1h' }
      );

      // Step 6: Cleanup nonce
      this.nonceStore.delete(state);
      console.log('✅ [LINE SERVICE] OAuth callback processing complete');

      return {
        userToken,
        userData
      };

    } catch (error) {
      console.error('❌ [LINE SERVICE] OAuth callback processing failed:', error);
      console.error('❌ [LINE SERVICE] Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
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
        console.log('🔷 [LINE SERVICE] Cleaned up expired nonce:', nonceId);
      }
    }
  }


}