import { useCallback, useState } from "react";
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
            throw loadError;
        } finally {
            setLoading(false);
        }
    }, []);

    const createStock = useCallback((stock: StockRequest) => stockService.create(stock), []);
    const updateStock = useCallback((id: ApiId, stock: StockRequest) => stockService.update(id, stock), []);

    return { stocks, lowStock, movements, loading, error, setError, loadStock, loadMovements, createStock, updateStock };
}

export default useStock;
