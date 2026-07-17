import { useCallback, useState } from "react";
import { toast } from "sonner";
import { getApiErrorMessage } from "../services/api";
import supplierService from "../services/supplier.service";
import type { ApiId } from "../types/api.types";
import type { Supplier, SupplierRequest } from "../types/supplier.types";

export function useSupplier() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await supplierService.list();
            setSuppliers(data);
            return data;
        } catch (loadError) {
            const message = getApiErrorMessage(loadError, "Nao foi possivel carregar fornecedores.");
            setError(message);
            toast.error(message);
            throw loadError;
        } finally {
            setLoading(false);
        }
    }, []);

    const create = useCallback(async (data: SupplierRequest) => {
        const supplier = await supplierService.create(data);
        toast.success("Fornecedor criado com sucesso.");
        return supplier;
    }, []);
    const update = useCallback(async (id: ApiId, data: SupplierRequest) => {
        const supplier = await supplierService.update(id, data);
        toast.success("Fornecedor atualizado com sucesso.");
        return supplier;
    }, []);
    const remove = useCallback(async (id: ApiId) => {
        await supplierService.remove(id);
        toast.success("Fornecedor removido com sucesso.");
    }, []);

    return { suppliers, loading, error, setError, fetchAll, create, update, remove };
}

export default useSupplier;
