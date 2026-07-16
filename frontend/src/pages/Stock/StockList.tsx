import { useCallback, useEffect, useMemo, useState } from "react";
import EmptyState from "../../components/common/EmptyState";
import LoadingState from "../../components/common/LoadingState";
import PageHeader from "../../components/common/PageHeader";
import SearchInput from "../../components/common/SearchInput";
import { useAuth } from "../../context/auth.context";
import { getApiErrorMessage } from "../../services/api";
import useStock from "../../hooks/useStock";
import productService from "../../services/product.service";
import type { ProductResponse } from "../../types/product.types";
import type { StockRequest, StockResponse } from "../../types/stock.types";
import { formatDateTime } from "../../utils/formatters";
import { canManage } from "../../utils/permissions";
import StockAdjust from "./StockAdjust";

export function StockList() {
    const { user } = useAuth();
    const { stocks, lowStock, loading, error, setError, loadStock, createStock, updateStock } = useStock();
    const [products, setProducts] = useState<ProductResponse[]>([]);
    const [search, setSearch] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [editingStock, setEditingStock] = useState<StockResponse | null>(null);
    const [showForm, setShowForm] = useState(false);

    const loadData = useCallback(async () => {
        setError(null);
        try {
            const productData = await productService.list();
            await loadStock();
            setProducts(productData);
        } catch (loadError) {
            setError(getApiErrorMessage(loadError, "Nao foi possivel carregar estoque."));
        }
    }, [loadStock, setError]);

    useEffect(() => {
        void loadData().catch(() => undefined);
    }, [loadData]);

    const productNameById = useMemo(() => new Map(products.map((product) => [product.id, product.name])), [products]);
    const lowStockIds = useMemo(() => new Set(lowStock.map((stock) => stock.id)), [lowStock]);

    const filteredStocks = useMemo(() => {
        const term = search.toLowerCase();
        return stocks.filter((stock) => (productNameById.get(stock.productId ?? 0) ?? "").toLowerCase().includes(term));
    }, [productNameById, search, stocks]);

    async function handleSubmit(data: StockRequest, stockId?: number) {
        setSubmitting(true);
        setFormError(null);
        try {
            if (stockId) {
                await updateStock(stockId, data);
            } else {
                await createStock(data);
            }
            setShowForm(false);
            setEditingStock(null);
            await loadData();
        } catch (submitError) {
            setFormError(getApiErrorMessage(submitError, "Nao foi possivel salvar o estoque."));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <section className="page-section">
            <PageHeader
                eyebrow="Estoque"
                title="Estoque atual"
                description="Quantidade disponivel e alerta de baixo estoque."
                action={canManage(user?.role, ["admin", "gerente", "estoquista"]) && <button type="button" className="primary-button" onClick={() => setShowForm(true)}>Novo estoque</button>}
            />
            <div className="metric-row">
                <div className="metric-card"><span>Itens em estoque</span><strong>{stocks.length}</strong></div>
                <div className="metric-card warning"><span>Baixo estoque</span><strong>{lowStock.length}</strong></div>
            </div>
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar produto no estoque..." />
            {showForm && <StockAdjust stock={editingStock} products={products} loading={submitting} error={formError} onCancel={() => { setShowForm(false); setEditingStock(null); }} onSubmit={handleSubmit} />}
            {error && <div className="form-error">{error}</div>}
            {loading ? <LoadingState /> : filteredStocks.length === 0 ? <EmptyState /> : (
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Produto</th>
                                <th>Quantidade</th>
                                <th>Minimo</th>
                                <th>Local</th>
                                <th>Atualizado</th>
                                <th>Acoes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStocks.map((stock) => (
                                <tr key={stock.id} className={lowStockIds.has(stock.id) ? "row-warning" : undefined}>
                                    <td>{productNameById.get(stock.productId ?? 0) ?? `Produto #${stock.productId ?? "-"}`}</td>
                                    <td>{stock.quantity}</td>
                                    <td>{stock.minQuantity}</td>
                                    <td>{stock.location}</td>
                                    <td>{formatDateTime(stock.updatedAt)}</td>
                                    <td className="table-actions">
                                        {canManage(user?.role, ["admin", "gerente", "estoquista"]) && <button type="button" className="secondary-button" onClick={() => { setEditingStock(stock); setShowForm(true); }}>Ajustar</button>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}

export default StockList;
