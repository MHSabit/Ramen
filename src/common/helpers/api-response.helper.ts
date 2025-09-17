import { HttpStatus } from '@nestjs/common';
import { ApiResponse } from '../../types/api-response.type';
import { PaginatedAPIResponse } from '../../types/api-response-v2.type';

export class ApiResponseHelper {
  static success<T>(
    data: T,
    msg: string = 'Success',
    httpStatus: number = HttpStatus.OK,
    customCode: string | null = null,
  ): ApiResponse<T> {
    return {
      execStatus: true,
      httpStatus,
      msg,
      customCode,
      data,
    };
  }

  static error(
    msg: string = 'Error',
    httpStatus: number = HttpStatus.INTERNAL_SERVER_ERROR,
    customCode: string | null = null,
    data: any = null,
  ): ApiResponse {
    return {
      execStatus: false,
      httpStatus,
      msg,
      customCode,
      data,
    };
  }

  static unauthorized(
    msg: string = 'Unauthorized',
    customCode: string | null = 'UNAUTHORIZED',
  ): ApiResponse {
    return this.error(msg, HttpStatus.UNAUTHORIZED, customCode);
  }

  static forbidden(
    msg: string = 'Forbidden',
    customCode: string | null = 'FORBIDDEN',
  ): ApiResponse {
    return this.error(msg, HttpStatus.FORBIDDEN, customCode);
  }

  static notFound(
    msg: string = 'Not Found',
    customCode: string | null = 'NOT_FOUND',
  ): ApiResponse {
    return this.error(msg, HttpStatus.NOT_FOUND, customCode);
  }

  static badRequest(
    msg: string = 'Bad Request',
    customCode: string | null = 'BAD_REQUEST',
  ): ApiResponse {
    return this.error(msg, HttpStatus.BAD_REQUEST, customCode);
  }

  static unprocessableEntity(
    msg: string = 'Unprocessable Entity',
    customCode: string | null = 'UNPROCESSABLE_ENTITY',
  ): ApiResponse {
    return this.error(msg, HttpStatus.UNPROCESSABLE_ENTITY, customCode);
  }

  static paginated<T>(
    rows: T[],
    count: number,
    msg: string = 'Success',
    httpStatus: number = HttpStatus.OK,
    customCode: string | null = null,
  ): PaginatedAPIResponse<T> {
    return {
      execStatus: true,
      httpStatus,
      msg,
      customCode,
      data: {
        rows,
        count,
      },
    };
  }
}
