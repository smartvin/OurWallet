import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './entities/user.entity';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('create')
  async createUser(@Body() body: { email: string }): Promise<User> {
    return this.userService.createUser(body.email);
  }

  @Get(':id')
  async getUser(@Param('id') id: string): Promise<User> {
    return this.userService.getUser(id);
  }

  @Get(':id/balance')
  async getUserBalance(@Param('id') id: string): Promise<string> {
    return this.userService.getUserBalance(id);
  }
} 