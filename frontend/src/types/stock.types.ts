import type { ApiDateTime, ApiId, Nullable } from "./api.types";

export interface StockResponse{

    id: ApiId;
    productId: Nullable<ApiId>;
    quantity: number;
    minQuantity: number;
    location: string;
    updatedAt: ApiDateTime;
}

export interface StockRequest{

    productId: ApiId;
    quantity: number;
    minQuantity: number;
    location: string;
}

export interface StockMovementDTO{

    product: Nullable<ApiId>;
    employee: Nullable<ApiId>;
    type: StockMovementType;
    reason: string;
    quantity: number;
}

export type StockMovementType =
    | "ENTRADA"
    | "SAIDA"
    | "AJUSTE";
