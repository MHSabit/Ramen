import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import appConfig from '../../../config/app.config';

export interface JwtRefreshPayloadType {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    const refreshSecret = appConfig().jwt.secret;
    // console.log('JWT Refresh Strategy - Constructor - Secret:', refreshSecret);
    // console.log('JWT Refresh Strategy - Constructor - Secret type:', typeof refreshSecret);
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: refreshSecret,
    });
  }

  public validate(payload: JwtRefreshPayloadType): JwtRefreshPayloadType {
    // console.log('JWT Refresh Strategy - Payload:', payload);
    // console.log('JWT Refresh Strategy - Secret:', appConfig().jwt.refresh_secret);
    
    if (!payload.userId) {
      // console.log('JWT Refresh Strategy - No userId in payload');
      throw new UnauthorizedException('Invalid refresh token');
    }

    // console.log('JWT Refresh Strategy - Validation successful');
    return payload;
  }
}
