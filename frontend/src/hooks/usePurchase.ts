import { useCallback, useState } from "react";
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
            throw loadError;
        } finally {
            setLoading(false);
        }
    }, []);

    const createPurchase = useCallback((data: PurchaseRequest) => purchaseService.create(data), []);
    const confirmPurchase = useCallback((id: ApiId) => purchaseService.confirm(id), []);
    const cancelPurchase = useCallback((id: ApiId) => purchaseService.cancel(id), []);

    return { purchases, purchase, setPurchase, loading, error, setError, loadPurchases, loadPurchase, createPurchase, confirmPurchase, cancelPurchase };
}

export default usePurchase;
