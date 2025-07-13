import { Module } from '@nestjs/common';
import { LineAuthModule } from './line-auth/line-auth.module';
import { LineBotModule } from './line_official_account/lineBot.module';
import { GoogleAuthModule } from './google-auth/google-auth.module';

@Module({
  imports: [LineAuthModule, LineBotModule, GoogleAuthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}