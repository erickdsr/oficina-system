import api from "./api";
import type { ApiId } from "../types/api.types";
import type { ProductRequest, ProductResponse } from "../types/product.types";

const RESOURCE = "/products";

export const productService = {
    async list() {
        const { data } = await api.get<ProductResponse[]>(RESOURCE);
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
        await api.delete<void>(`${RESOURCE}/${id}`);
    },
};

export default productService;
