export interface APIResponse<T> {
  msg: string[];
  custom_code: string | null;
  error: boolean;
  status: number;
  data: T | null;
  errorDetails?: string;
}

export type PaginatedAPIResponse<T> = APIResponse<{
  rows: T[];
  count: number;
}>;
