import { Module } from '@nestjs/common';
import { LineAuthModule } from './line-auth/line-auth.module';

@Module({
  imports: [LineAuthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}