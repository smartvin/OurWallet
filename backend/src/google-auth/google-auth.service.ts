import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

interface GoogleTokenResponse {
  aud: string;
  azp: string;
  email: string;
  email_verified: boolean;
  exp: number;
  family_name?: string;
  given_name?: string;
  hd?: string;
  iat: number;
  iss: string;
  jti: string;
  name: string;
  picture: string;
  sub: string;
}

interface GoogleUserInfo {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email: string;
  email_verified: boolean;
  locale?: string;
}

@Injectable()
export class GoogleAuthService {
  
  /**
   * Validate Google access token and create our JWT
   */
  async validateGoogleToken(accessToken: string): Promise<{ jwtToken: string; userData: any }> {
    console.log('[GOOGLE SERVICE] Starting Google token validation');
    
    try {
      // Step 1: Validate token with Google's tokeninfo endpoint
      console.log('[GOOGLE SERVICE] Validating token with Google');
      const tokenInfoResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${accessToken}`);
      
      if (!tokenInfoResponse.ok) {
        const errorText = await tokenInfoResponse.text();
        console.error('[GOOGLE SERVICE] Token validation failed:', tokenInfoResponse.status, errorText);
        throw new Error(`Google token validation failed: ${errorText}`);
      }
      
      const tokenInfo: GoogleTokenResponse = await tokenInfoResponse.json();
      
      // Step 2: Verify token is for our application
      const expectedClientId = process.env.GOOGLE_CLIENT_ID;
      if (tokenInfo.aud !== expectedClientId) {
        console.error('[GOOGLE SERVICE] Token audience mismatch:', {
          expected: expectedClientId,
          received: tokenInfo.aud
        });
        throw new Error('Token not issued for this application');
      }
      
      // Step 3: Check token expiration
      const now = Math.floor(Date.now() / 1000);
      if (tokenInfo.exp <= now) {
        console.error('[GOOGLE SERVICE] Token expired:', {
          exp: tokenInfo.exp,
          now: now
        });
        throw new Error('Token has expired');
      }
      
      // Step 4: Get detailed user info
      console.log('[GOOGLE SERVICE] Fetching user profile');
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      if (!userInfoResponse.ok) {
        const errorText = await userInfoResponse.text();
        console.error('[GOOGLE SERVICE] User info fetch failed:', userInfoResponse.status, errorText);
        throw new Error(`Failed to fetch user info: ${errorText}`);
      }
      
      const userInfo: GoogleUserInfo = await userInfoResponse.json();
      
      console.log('[GOOGLE SERVICE] User data retrieved:', {
        sub: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name,
        emailVerified: userInfo.email_verified
      });
      
      // Step 5: Create our JWT token
      console.log('[GOOGLE SERVICE] Creating JWT token');
      const userData = {
        provider: 'google',
        googleId: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        emailVerified: userInfo.email_verified,
        verified: userInfo.email_verified,
        authenticatedAt: new Date().toISOString()
      };
      
      const jwtToken = jwt.sign(
        userData,
        process.env.JWT_SECRET || 'default-secret-key',
        { expiresIn: '1h' }
      );
      
      console.log('[GOOGLE SERVICE] Google token validation complete');
      
      return {
        jwtToken,
        userData
      };
      
    } catch (error) {
      console.error('[GOOGLE SERVICE] Token validation failed:', error);
      console.error('[GOOGLE SERVICE] Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}