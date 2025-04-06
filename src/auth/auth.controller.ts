import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { UserService } from '../user/user.service';
import { WalletService } from '../wallet/wallet.service';
import { SessionGuard } from '../session/guards/session.guard';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    walletAddress?: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly userService: UserService,
    private readonly walletService: WalletService,
  ) {}

  @Get('status')
  @UseGuards(SessionGuard)
  async getAuthStatus(@Req() req: AuthenticatedRequest) {
    if (!req.user) {
      return { status: 'unauthenticated' };
    }
    return { 
      status: 'authenticated',
      user: req.user
    };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req: Request, @Res() res: Response) {
    console.log('Auth Controller - initiating Google OAuth');
    // Store the return URL in the session
    (req.session as any).returnUrl = req.query.returnUrl as string || '/';
    await new Promise<void>((resolve) => {
      req.session.save(() => resolve());
    });
    // Let Passport handle the redirect
    return;
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    try {
      console.log('Auth Controller - received OAuth callback');
      const user = req.user;
      
      // Create wallet for new user
      if (!user.walletAddress) {
        console.log('Auth Controller - creating wallet for user:', user.id);
        const { address, encryptedPrivateKey } = await this.walletService.createWallet();
        await this.userService.updateWallet(user.id, address, encryptedPrivateKey);
        console.log('Auth Controller - wallet created:', address);
      }
      const chain = 'amoy'; /// TODO --> .env
      console.log("this.providers = %s", this.walletService.providers);
      this.walletService.connectToChain(user.id, chain);
      console.log("connected user %s to chain %s", user.id, chain);


      // Set session data
      (req.session as any).userId = user.id;
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
            reject(err);
          } else {
            resolve();
          }
        });
      });

      // Redirect to profile page
      res.redirect(`/profile.html?userId=${user.id}`);
    } catch (error) {
      console.error('Auth callback error:', error);
      res.redirect('/');
    }
  }

  @Get('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
      }
      res.redirect('/');
    });
  }
} 