export type ApiId = number;

export type ApiDateTime = string;

export type Decimal = number;

export type Nullable<T> = T | null;

export interface ApiError {
    timestamp?: ApiDateTime;
    status?: number;
    error?: string;
    message?: string;
    path?: string;
}

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
    empty: boolean;
}
