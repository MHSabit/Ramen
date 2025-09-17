import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import appConfig from '../../../config/app.config';

export interface JwtPayloadType {
  sub: string;
  iss: string;
  aud: string;
  id: string;
  email: string;
  roles: Array<{
    id: string;
    name: string;
  }>;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const accessSecret = appConfig().jwt.secret;
    console.log('JWT Strategy - Constructor - Access Secret:', accessSecret);
    console.log('JWT Strategy - Constructor - Access Secret type:', typeof accessSecret);
    console.log('JWT Strategy - Constructor - Access Secret length:', accessSecret?.length);
    console.log('JWT Strategy - Constructor - ignoreExpiration: false');
    
    if (!accessSecret) {
      console.error('JWT Strategy - CRITICAL ERROR: No JWT secret found!');
      throw new Error('JWT secret is not configured');
    }
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // ignoreExpiration: false, // This should reject expired tokens
      ignoreExpiration: false, // This should reject expired tokens
      secretOrKey: accessSecret,
    });
  }

  async validate(payload: JwtPayloadType) {
    console.log('JWT Strategy - validate - Payload:', payload);
    console.log('JWT Strategy - validate - Token exp:', new Date(payload.exp * 1000));
    console.log('JWT Strategy - validate - Current time:', new Date());
    console.log('JWT Strategy - validate - Is expired:', Date.now() > payload.exp * 1000);
    
    return {
      userId: payload.sub,
      email: payload.email,
      roles: payload.roles || []
    };
  }
}
