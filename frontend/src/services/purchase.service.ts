import api from "./api";
import type { ApiId } from "../types/api.types";
import type { PurchaseRequest, PurchaseResponse } from "../types/purchase.types";

const RESOURCE = "/purchases";

export const purchaseService = {
    async list() {
        const { data } = await api.get<PurchaseResponse[]>(RESOURCE);
        return data;
    },

    async getById(id: ApiId) {
        const { data } = await api.get<PurchaseResponse>(`${RESOURCE}/${id}`);
        return data;
    },

    async create(purchase: PurchaseRequest) {
        const { data } = await api.post<PurchaseResponse>(RESOURCE, purchase);
        return data;
    },

    async confirm(id: ApiId) {
        const { data } = await api.patch<PurchaseResponse>(`${RESOURCE}/${id}/confirm`);
        return data;
    },

    async cancel(id: ApiId) {
        const { data } = await api.patch<PurchaseResponse>(`${RESOURCE}/${id}/cancel`);
        return data;
    },
};

export default purchaseService;
