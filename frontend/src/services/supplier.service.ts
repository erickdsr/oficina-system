import api from "./api";
import type { ApiId, DeletionReport, DeletionResult } from "../types/api.types";
import type { Supplier, SupplierRequest } from "../types/supplier.types";

const RESOURCE = "/suppliers";

export const supplierService = {
    async list(includeInactive = false) {
        const { data } = await api.get<Supplier[]>(RESOURCE, { params: { includeInactive } });
        return data;
    },

    async getById(id: ApiId) {
        const { data } = await api.get<Supplier>(`${RESOURCE}/${id}`);
        return data;
    },

    async create(supplier: SupplierRequest) {
        const { data } = await api.post<Supplier>(RESOURCE, supplier);
        return data;
    },

    async update(id: ApiId, supplier: SupplierRequest) {
        const { data } = await api.put<Supplier>(`${RESOURCE}/${id}`, supplier);
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

export default supplierService;
