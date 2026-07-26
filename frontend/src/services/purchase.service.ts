import api from "./api";
import type { ApiId } from "../types/api.types";
import type { PurchaseDeletionResponse, PurchaseRequest, PurchaseResponse } from "../types/purchase.types";

const RESOURCE = "/purchases";

export const purchaseService = {
    async list(includeInactive = false) {
        const { data } = await api.get<PurchaseResponse[]>(RESOURCE, { params: { includeInactive } });
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
        const { data } = await api.patch<PurchaseResponse>(`${RESOURCE}/confirm/${id}`);
        return data;
    },

    async cancel(id: ApiId) {
        const { data } = await api.patch<PurchaseResponse>(`${RESOURCE}/cancel/${id}`);
        return data;
    },

    async remove(id: ApiId) {
        const { data } = await api.delete<PurchaseDeletionResponse>(`${RESOURCE}/${id}`);
        return data;
    },
};

export default purchaseService;
