import type { ApiDateTime, ApiId, Decimal, Nullable } from "./api.types";

export interface SaleResponse{

    id: ApiId;
    clientId: Nullable<ApiId>;
    clientName: Nullable<string>;
    employeeId: Nullable<ApiId>;
    employeeName: Nullable<string>;
    total: Decimal;
    discount: Decimal;
    status: SaleStatus;
    notes: Nullable<string>;
    createdAt: ApiDateTime;
    updatedAt: ApiDateTime;
    items: SaleItem[];
    payments: SalePayment[];
}

export interface SaleRequest{

    clientId: ApiId;
    employeeId: ApiId;
    discount: Decimal;
    notes: Nullable<string>;
    items: SaleItem[];
    payments: SalePayment[];
}

export interface SaleItem{

    productId: Nullable<ApiId>;
    quantity: number;
    unitPrice: Decimal;
    discount: Decimal;
    subtotal: Decimal;
}

export interface SalePayment{

    paymentMethodId: ApiId;
    amount: Decimal;
}

export type SaleStatus =
    | "PENDENTE"
    | "FINALIZADA"
    | "CANCELADA";
