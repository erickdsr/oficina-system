import type { ApiDateTime, ApiId } from "./api.types";

export interface Supplier{

    id: ApiId;
    name: string;
    legalName?: string | null;
    tradeName?: string | null;
    cnpj: string;
    stateRegistration?: string | null;
    contactName?: string | null;
    email?: string | null;
    phone: string;
    address?: string | null;
    zipCode?: string | null;
    street?: string | null;
    number?: string | null;
    district?: string | null;
    complement?: string | null;
    city: string;
    state: string;
    status: boolean;
    createdAt: ApiDateTime;
    updatedAt: ApiDateTime;
}
export interface SupplierRequest{

    name: string;
    legalName: string;
    tradeName: string;
    cnpj: string;
    stateRegistration: string;
    contactName: string;
    email: string;
    phone: string;
    address: string;
    zipCode: string;
    street: string;
    number: string;
    district: string;
    complement: string;
    city: string;
    state: string;
    status: boolean;
}
