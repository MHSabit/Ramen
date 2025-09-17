export interface ApiResponse<T = any> {
  execStatus: boolean;
  httpStatus: number;
  msg: string;
  customCode: string | null;
  data?: T;
}
