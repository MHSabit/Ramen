import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';

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

    // Return desired error response format
    response.status(status).json({
      success: false,
      message: msg,
      error: exception.name || 'Error',
      statusCode: status,
    });
  }
}
