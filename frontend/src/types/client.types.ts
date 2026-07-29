import type { ApiDateTime, ApiId } from "./api.types";

export interface ClientListItem{

    id: ApiId;
    name: string;
    cpfCnpj: string;
    clientType: string;
    email: string;
    phone: string;
    city: string;
    state: string;
    status: boolean;
    createdAt: ApiDateTime;
    updatedAt: ApiDateTime;
}

export interface Client extends ClientListItem{
    secondaryPhone?: string | null;
    address?: string | null;
    zipCode?: string | null;
    street?: string | null;
    number?: string | null;
    complement?: string | null;
    district?: string | null;
    notes?: string | null;
}

export interface ClientRequest{

    name: string;
    cpfCnpj: string;
    email: string;
    clientType: string;
    phone: string;
    secondaryPhone?: string;
    address?: string;
    zipCode?: string;
    street?: string;
    number?: string;
    complement?: string;
    district?: string;
    city: string;
    state: string;
    notes?: string;
    status: boolean;
}

export interface ClientSummary {
    activeCount: number;
    inactiveCount: number;
    totalCount: number;
}
