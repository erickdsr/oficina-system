import { useCallback, useState } from "react";
import { toast } from "sonner";
import { getApiErrorMessage } from "../services/api";
import purchaseService from "../services/purchase.service";
import type { ApiId } from "../types/api.types";
import type { PurchaseRequest, PurchaseResponse } from "../types/purchase.types";

export function usePurchase() {
    const [purchases, setPurchases] = useState<PurchaseResponse[]>([]);
    const [purchase, setPurchase] = useState<PurchaseResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadPurchases = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await purchaseService.list();
            setPurchases(data);
            return data;
        } catch (loadError) {
            const message = getApiErrorMessage(loadError, "Nao foi possivel carregar compras.");
            setError(message);
            toast.error(message);
            throw loadError;
        } finally {
            setLoading(false);
        }
    }, []);

    const loadPurchase = useCallback(async (id: ApiId) => {
        setLoading(true);
        setError(null);
        try {
            const data = await purchaseService.getById(id);
            setPurchase(data);
            return data;
        } catch (loadError) {
            const message = getApiErrorMessage(loadError, "Nao foi possivel carregar a compra.");
            setError(message);
            toast.error(message);
            throw loadError;
        } finally {
            setLoading(false);
        }
    }, []);

    const createPurchase = useCallback(async (data: PurchaseRequest) => {
        const purchase = await purchaseService.create(data);
        toast.success("Compra criada com sucesso.");
        return purchase;
    }, []);
    const confirmPurchase = useCallback(async (id: ApiId) => {
        const purchase = await purchaseService.confirm(id);
        toast.success("Compra confirmada com sucesso.");
        return purchase;
    }, []);
    const cancelPurchase = useCallback(async (id: ApiId) => {
        const purchase = await purchaseService.cancel(id);
        toast.success("Compra cancelada com sucesso.");
        return purchase;
    }, []);

    return {
        purchases,
        purchase,
        setPurchase,
        loading,
        error,
        setError,
        fetchAll: loadPurchases,
        getById: loadPurchase,
        create: createPurchase,
        confirm: confirmPurchase,
        cancel: cancelPurchase,
        loadPurchases,
        loadPurchase,
        createPurchase,
        confirmPurchase,
        cancelPurchase,
    };
}

export default usePurchase;
