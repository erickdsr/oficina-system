import api from "./api";
import type { ApiId } from "../types/api.types";
import type { Supplier, SupplierRequest } from "../types/supplier.types";

const RESOURCE = "/suppliers";

export const supplierService = {
    async list() {
        const { data } = await api.get<Supplier[]>(RESOURCE);
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
        await api.delete<void>(`${RESOURCE}/${id}`);
    },
};

export default supplierService;
