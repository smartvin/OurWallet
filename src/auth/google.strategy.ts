import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { UserService } from '../user/user.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private userService: UserService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    console.log('Google Strategy - validate called with profile:', profile.id);
    const { name, emails, photos } = profile;
    const user = {
      googleId: profile.id,
      email: emails[0].value,
      displayName: name.givenName + ' ' + name.familyName,
      picture: photos[0].value,
    };

    const existingUser = await this.userService.findByGoogleId(profile.id);
    if (existingUser) {
      console.log('Google Strategy - found existing user:', existingUser.id);
      return done(null, existingUser);
    }

    console.log('Google Strategy - creating new user');
    const newUser = await this.userService.create(user);
    return done(null, newUser);
  }
} 