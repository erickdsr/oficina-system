import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import LoadingState from "../../components/common/LoadingState";
import PageHeader from "../../components/common/PageHeader";
import { useAuth } from "../../context/auth.context";
import { getApiErrorMessage } from "../../services/api";
import useSale from "../../hooks/useSale";
import { formatCurrency, formatDateTime } from "../../utils/formatters";
import { canManage } from "../../utils/permissions";

export function SaleDetail() {
    const { user } = useAuth();
    const { id } = useParams();
    const { sale, setSale, loading, error, setError, loadSale, finalizeSale, cancelSale } = useSale();
    const [actionLoading, setActionLoading] = useState(false);

    const loadSaleDetail = useCallback(async () => {
        if (!id) {
            return;
        }
        try {
            await loadSale(Number(id));
        } catch (loadError) {
            setError(getApiErrorMessage(loadError, "Nao foi possivel carregar a venda."));
        }
    }, [id, loadSale, setError]);

    useEffect(() => {
        void loadSaleDetail().catch(() => undefined);
    }, [loadSaleDetail]);

    async function runAction(action: "finalize" | "cancel") {
        if (!sale) {
            return;
        }
        setActionLoading(true);
        setError(null);
        try {
            setSale(action === "finalize" ? await finalizeSale(sale.id) : await cancelSale(sale.id));
        } catch (actionError) {
            setError(getApiErrorMessage(actionError, "Nao foi possivel atualizar a venda."));
        } finally {
            setActionLoading(false);
        }
    }

    if (loading) {
        return <LoadingState />;
    }

    if (!sale) {
        return <section className="page-section"><PageHeader title="Venda nao encontrada" /></section>;
    }

    return (
        <section className="page-section">
            <PageHeader
                eyebrow="Vendas"
                title={`Venda #${sale.id}`}
                description={`${sale.status} - ${formatDateTime(sale.createdAt)}`}
                action={<Link className="secondary-button link-button" to="/sales">Voltar</Link>}
            />
            {error && <div className="form-error">{error}</div>}
            <div className="detail-grid">
                <div><span>Cliente</span><strong>{sale.clientName ?? "-"}</strong></div>
                <div><span>Funcionario</span><strong>{sale.employeeName ?? "-"}</strong></div>
                <div><span>Total</span><strong>{formatCurrency(sale.total)}</strong></div>
                <div><span>Desconto</span><strong>{formatCurrency(sale.discount)}</strong></div>
            </div>
            <div className="table-wrap">
                <table className="data-table">
                    <thead><tr><th>Produto</th><th>Quantidade</th><th>Preco</th><th>Desconto</th><th>Subtotal</th></tr></thead>
                    <tbody>
                        {sale.items.map((item, index) => (
                            <tr key={`${item.productId}-${index}`}>
                                <td>Produto #{item.productId ?? "-"}</td>
                                <td>{item.quantity}</td>
                                <td>{formatCurrency(item.unitPrice)}</td>
                                <td>{formatCurrency(item.discount)}</td>
                                <td>{formatCurrency(item.subtotal)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <h3>Pagamentos</h3>
            <div className="table-wrap">
                <table className="data-table">
                    <thead><tr><th>Metodo</th><th>Valor</th></tr></thead>
                    <tbody>{sale.payments.map((payment, index) => <tr key={`${payment.paymentMethodId}-${index}`}><td>Metodo #{payment.paymentMethodId}</td><td>{formatCurrency(payment.amount)}</td></tr>)}</tbody>
                </table>
            </div>
            {canManage(user?.role, ["admin", "gerente", "vendedor"]) && sale.status === "PENDENTE" && (
                <div className="form-actions">
                    <button type="button" className="primary-button" disabled={actionLoading} onClick={() => void runAction("finalize")}>Finalizar venda</button>
                    <button type="button" className="danger-button" disabled={actionLoading} onClick={() => void runAction("cancel")}>Cancelar venda</button>
                </div>
            )}
        </section>
    );
}

export default SaleDetail;
