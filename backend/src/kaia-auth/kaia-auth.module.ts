import { Module } from '@nestjs/common';
import { KaiaAuthController } from './kaia-auth.controller';
import { KaiaAuthService } from './kaia-auth.service';

@Module({
  controllers: [KaiaAuthController],
  providers: [KaiaAuthService],
  exports: [KaiaAuthService],
})
export class KaiaAuthModule {}