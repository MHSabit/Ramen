import {
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  canActivate(context: ExecutionContext) {
    // Add your custom authentication logic here
    // for example, call super.logIn(request) to establish a session.
    return super.canActivate(context);
  }

  handleRequest(err, user, info, context: ExecutionContext, status) {
    // You can throw an exception based on either "info" or "err" arguments
    const request = context.switchToHttp().getRequest();
    const { email, password } = request.body;

    if (err || !user) {
      if (!email) {
        throw new HttpException(
          { success: false, message: 'email not provided' },
          HttpStatus.BAD_REQUEST,
        );
      } else if (!password) {
        throw new HttpException(
          { success: false, message: 'password not provided' },
          HttpStatus.BAD_REQUEST,
        );
      } else {
        const message = err?.message || info?.message || 'Unauthorized';
        throw new HttpException(
          { success: false, message },
          HttpStatus.UNAUTHORIZED,
        );
      }
    }
    return user;
  }
}
