import { Controller, Get, Query, Body, HttpStatus, Res, Post } from '@nestjs/common';
import { Response } from 'express';
import { ApiBody, ApiProperty, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LineBotService } from './lineBot.service';


class LineBotMessage {
  constructor() {
    this.destination = "undefined";
    this.events = {};
  }
  destination : string;
  events: any;
}

@ApiTags('LINE Messaging API')
@Controller('bot/line')

export class LineBotController {
  constructor(private readonly lineBotService: LineBotService) { }



  @Post('enter')
  @ApiOperation({ summary: 'Handle OA bot communication with LINE Platform' })
  @ApiResponse({ status: 201, description: 'SUCCESS' })
  @ApiResponse({ status: 400, description: 'Invalid authorization code or state' })
  async enterBot(@Body() data: LineBotMessage) {
    console.log('[LINE BOT] POST /bot/line/enter - Bottalk');
    console.log('[LINE AUTH] Callback params:', {
      user: data.destination,
      events: data.events[0],
      mode: data.events[0].mode,
      message: data.events[0].message
    });

    const msg: string = await this.lineBotService.enter(data.destination, data.events[0]);
    console.log("LineBot: returns msg = %s", msg);
    return msg;
  }

  @Get('enter')
  @ApiOperation({ summary: 'Handle OA bot communication with LINE Platform' })
  @ApiResponse({ status: 201, description: 'SUCCESS' })
  @ApiResponse({ status: 400, description: 'Invalid authorization code or state' })
  async enterBotGet(
    @Query('destination') user: string,
    @Query('events') events: {}
  ) {
    console.log('[LINE BOT] POST /bot/line/enter - Bottalk');
    console.log('[LINE AUTH] Callback params:', {
      user: user,
      events: events
    });

    const msg: string = await this.lineBotService.enter(user, events);
    console.log("LineBot: returns msg = %s", msg);
    return msg;
  }

}