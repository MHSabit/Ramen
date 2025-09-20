import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtRefreshAuthGuard extends AuthGuard('jwt-refresh') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    // console.log("JWT Refresh Guard - user:", user);
    // console.log("JWT Refresh Guard - info:", info);
    // console.log("JWT Refresh Guard - err:", err);
    // console.log("JWT Refresh Guard - info.name:", info?.name);
    // console.log("JWT Refresh Guard - info.message:", info?.message);
    
    if (err || !user) {
      // console.log("JWT Refresh Guard - Throwing error:", err?.message || 'Invalid refresh token');
      throw err || new UnauthorizedException('Invalid refresh token');
    }
    return user;
  }
}
