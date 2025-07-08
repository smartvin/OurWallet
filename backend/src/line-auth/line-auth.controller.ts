import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LineAuthService } from './line-auth.service';

@ApiTags('LINE Authentication')
@Controller('auth/line')
export class LineAuthController {
  constructor(private readonly lineAuthService: LineAuthService) {}


  @Post('verify')
  @ApiOperation({ summary: 'Verify LIFF ID token with LINE Platform' })
  @ApiResponse({ status: 200, description: 'Token verified and user authenticated' })
  @ApiResponse({ status: 400, description: 'Invalid ID token' })
  async verifyIdToken(@Body() body: { idToken: string }) {
    console.log('🔷 [LINE AUTH] POST /auth/line/verify - Starting LIFF token verification');
    console.log('🔷 [LINE AUTH] Request body received:', { 
      hasIdToken: !!body.idToken,
      idTokenLength: body.idToken?.length 
    });
    
    try {
      const { idToken } = body;
      
      if (!idToken) {
        console.log('❌ [LINE AUTH] Missing ID token in request');
        throw new HttpException(
          'ID token is required',
          HttpStatus.BAD_REQUEST
        );
      }

      console.log('✅ [LINE AUTH] ID token received, calling verification service');
      
      // Verify LIFF ID token with LINE Platform (LIFF handles nonce internally)
      const verificationResult = await this.lineAuthService.verifyLiffIdToken(idToken);

      console.log('🔷 [LINE AUTH] Verification result:', {
        valid: verificationResult.valid,
        hasUser: !!verificationResult.user
      });

      if (!verificationResult.valid) {
        console.log('❌ [LINE AUTH] Token verification failed');
        throw new HttpException(
          'Invalid ID token verification failed',
          HttpStatus.UNAUTHORIZED
        );
      }

      console.log('✅ [LINE AUTH] Token verification successful, preparing response');
      console.log('🔷 [LINE AUTH] User data:', {
        userId: verificationResult.user!.userId,
        displayName: verificationResult.user!.displayName,
        hasPictureUrl: !!verificationResult.user!.pictureUrl
      });

      // Return user data for DePick.BE integration
      const response = {
        success: true,
        user: {
          lineID: verificationResult.user!.userId,
          displayName: verificationResult.user!.displayName,
          pictureUrl: verificationResult.user!.pictureUrl,
          // Standard format for DePick.BE integration
          id: verificationResult.user!.userId,
          username: verificationResult.user!.displayName,
          avatar: verificationResult.user!.pictureUrl
        },
        verified: true
      };

      console.log('✅ [LINE AUTH] Sending successful response to frontend');
      return response;

    } catch (error) {
      if (error instanceof HttpException) {
        console.log('❌ [LINE AUTH] HTTP Exception:', error.message);
        throw error;
      }
      
      console.error('❌ [LINE AUTH] Unexpected error during verification:', error);
      throw new HttpException(
        'LINE authentication failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

}