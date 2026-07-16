import type { ApiDateTime, ApiId, Decimal, Nullable } from "./api.types";

export interface PurchaseResponse{
    
    id: ApiId;
    supplierId: Nullable<ApiId>;
    supplierName: Nullable<string>;
    employeeId: Nullable<ApiId>;
    employeeName: Nullable<string>;
    total: Decimal;
    status: PurchaseStatus;
    notes: Nullable<string>;
    createdAt: ApiDateTime;
    updatedAt: ApiDateTime;
    items: PurchaseItem[];
}

export interface PurchaseRequest{

    supplierId: ApiId;
    employeeId: ApiId;
    notes: Nullable<string>;
    items: PurchaseItem[];
}

export interface PurchaseItem{

    productId: Nullable<ApiId>;
    quantity: number;
    unitCost: Decimal;
    subtotal: Nullable<Decimal>;
}

export type PurchaseStatus =
    | "PENDENTE"
    | "RECEBIDA"
    | "CANCELADA";
