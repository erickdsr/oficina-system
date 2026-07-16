import { useCallback, useState } from "react";
import { getApiErrorMessage } from "../services/api";
import saleService from "../services/sale.service";
import type { ApiId } from "../types/api.types";
import type { SaleRequest, SaleResponse } from "../types/sale.types";

export function useSale() {
    const [sales, setSales] = useState<SaleResponse[]>([]);
    const [sale, setSale] = useState<SaleResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadSales = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await saleService.list();
            setSales(data);
            return data;
        } catch (loadError) {
            const message = getApiErrorMessage(loadError, "Nao foi possivel carregar vendas.");
            setError(message);
            throw loadError;
        } finally {
            setLoading(false);
        }
    }, []);

    const loadSale = useCallback(async (id: ApiId) => {
        setLoading(true);
        setError(null);
        try {
            const data = await saleService.getById(id);
            setSale(data);
            return data;
        } catch (loadError) {
            const message = getApiErrorMessage(loadError, "Nao foi possivel carregar a venda.");
            setError(message);
            throw loadError;
        } finally {
            setLoading(false);
        }
    }, []);

    const createSale = useCallback((data: SaleRequest) => saleService.create(data), []);
    const finalizeSale = useCallback((id: ApiId) => saleService.finalize(id), []);
    const cancelSale = useCallback((id: ApiId) => saleService.cancel(id), []);

    return { sales, sale, setSale, loading, error, setError, loadSales, loadSale, createSale, finalizeSale, cancelSale };
}

export default useSale;
