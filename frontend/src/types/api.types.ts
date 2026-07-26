export type ApiId = number;

export type ApiDateTime = string;

export type Decimal = number;

export type Nullable<T> = T | null;

export interface ApiError {
    timestamp?: ApiDateTime;
    status?: number;
    code?: string;
    error?: string;
    message?: string;
    path?: string;
    details?: Record<string, unknown>;
}

export type DeletionMode = "PHYSICAL_DELETE" | "SOFT_DELETE" | "FORCE_DELETE";

export interface DeletionReport {
    entity: string;
    id: ApiId;
    hasDependencies: boolean;
    physicalDeletionAllowed: boolean;
    dependencies: Record<string, number>;
}

export interface DeletionResult {
    entity: string;
    id: ApiId;
    mode: DeletionMode;
    message: string;
    detail: string;
    report: DeletionReport;
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
