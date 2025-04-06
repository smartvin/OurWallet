import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SessionService } from '../session.service';

export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const sessionService = new SessionService();
    return sessionService.getUserId(request);
  },
); 