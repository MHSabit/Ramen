import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { ApiResponseHelper } from '../helpers/api-response.helper';

@Catch(HttpException)
export class CustomExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    const status = exception.getStatus();

    const payload = exception.getResponse() as
      | string
      | { message?: string | string[]; [key: string]: any };

    // Normalize message string
    const msg = typeof payload === 'string'
      ? payload
      : Array.isArray(payload?.message)
        ? payload.message.join(', ')
        : (payload?.message as string) || exception.message;

    // Return ApiResponse format for all exceptions
    const apiResponse = ApiResponseHelper.error(
      msg,
      status,
      exception.name || 'ERROR',
      payload
    );

    response.status(status).json(apiResponse);
  }
}
