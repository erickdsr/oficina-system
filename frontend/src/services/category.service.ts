import api from "./api";
import type { ApiId, DeletionReport, DeletionResult } from "../types/api.types";
import type { Category, CategoryRequest } from "../types/category.types";

const RESOURCE = "/categories";

export const categoryService = {
    async list(includeInactive = false) {
        const { data } = await api.get<Category[]>(RESOURCE, { params: { includeInactive } });
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

    async delete(id: ApiId) {
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

    async remove(id: ApiId) {
        await this.delete(id);
    },
};

export default categoryService;
