import { ApiResponse } from './api-response.type';

export type PaginatedAPIResponse<T> = ApiResponse<{
  rows: T[];
  count: number;
}>;
