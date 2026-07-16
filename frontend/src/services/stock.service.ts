import api from "./api";
import type { ApiId } from "../types/api.types";
import type { StockMovementDTO, StockRequest, StockResponse } from "../types/stock.types";

const RESOURCE = "/stock";

export const stockService = {
    async list() {
        const { data } = await api.get<StockResponse[]>(RESOURCE);
        return data;
    },

    async getById(id: ApiId) {
        const { data } = await api.get<StockResponse>(`${RESOURCE}/${id}`);
        return data;
    },

    async listLowStock() {
        const { data } = await api.get<StockResponse[]>(`${RESOURCE}/low`);
        return data;
    },

    async create(stock: StockRequest) {
        const { data } = await api.post<StockResponse>(RESOURCE, stock);
        return data;
    },

    async update(id: ApiId, stock: StockRequest) {
        const { data } = await api.patch<StockResponse>(`${RESOURCE}/${id}`, stock);
        return data;
    },

    async listMovements() {
        const { data } = await api.get<StockMovementDTO[]>(`${RESOURCE}/movements`);
        return data;
    },

    async listMovementsByProduct(productId: ApiId) {
        const { data } = await api.get<StockMovementDTO[]>(`${RESOURCE}/movements/${productId}`);
        return data;
    },
};

export default stockService;
