import type { ApiDateTime, ApiId } from "./api.types";

export interface Employee{

    id: ApiId;
    name: string;
    cpf: string;
    email: string;
    phone: string;
    roleName: string;
    status: boolean;
    createdAt: ApiDateTime;
    updatedAt: ApiDateTime;
}
export interface EmployeeRequest{

    name: string;
    cpf: string;
    email: string;
    password: string;
    roleName: string;
    phone: string;
    status: boolean;
}
