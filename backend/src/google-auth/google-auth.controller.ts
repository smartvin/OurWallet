import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { GoogleAuthService } from './google-auth.service';

class GoogleTokenValidationDto {
  access_token!: string;
}

@ApiTags('Google Authentication')
@Controller('auth/google')
export class GoogleAuthController {
  constructor(private readonly googleAuthService: GoogleAuthService) {}

  @Post('validate')
  @ApiOperation({ summary: 'Validate Google access token and issue JWT' })
  @ApiResponse({ status: 200, description: 'Token validated successfully, JWT issued' })
  @ApiResponse({ status: 400, description: 'Invalid or expired Google token' })
  @ApiBody({
    description: 'Google access token to validate',
    type: GoogleTokenValidationDto
  })
  async validateToken(@Body() body: GoogleTokenValidationDto) {
    console.log('[GOOGLE AUTH] POST /auth/google/validate - Token validation request');
    
    try {
      const { access_token } = body;
      
      if (!access_token) {
        console.error('[GOOGLE AUTH] Missing access token');
        throw new HttpException(
          'Missing access_token in request body',
          HttpStatus.BAD_REQUEST
        );
      }
      
      console.log('[GOOGLE AUTH] Validating Google access token');
      const { jwtToken, userData } = await this.googleAuthService.validateGoogleToken(access_token);
      
      console.log('[GOOGLE AUTH] Token validation successful:', {
        googleId: userData.googleId,
        email: userData.email,
        name: userData.name
      });
      
      return {
        success: true,
        auth_token: jwtToken,
        user_data: {
          provider: userData.provider,
          googleId: userData.googleId,
          email: userData.email,
          name: userData.name,
          picture: userData.picture,
          verified: userData.verified
        }
      };
      
    } catch (error) {
      console.error('[GOOGLE AUTH] Token validation failed:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Token validation failed';
      throw new HttpException(
        errorMessage,
        HttpStatus.BAD_REQUEST
      );
    }
  }
}