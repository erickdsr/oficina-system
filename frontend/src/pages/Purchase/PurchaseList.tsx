import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "../../components/common/EmptyState";
import LoadingState from "../../components/common/LoadingState";
import PageHeader from "../../components/common/PageHeader";
import SearchInput from "../../components/common/SearchInput";
import StatusBadge from "../../components/common/StatusBadge";
import { useAuth } from "../../context/auth.context";
import usePurchase from "../../hooks/usePurchase";
import { formatCurrency, formatDateTime } from "../../utils/formatters";
import { canManage } from "../../utils/permissions";

export function PurchaseList() {
    const { user } = useAuth();
    const { purchases, loading, error, loadPurchases } = usePurchase();
    const [search, setSearch] = useState("");

    useEffect(() => {
        void loadPurchases().catch(() => undefined);
    }, [loadPurchases]);

    const filteredPurchases = useMemo(() => {
        const term = search.toLowerCase();
        return purchases.filter((purchase) =>
            [purchase.supplierName ?? "", purchase.employeeName ?? "", purchase.status].some((value) => value.toLowerCase().includes(term)),
        );
    }, [purchases, search]);

    return (
        <section className="page-section">
            <PageHeader
                eyebrow="Compras"
                title="Compras"
                description="Pedidos de compra e recebimento."
                action={canManage(user?.role, ["admin", "gerente", "estoquista"]) && <Link className="primary-button link-button" to="/purchases/new">Nova compra</Link>}
            />
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar compra..." />
            {error && <div className="form-error">{error}</div>}
            {loading ? <LoadingState /> : filteredPurchases.length === 0 ? <EmptyState /> : (
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Fornecedor</th>
                                <th>Status</th>
                                <th>Total</th>
                                <th>Criada em</th>
                                <th>Acoes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPurchases.map((purchase) => (
                                <tr key={purchase.id}>
                                    <td>#{purchase.id}</td>
                                    <td>{purchase.supplierName ?? "-"}</td>
                                    <td><StatusBadge label={purchase.status} /></td>
                                    <td>{formatCurrency(purchase.total)}</td>
                                    <td>{formatDateTime(purchase.createdAt)}</td>
                                    <td className="table-actions"><Link className="secondary-button link-button" to={`/purchases/${purchase.id}`}>Detalhes</Link></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}

export default PurchaseList;
