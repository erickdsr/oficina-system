import type { ApiDateTime, ApiId, Decimal, Nullable } from "./api.types";

export interface ProductResponse {
    
    id: ApiId;
    name: string;
    description: string;
    partNumber: string;
    barCode: string;
    categoryId: ApiId;
    categoryName: string;
    supplierId: Nullable<ApiId>;
    supplierName: Nullable<string>;
    costPrice: Decimal;
    salePrice: Decimal;
    unit: Unit;
    status: boolean;
    createdAt: ApiDateTime;
    updatedAt: ApiDateTime;
}

export interface ProductRequest{

    name: string;
    description: string;
    partNumber: string;
    barCode: string;
    categoryId: ApiId;
    supplierId: Nullable<ApiId>;
    costPrice: Decimal;
    salePrice: Decimal;
    unit: Unit;
    status: boolean;
}

export type Unit =
    | "UN"
    | "CX"
    | "KT";
