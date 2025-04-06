import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { SessionConfig } from './interfaces/session-config.interface';

@Injectable()
export class SessionService {
  private readonly config: SessionConfig;

  constructor() {
    this.config = {
      secret: process.env.SESSION_SECRET || 'your-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax',
      },
      name: 'sessionId',
    };
  }

  getConfig(): SessionConfig {
    return this.config;
  }

  setUserSession(req: Request, userId: number): void {
    req.session['userId'] = userId;
  }

  getUserId(req: Request): number | null {
    return req.session['userId'] || null;
  }

  clearSession(req: Request, res: Response): void {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
      }
      res.clearCookie(this.config.name);
    });
  }

  isAuthenticated(req: Request): boolean {
    return !!this.getUserId(req);
  }
} 