import api from "./api";
import type { ApiId } from "../types/api.types";
import type { Category, CategoryRequest } from "../types/category.types";

const RESOURCE = "/categories";

export const categoryService = {
    async list() {
        const { data } = await api.get<Category[]>(RESOURCE);
        return data;
    },

    async getById(id: ApiId) {
        const { data } = await api.get<Category>(`${RESOURCE}/${id}`);
        return data;
    },

    async create(category: CategoryRequest) {
        const { data } = await api.post<Category>(RESOURCE, category);
        return data;
    },

    async update(id: ApiId, category: CategoryRequest) {
        const { data } = await api.put<Category>(`${RESOURCE}/${id}`, category);
        return data;
    },

    async remove(id: ApiId) {
        await api.delete<void>(`${RESOURCE}/${id}`);
    },
};

export default categoryService;
