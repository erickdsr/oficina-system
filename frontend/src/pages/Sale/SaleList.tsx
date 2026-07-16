import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "../../components/common/EmptyState";
import LoadingState from "../../components/common/LoadingState";
import PageHeader from "../../components/common/PageHeader";
import SearchInput from "../../components/common/SearchInput";
import { useAuth } from "../../context/auth.context";
import useSale from "../../hooks/useSale";
import { formatCurrency, formatDateTime } from "../../utils/formatters";
import { canManage } from "../../utils/permissions";

export function SaleList() {
    const { user } = useAuth();
    const { sales, loading, error, loadSales } = useSale();
    const [search, setSearch] = useState("");

    useEffect(() => {
        void loadSales().catch(() => undefined);
    }, [loadSales]);

    const filteredSales = useMemo(() => {
        const term = search.toLowerCase();
        return sales.filter((sale) => [sale.clientName ?? "", sale.employeeName ?? "", sale.status].some((value) => value.toLowerCase().includes(term)));
    }, [sales, search]);

    return (
        <section className="page-section">
            <PageHeader
                eyebrow="Vendas"
                title="Vendas"
                description="Historico de vendas e status."
                action={canManage(user?.role, ["admin", "gerente", "vendedor"]) && <Link className="primary-button link-button" to="/sales/new">Nova venda</Link>}
            />
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar venda..." />
            {error && <div className="form-error">{error}</div>}
            {loading ? <LoadingState /> : filteredSales.length === 0 ? <EmptyState /> : (
                <div className="table-wrap">
                    <table className="data-table">
                        <thead><tr><th>ID</th><th>Cliente</th><th>Status</th><th>Total</th><th>Criada em</th><th>Acoes</th></tr></thead>
                        <tbody>
                            {filteredSales.map((sale) => (
                                <tr key={sale.id}>
                                    <td>#{sale.id}</td>
                                    <td>{sale.clientName ?? "-"}</td>
                                    <td>{sale.status}</td>
                                    <td>{formatCurrency(sale.total)}</td>
                                    <td>{formatDateTime(sale.createdAt)}</td>
                                    <td className="table-actions"><Link className="secondary-button link-button" to={`/sales/${sale.id}`}>Detalhes</Link></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}

export default SaleList;
