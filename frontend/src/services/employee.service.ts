import api from "./api";
import type { ApiId, DeletionReport, DeletionResult } from "../types/api.types";
import type { Employee, EmployeeRequest } from "../types/employee.types";

const RESOURCE = "/employees";

export const employeeService = {
    async list(includeInactive = false) {
        const { data } = await api.get<Employee[]>(RESOURCE, { params: { includeInactive } });
        return data;
    },

    async getById(id: ApiId) {
        const { data } = await api.get<Employee>(`${RESOURCE}/${id}`);
        return data;
    },

    async create(employee: EmployeeRequest) {
        const { data } = await api.post<Employee>(RESOURCE, employee);
        return data;
    },

    async update(id: ApiId, employee: EmployeeRequest) {
        const { data } = await api.put<Employee>(`${RESOURCE}/${id}`, employee);
        return data;
    },

    async remove(id: ApiId) {
        const { data } = await api.delete<DeletionResult>(`${RESOURCE}/${id}`);
        return data;
    },

    async forceDelete(id: ApiId) {
        const { data } = await api.delete<DeletionResult>(`${RESOURCE}/${id}/force`);
        return data;
    },

    async getDeletionReport(id: ApiId) {
        const { data } = await api.get<DeletionReport>(`${RESOURCE}/${id}/deletion-report`);
        return data;
    },
};

export default employeeService;
