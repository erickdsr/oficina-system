import api from "./api";
import type { ApiId } from "../types/api.types";
import type { Employee, EmployeeRequest } from "../types/employee.types";

const RESOURCE = "/employees";

export const employeeService = {
    async list() {
        const { data } = await api.get<Employee[]>(RESOURCE);
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
        await api.delete<void>(`${RESOURCE}/${id}`);
    },
};

export default employeeService;
