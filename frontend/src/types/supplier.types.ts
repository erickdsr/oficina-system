import type { ApiDateTime, ApiId } from "./api.types";

export interface Supplier{

    id: ApiId;
    name: string;
    cnpj: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    status: boolean;
    createdAt: ApiDateTime;
    updatedAt: ApiDateTime;
}
export interface SupplierRequest{

    name: string;
    cnpj: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    status: boolean;
}
