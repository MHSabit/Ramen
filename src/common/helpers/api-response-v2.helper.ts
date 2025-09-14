import { HttpStatus } from '@nestjs/common';
import { APIResponse, PaginatedAPIResponse } from '../../types/api-response-v2.type';

export class APIResponseHelper {
  static success<T>(
    data: T,
    message: string = 'Operation completed successfully',
    statusCode: number = HttpStatus.OK,
    customCode: string = 'SUCCESS',
  ): APIResponse<T> {
    return {
      msg: [message],
      custom_code: customCode,
      error: false,
      status: statusCode,
      data,
    };
  }

  static error(
    message: string,
    statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
    customCode: string = 'ERROR',
    errorDetails?: string,
  ): APIResponse<null> {
    return {
      msg: [message],
      custom_code: customCode,
      error: true,
      status: statusCode,
      data: null,
      errorDetails,
    };
  }

  static unauthorized(
    message: string = 'Unauthorized',
    customCode: string = 'UNAUTHORIZED',
  ): APIResponse<null> {
    return {
      msg: [message],
      custom_code: customCode,
      error: true,
      status: HttpStatus.UNAUTHORIZED,
      data: null,
    };
  }

  static forbidden(
    message: string = 'Access denied',
    customCode: string = 'FORBIDDEN',
  ): APIResponse<null> {
    return {
      msg: [message],
      custom_code: customCode,
      error: true,
      status: HttpStatus.FORBIDDEN,
      data: null,
    };
  }

  static notFound(
    message: string = 'Resource not found',
    customCode: string = 'NOT_FOUND',
  ): APIResponse<null> {
    return {
      msg: [message],
      custom_code: customCode,
      error: true,
      status: HttpStatus.NOT_FOUND,
      data: null,
    };
  }

  static badRequest(
    message: string = 'Bad request',
    customCode: string = 'BAD_REQUEST',
  ): APIResponse<null> {
    return {
      msg: [message],
      custom_code: customCode,
      error: true,
      status: HttpStatus.BAD_REQUEST,
      data: null,
    };
  }

  static unprocessableEntity(
    message: string = 'Invalid input data',
    customCode: string = 'VALIDATION_ERROR',
  ): APIResponse<null> {
    return {
      msg: [message],
      custom_code: customCode,
      error: true,
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      data: null,
    };
  }

  static paginated<T>(
    rows: T[],
    count: number,
    message: string = 'Data fetched successfully',
    statusCode: number = HttpStatus.OK,
    customCode: string = 'FETCH_SUCCESS',
  ): PaginatedAPIResponse<T> {
    return {
      msg: [message],
      custom_code: customCode,
      error: false,
      status: statusCode,
      data: {
        rows,
        count,
      },
    };
  }
}
