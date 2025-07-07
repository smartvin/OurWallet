import { Controller, Post, Get, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LineAuthService } from './line-auth.service';

@ApiTags('LINE Authentication')
@Controller('auth/line')
export class LineAuthController {
  constructor(private readonly lineAuthService: LineAuthService) {}

  @Get('nonce')
  @ApiOperation({ summary: 'Generate nonce for secure LINE OpenID login' })
  @ApiResponse({ status: 200, description: 'Nonce generated successfully' })
  async generateNonce() {
    try {
      const { nonce, nonceId } = await this.lineAuthService.generateNonce();
      
      return {
        success: true,
        nonce,
        nonceId
      };
    } catch (error) {
      throw new HttpException(
        'Failed to generate nonce',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify LINE ID token with OpenID Connect protocol' })
  @ApiResponse({ status: 200, description: 'Token verified and user authenticated' })
  @ApiResponse({ status: 400, description: 'Invalid ID token or nonce' })
  async verifyIdToken(@Body() body: { idToken: string; nonceId: string }) {
    try {
      const { idToken, nonceId } = body;
      
      if (!idToken || !nonceId) {
        throw new HttpException(
          'ID token and nonce ID are required',
          HttpStatus.BAD_REQUEST
        );
      }

      // Verify ID token with LINE Platform using OpenID Connect
      const verificationResult = await this.lineAuthService.verifyIdTokenWithNonce(
        idToken,
        nonceId
      );

      if (!verificationResult.valid) {
        throw new HttpException(
          'Invalid ID token or nonce verification failed',
          HttpStatus.UNAUTHORIZED
        );
      }

      // Return user data for DePick.BE integration
      return {
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

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      console.error('LINE ID token verification error:', error);
      throw new HttpException(
        'LINE authentication failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('callback')
  @ApiOperation({ summary: 'Handle OAuth2 callback for bot_prompt flow' })
  @ApiResponse({ status: 200, description: 'OAuth2 callback handled successfully' })
  async handleOAuth2Callback(@Body() body: { code: string }) {
    try {
      const { code } = body;
      
      if (!code) {
        throw new HttpException(
          'Authorization code is required',
          HttpStatus.BAD_REQUEST
        );
      }

      // Exchange code for tokens (includes bot_prompt flow)
      const result = await this.lineAuthService.exchangeCodeForTokens(code);

      return {
        success: true,
        user: result.user,
        requiresNonceVerification: true,
        message: 'OAuth2 callback successful. Please complete OpenID verification.'
      };

    } catch (error) {
      console.error('LINE OAuth2 callback error:', error);
      throw new HttpException(
        'OAuth2 callback failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}