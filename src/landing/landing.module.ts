import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { LandingComponent } from './landing.component';
import { LandingController } from './landing.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [LandingController],
  providers: [LandingComponent],
})
export class LandingModule {} 