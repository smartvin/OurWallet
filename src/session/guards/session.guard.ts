import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SessionService } from '../session.service';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly sessionService: SessionService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    if (!this.sessionService.isAuthenticated(request)) {
      throw new UnauthorizedException('User is not authenticated');
    }

    return true;
  }
} 