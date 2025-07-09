import { Controller, Get, Query, HttpException, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LineAuthService } from './line-auth.service';

@ApiTags('LINE Authentication')
@Controller('auth/line')
export class LineAuthController {
  constructor(private readonly lineAuthService: LineAuthService) {}


  @Get('nonce')
  @ApiOperation({ summary: 'Generate nonce for OAuth 2.0 security' })
  @ApiResponse({ status: 200, description: 'Nonce generated successfully' })
  async generateNonce() {
    console.log('[LINE AUTH] GET /auth/line/nonce - Generating nonce');
    
    try {
      const { nonce, nonceId } = await this.lineAuthService.generateNonce();
      
      console.log('[LINE AUTH] Nonce generated successfully');
      return {
        success: true,
        nonce,
        nonceId
      };
    } catch (error) {
      console.error('[LINE AUTH] Nonce generation failed:', error);
      throw new HttpException(
        'Failed to generate nonce',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('callback')
  @ApiOperation({ summary: 'Handle OAuth 2.0 callback from LINE Platform' })
  @ApiResponse({ status: 302, description: 'Redirect to frontend with auth token' })
  @ApiResponse({ status: 400, description: 'Invalid authorization code or state' })
  async handleOAuthCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
    @Query('error') error?: string
  ) {
    console.log('[LINE AUTH] GET /auth/line/callback - OAuth callback received');
    console.log('[LINE AUTH] Callback params:', {
      hasCode: !!code,
      hasState: !!state,
      error: error || 'none',
      codeLength: code?.length
    });

    try {
      // Check for OAuth errors
      if (error) {
        console.error('[LINE AUTH] OAuth error from LINE:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return res.redirect(`${frontendUrl}?auth_error=${encodeURIComponent(error)}`);
      }

      // Validate required parameters
      if (!code || !state) {
        console.error('[LINE AUTH] Missing required parameters');
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return res.redirect(`${frontendUrl}?auth_error=missing_parameters`);
      }

      // Handle OAuth callback via service
      const { jwtToken, userData } = await this.lineAuthService.handleOAuthCallback(code, state);

      console.log('[LINE AUTH] User authenticated:', {
        lineId: userData.lineId,
        displayName: userData.displayName
      });

      // Redirect to frontend with auth token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const redirectUrl = `${frontendUrl}?auth_token=${encodeURIComponent(jwtToken)}&auth_success=true`;
      
      console.log('[LINE AUTH] Redirecting to:', frontendUrl);
      return res.redirect(redirectUrl);

    } catch (error) {
      console.error('[LINE AUTH] OAuth callback processing failed:', error);
      
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      const errorUrl = `${frontendUrl}?auth_error=${encodeURIComponent(errorMessage)}`;
      
      return res.redirect(errorUrl);
    }
  }

}