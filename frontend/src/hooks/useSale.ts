import { useCallback, useState } from "react";
import { toast } from "sonner";
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
            toast.error(message);
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
            toast.error(message);
            throw loadError;
        } finally {
            setLoading(false);
        }
    }, []);

    const createSale = useCallback(async (data: SaleRequest) => {
        const sale = await saleService.create(data);
        toast.success("Venda criada com sucesso.");
        return sale;
    }, []);
    const finalizeSale = useCallback(async (id: ApiId) => {
        const sale = await saleService.finalize(id);
        toast.success("Venda finalizada com sucesso.");
        return sale;
    }, []);
    const cancelSale = useCallback(async (id: ApiId) => {
        const sale = await saleService.cancel(id);
        toast.success("Venda cancelada com sucesso.");
        return sale;
    }, []);

    return {
        sales,
        sale,
        setSale,
        loading,
        error,
        setError,
        fetchAll: loadSales,
        getById: loadSale,
        create: createSale,
        finalize: finalizeSale,
        cancel: cancelSale,
        loadSales,
        loadSale,
        createSale,
        finalizeSale,
        cancelSale,
    };
}

export default useSale;
