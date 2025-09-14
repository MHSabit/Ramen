import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    console.log('JWT Auth Guard - canActivate called');
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    console.log('JWT Auth Guard - Authorization header:', authHeader);
    console.log('JWT Auth Guard - Request URL:', request.url);
    console.log('JWT Auth Guard - Request method:', request.method);
    
    // Check if Authorization header exists
    if (!authHeader) {
      console.log('JWT Auth Guard - No Authorization header, throwing 401');
      throw new UnauthorizedException('No authorization header');
    }
    
    // Check if it starts with Bearer
    if (!authHeader.startsWith('Bearer ')) {
      console.log('JWT Auth Guard - Invalid Authorization format, throwing 401');
      throw new UnauthorizedException('Invalid authorization format');
    }
    
    console.log('JWT Auth Guard - Calling super.canActivate');
    // Add your custom authentication logic here
    // for example, call super.logIn(request) to establish a session.
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    console.log("JWT Auth Guard - user:", user);
    console.log("JWT Auth Guard - info:", info);
    console.log("JWT Auth Guard - err:", err);
    console.log("JWT Auth Guard - info.name:", info?.name);
    console.log("JWT Auth Guard - info.message:", info?.message);
    
    // Check for specific JWT errors
    if (info?.name === 'TokenExpiredError') {
      console.log("JWT Auth Guard - Token expired");
      throw new UnauthorizedException('Token has expired');
    }
    
    if (info?.name === 'JsonWebTokenError') {
      console.log("JWT Auth Guard - Invalid token");
      throw new UnauthorizedException('Invalid token');
    }
    
    if (err || !user) {
      console.log("JWT Auth Guard - Throwing error:", err?.message || 'Unauthorized');
      throw err || new UnauthorizedException('Unauthorized');
    }
    
    console.log("JWT Auth Guard - Authentication successful");
    return user;
  }
}
