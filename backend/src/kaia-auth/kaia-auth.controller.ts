import { Controller, Get, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { KaiaAuthService } from './kaia-auth.service';

class SignatureVerifyDto {
  challengeId!: string;
  address!: string;
  signature!: string;
  message!: string;
  chainId!: number;
}

@ApiTags('KAIA Wallet Authentication')
@Controller('auth/kaia')
export class KaiaAuthController {
  constructor(private readonly kaiaAuthService: KaiaAuthService) {}

  @Get('challenge')
  @ApiOperation({ summary: 'Generate cryptographic challenge for wallet authentication' })
  @ApiResponse({ status: 200, description: 'Challenge generated successfully' })
  async generateChallenge() {
    console.log('[KAIA AUTH] GET /auth/kaia/challenge - Generating challenge');
    
    try {
      const challengeResponse = await this.kaiaAuthService.generateChallenge();
      
      console.log('[KAIA AUTH] Challenge generation successful');
      return {
        success: true,
        ...challengeResponse
      };
      
    } catch (error) {
      console.error('[KAIA AUTH] Challenge generation failed:', error);
      throw new HttpException(
        'Failed to generate challenge',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify ECDSA signature and issue JWT token' })
  @ApiResponse({ status: 200, description: 'Signature verified successfully, JWT issued' })
  @ApiResponse({ status: 400, description: 'Invalid signature or expired challenge' })
  @ApiBody({
    description: 'Signature verification data',
    type: SignatureVerifyDto
  })
  async verifySignature(@Body() body: SignatureVerifyDto) {
    console.log('[KAIA AUTH] POST /auth/kaia/verify - Signature verification request');
    
    try {
      const { challengeId, address, signature, message, chainId } = body;
      
      // Validate required fields
      if (!challengeId || !address || !signature || !message || !chainId) {
        console.error('[KAIA AUTH] Missing required fields');
        throw new HttpException(
          'Missing required fields: challengeId, address, signature, message, chainId',
          HttpStatus.BAD_REQUEST
        );
      }
      
      console.log('[KAIA AUTH] Verifying signature for address:', address);
      console.log('[KAIA AUTH] Chain ID:', chainId);
      
      const { jwtToken, userData } = await this.kaiaAuthService.verifySignature(
        challengeId,
        address,
        signature,
        message,
        chainId
      );
      
      console.log('[KAIA AUTH] Signature verification successful:', {
        address: userData.address,
        chainId: userData.chainId
      });
      
      return {
        success: true,
        auth_token: jwtToken,
        user_data: {
          provider: userData.provider,
          address: userData.address,
          chainId: userData.chainId,
          chainName: userData.chainName,
          verified: userData.verified,
          signatureMethod: userData.signatureMethod
        }
      };
      
    } catch (error) {
      console.error('[KAIA AUTH] Signature verification failed:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Signature verification failed';
      throw new HttpException(
        errorMessage,
        HttpStatus.BAD_REQUEST
      );
    }
  }
}