import { Injectable } from '@nestjs/common';

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

  /**
   * Verify LIFF ID token with LINE Platform (LIFF handles nonce internally)
   */
  async verifyLiffIdToken(idToken: string): Promise<VerificationResult> {
    console.log('🔷 [LINE SERVICE] Starting LIFF ID token verification');
    console.log('🔷 [LINE SERVICE] ID token length:', idToken.length);
    console.log('🔷 [LINE SERVICE] Using client_id:', process.env.LINE_CHANNEL_ID || '2007331425');
    
    try {
      // Verify ID token with LINE Platform (LIFF handles nonce internally)
      console.log('🔷 [LINE SERVICE] Making request to LINE Platform verification endpoint');
      console.log('🔷 [LINE SERVICE] POST https://api.line.me/oauth2/v2.1/verify');
      
      const requestBody = new URLSearchParams({
        id_token: idToken,
        client_id: process.env.LINE_CHANNEL_ID || '2007331425'
        // No nonce parameter - LIFF handles this internally
      });
      
      console.log('🔷 [LINE SERVICE] Request body params:', {
        hasIdToken: requestBody.has('id_token'),
        clientId: requestBody.get('client_id')
      });
      
      const verificationResponse = await fetch('https://api.line.me/oauth2/v2.1/verify', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: requestBody
      });

      console.log('🔷 [LINE SERVICE] LINE Platform response status:', verificationResponse.status);
      console.log('🔷 [LINE SERVICE] LINE Platform response ok:', verificationResponse.ok);

      if (!verificationResponse.ok) {
        const errorText = await verificationResponse.text();
        console.error('❌ [LINE SERVICE] LINE verification failed with status:', verificationResponse.status);
        console.error('❌ [LINE SERVICE] Error response:', errorText);
        return { valid: false };
      }

      console.log('✅ [LINE SERVICE] LINE Platform verification successful, parsing response');
      const verificationData = await verificationResponse.json();
      
      console.log('🔷 [LINE SERVICE] Parsed verification data:', {
        hasSub: !!verificationData.sub,
        hasName: !!verificationData.name,
        hasPicture: !!verificationData.picture,
        hasEmail: !!verificationData.email,
        sub: verificationData.sub
      });

      const result = {
        valid: true,
        user: {
          userId: verificationData.sub,
          displayName: verificationData.name,
          pictureUrl: verificationData.picture,
          email: verificationData.email
        }
      };

      console.log('✅ [LINE SERVICE] Verification successful, returning user data');
      return result;

    } catch (error) {
      console.error('❌ [LINE SERVICE] Exception during LIFF ID token verification:', error);
      console.error('❌ [LINE SERVICE] Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return { valid: false };
    }
  }


}