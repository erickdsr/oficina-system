import api from "./api";
import type { ApiId, DeletionReport, DeletionResult } from "../types/api.types";
import type { Client, ClientRequest } from "../types/client.types";

const RESOURCE = "/clients";

export const clientService = {
    async list(includeInactive = false) {
        const { data } = await api.get<Client[]>(RESOURCE, { params: { includeInactive } });
        return data;
    },

    async getById(id: ApiId) {
        const { data } = await api.get<Client>(`${RESOURCE}/${id}`);
        return data;
    },

    async create(client: ClientRequest) {
        const { data } = await api.post<Client>(RESOURCE, client);
        return data;
    },

    async update(id: ApiId, client: ClientRequest) {
        const { data } = await api.put<Client>(`${RESOURCE}/${id}`, client);
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

export default clientService;
