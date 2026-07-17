import api from "./api";
import type { ApiId } from "../types/api.types";
import type { SaleRequest, SaleResponse } from "../types/sale.types";

const RESOURCE = "/sales";

export const saleService = {
    async list() {
        const { data } = await api.get<SaleResponse[]>(RESOURCE);
        return data;
    },

    async getById(id: ApiId) {
        const { data } = await api.get<SaleResponse>(`${RESOURCE}/${id}`);
        return data;
    },

    async create(sale: SaleRequest) {
        const { data } = await api.post<SaleResponse>(RESOURCE, sale);
        return data;
    },

    async finalize(id: ApiId) {
        const { data } = await api.patch<SaleResponse>(`${RESOURCE}/${id}/finalize`);
        return data;
    },

    async cancel(id: ApiId) {
        const { data } = await api.patch<SaleResponse>(`${RESOURCE}/${id}/cancel`);
        return data;
    },
};

export default saleService;
