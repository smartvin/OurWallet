import { Module } from '@nestjs/common';
import { LineAuthModule } from './line-auth/line-auth.module';
import { LineBotModule } from './line_official_account/lineBot.module';

@Module({
  imports: [LineAuthModule, LineBotModule],
  controllers: [],
  providers: [],
})
export class AppModule {}