import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { SKIP_TRANSFORM_INTERCEPTOR } from '../decorators/skip-transform.decorator';
import { ApiResponse } from '../../types/api-response.type';

@Injectable()
export class TransformResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T> | any> {
    const skipTransform = this.reflector.getAllAndOverride<boolean>(
      SKIP_TRANSFORM_INTERCEPTOR,
      [context.getHandler(), context.getClass()],
    );

    if (skipTransform) {
      return next.handle();
    }

    const res = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => {
        // If data already has ApiResponse format, return as is
        if (
          data &&
          typeof data === 'object' &&
          'execStatus' in data &&
          'httpStatus' in data &&
          'msg' in data &&
          'customCode' in data
        ) {
          return data as ApiResponse<T>;
        }

        const statusCode = res.statusCode || HttpStatus.OK;

        return {
          execStatus: statusCode < 400,
          httpStatus: statusCode,
          msg: this.getDefaultMessageForStatus(statusCode),
          customCode: this.getCustomCodeForStatus(statusCode),
          data: data || null,
        };
      }),
    );
  }

  private getDefaultMessageForStatus(status: number): string {
    const messages = {
      200: 'Operation completed successfully',
      201: 'Resource created successfully',
      204: 'Content removed successfully',
      400: 'Invalid request',
      401: 'Unauthorized',
      403: 'Access denied',
      404: 'Resource not found',
      422: 'Invalid input data',
      500: 'Internal server error',
    };

    return messages[status] || 'Operation processed';
  }

  private getCustomCodeForStatus(status: number): string {
    const codes = {
      200: 'SUCCESS',
      201: 'CREATED',
      204: 'NO_CONTENT',
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      422: 'VALIDATION_ERROR',
      500: 'SERVER_ERROR',
    };

    return codes[status] || 'PROCESSED';
  }
}
