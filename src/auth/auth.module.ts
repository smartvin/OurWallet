import { Module, forwardRef } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { GoogleStrategy } from './google.strategy';
import { UserModule } from '../user/user.module';
import { WalletModule } from '../wallet/wallet.module';
import { AuthController } from './auth.controller';
import { SessionSerializer } from './session.serializer';

@Module({
  imports: [
    PassportModule.register({ session: true }),
    UserModule,
    forwardRef(() => WalletModule),
  ],
  providers: [GoogleStrategy, SessionSerializer],
  controllers: [AuthController],
  exports: [PassportModule],
})
export class AuthModule {} 