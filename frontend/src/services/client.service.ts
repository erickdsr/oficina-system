import api from "./api";
import type { ApiId } from "../types/api.types";
import type { Client, ClientRequest } from "../types/client.types";

const RESOURCE = "/clients";

export const clientService = {
    async list() {
        const { data } = await api.get<Client[]>(RESOURCE);
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
        await api.delete<void>(`${RESOURCE}/${id}`);
    },
};

export default clientService;
