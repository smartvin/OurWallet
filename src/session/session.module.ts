import { Module, Global } from '@nestjs/common';
import { SessionService } from './session.service';
import { SessionGuard } from './guards/session.guard';

@Global()
@Module({
  providers: [SessionService, SessionGuard],
  exports: [SessionService, SessionGuard],
})
export class SessionModule {} 