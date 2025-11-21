// نماذج مشتركة للـ API Responses

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ApiError[];
  meta?: ResponseMeta;
}

export interface ApiError {
  field?: string;
  code: string;
  message: string;
}

export interface ResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  timestamp?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  token: boolean;
  user: any;
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationMeta extends ResponseMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// نماذج للطلبات المشتركة
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface SearchParams extends PaginationParams {
  query?: string;
  filters?: Record<string, any>;
}
