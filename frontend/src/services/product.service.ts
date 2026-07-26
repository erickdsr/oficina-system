import api from "./api";
import type { ApiId, DeletionReport, DeletionResult } from "../types/api.types";
import type { ProductRequest, ProductResponse } from "../types/product.types";

const RESOURCE = "/products";

export const productService = {
    async list(includeInactive = false) {
        const { data } = await api.get<ProductResponse[]>(RESOURCE, { params: { includeInactive } });
        return data;
    },

    async getById(id: ApiId) {
        const { data } = await api.get<ProductResponse>(`${RESOURCE}/${id}`);
        return data;
    },

    async create(product: ProductRequest) {
        const { data } = await api.post<ProductResponse>(RESOURCE, product);
        return data;
    },

    async update(id: ApiId, product: ProductRequest) {
        const { data } = await api.put<ProductResponse>(`${RESOURCE}/${id}`, product);
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

export default productService;
