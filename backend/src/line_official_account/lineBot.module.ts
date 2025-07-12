import { Module } from '@nestjs/common';
import { LineBotController } from './lineBot.controller';
import { LineBotService } from './lineBot.service';

@Module({
  controllers: [LineBotController],
  providers: [LineBotService],
  exports: [LineBotService],
})
export class LineBotModule {}