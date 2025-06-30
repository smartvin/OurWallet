import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { WalletFrontendController } from './wallet-frontend.controller';
import { UserModule } from '../user/user.module';
import { SessionModule } from '../session/session.module';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => UserModule),
    SessionModule
  ],
  providers: [WalletService],
  controllers: [WalletController, WalletFrontendController],
  exports: [WalletService],
})
export class WalletModule {} 