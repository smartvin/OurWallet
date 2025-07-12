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

interface OAuthProvider {
  type: string;
  urls: {
    callback: string,
    token: string,
    verify: string,
    profile: string
  };
}

@Injectable()
export class LineBotService {
  // In-memory storage for nonces (replace with database in production)
  private nonceStore = new Map<string, NonceRecord>();
  private oAuthProvider : OAuthProvider = {
    type: 'line',
    urls: {
      callback: process.env.LINE_CALLBACK_URL || 'http://localhost:3001/auth/line/callback',
      token: process.env.LINE_TOKEN_URL || 'https://api.line.me/oauth2/v2.1/token',
      verify: process.env.LINE_VERIFY_URL || 'https://api.line.me/oauth2/v2.1/verify',
      profile: process.env.LINE_PROFILE_URL || 'https://api.line.me/v2/profile'
    }
  };
  /**
   * start talkig back
   */
  async enter(user: string, events: any): Promise<string> {
    console.log('[BOT SERVICE] welcoming user %s mode = %s for %s', user, events.mode, JSON.stringify(events.message.text));
    
    const msg : string = "Welcome to dePick, you football degen..";
    console.log('[BOT SERVICE] say what:', msg);
    return msg;
  }

}