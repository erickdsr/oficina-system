import { useEffect, useMemo, useState } from "react";
import EmptyState from "../../components/common/EmptyState";
import LoadingState from "../../components/common/LoadingState";
import PageHeader from "../../components/common/PageHeader";
import SearchInput from "../../components/common/SearchInput";
import StatusBadge from "../../components/common/StatusBadge";
import { getApiErrorMessage } from "../../services/api";
import useStock from "../../hooks/useStock";
import productService from "../../services/product.service";
import type { ProductResponse } from "../../types/product.types";

export function StockMovements() {
    const { movements, loading, error, setError, loadMovements } = useStock();
    const [products, setProducts] = useState<ProductResponse[]>([]);
    const [search, setSearch] = useState("");

    useEffect(() => {
        async function loadData() {
            setError(null);
            try {
                const productData = await productService.list();
                await loadMovements();
                setProducts(productData);
            } catch (loadError) {
                setError(getApiErrorMessage(loadError, "Nao foi possivel carregar movimentacoes."));
            }
        }

        void loadData().catch(() => undefined);
    }, [loadMovements, setError]);

    const productNameById = useMemo(() => new Map(products.map((product) => [product.id, product.name])), [products]);
    const filteredMovements = useMemo(() => {
        const term = search.toLowerCase();
        return movements.filter((movement) =>
            [movement.type, movement.reason, productNameById.get(movement.product ?? 0) ?? ""].some((value) => value.toLowerCase().includes(term)),
        );
    }, [movements, productNameById, search]);

    return (
        <section className="page-section">
            <PageHeader eyebrow="Estoque" title="Movimentacoes" description="Historico de entradas, saidas e ajustes." />
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar movimentacao..." />
            {error && <div className="form-error">{error}</div>}
            {loading ? <LoadingState /> : filteredMovements.length === 0 ? <EmptyState /> : (
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Produto</th>
                                <th>Tipo</th>
                                <th>Quantidade</th>
                                <th>Motivo</th>
                                <th>Funcionario</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMovements.map((movement, index) => (
                                <tr key={`${movement.product}-${movement.type}-${index}`}>
                                    <td>{productNameById.get(movement.product ?? 0) ?? `Produto #${movement.product ?? "-"}`}</td>
                                    <td><StatusBadge label={movement.type} /></td>
                                    <td>{movement.quantity}</td>
                                    <td>{movement.reason}</td>
                                    <td>{movement.employee ?? "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}

export default StockMovements;
