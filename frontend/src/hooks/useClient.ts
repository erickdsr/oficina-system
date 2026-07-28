import { useCallback, useState } from "react";
import { toast } from "sonner";
import { getApiErrorMessage } from "../services/api";
import clientService from "../services/client.service";
import type { ApiId } from "../types/api.types";
import type { Client, ClientRequest } from "../types/client.types";

export function useClient() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAll = useCallback(async (includeInactive = false) => {
        setLoading(true);
        setError(null);
        try {
            const data = await clientService.list(includeInactive);
            setClients(data);
            return data;
        } catch (loadError) {
            const message = getApiErrorMessage(loadError, "Nao foi possivel carregar clientes.");
            setError(message);
            toast.error(message);
            throw loadError;
        } finally {
            setLoading(false);
        }
    }, []);

    const create = useCallback(async (data: ClientRequest) => {
        const client = await clientService.create(data);
        toast.success("Cliente cadastrado com sucesso");
        return client;
    }, []);
    const update = useCallback(async (id: ApiId, data: ClientRequest) => {
        const client = await clientService.update(id, data);
        toast.success("Cliente atualizado com sucesso.");
        return client;
    }, []);
    const remove = useCallback(async (id: ApiId) => {
        const result = await clientService.remove(id);
        toast.success(result.message);
        return result;
    }, []);
    const forceDelete = useCallback(async (id: ApiId) => {
        const result = await clientService.forceDelete(id);
        toast.success(result.message);
        return result;
    }, []);

    return { clients, loading, error, setError, fetchAll, create, update, remove, forceDelete };
}

export default useClient;
