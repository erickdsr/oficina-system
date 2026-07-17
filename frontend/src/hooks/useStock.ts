import { useCallback, useState } from "react";
import { toast } from "sonner";
import { getApiErrorMessage } from "../services/api";
import stockService from "../services/stock.service";
import type { ApiId } from "../types/api.types";
import type { StockMovementDTO, StockRequest, StockResponse } from "../types/stock.types";

export function useStock() {
    const [stocks, setStocks] = useState<StockResponse[]>([]);
    const [lowStock, setLowStock] = useState<StockResponse[]>([]);
    const [movements, setMovements] = useState<StockMovementDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadStock = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [stockData, lowStockData] = await Promise.all([stockService.list(), stockService.listLowStock()]);
            setStocks(stockData);
            setLowStock(lowStockData);
            return { stocks: stockData, lowStock: lowStockData };
        } catch (loadError) {
            const message = getApiErrorMessage(loadError, "Nao foi possivel carregar estoque.");
            setError(message);
            toast.error(message);
            throw loadError;
        } finally {
            setLoading(false);
        }
    }, []);

    const loadMovements = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await stockService.listMovements();
            setMovements(data);
            return data;
        } catch (loadError) {
            const message = getApiErrorMessage(loadError, "Nao foi possivel carregar movimentacoes.");
            setError(message);
            toast.error(message);
            throw loadError;
        } finally {
            setLoading(false);
        }
    }, []);

    const createStock = useCallback(async (stock: StockRequest) => {
        const data = await stockService.create(stock);
        toast.success("Estoque criado com sucesso.");
        return data;
    }, []);
    const updateStock = useCallback(async (id: ApiId, stock: StockRequest) => {
        const data = await stockService.update(id, stock);
        toast.success("Estoque ajustado com sucesso.");
        return data;
    }, []);

    return {
        stocks,
        lowStock,
        movements,
        loading,
        error,
        setError,
        fetchAll: loadStock,
        fetchLow: loadStock,
        fetchMovements: loadMovements,
        adjust: updateStock,
        loadStock,
        loadMovements,
        createStock,
        updateStock,
    };
}

export default useStock;
