import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import LoadingState from "../../components/common/LoadingState";
import PageHeader from "../../components/common/PageHeader";
import { useAuth } from "../../context/auth.context";
import { getApiErrorMessage } from "../../services/api";
import usePurchase from "../../hooks/usePurchase";
import { formatCurrency, formatDateTime } from "../../utils/formatters";
import { canManage } from "../../utils/permissions";

export function PurchaseDetail() {
    const { user } = useAuth();
    const { id } = useParams();
    const { purchase, setPurchase, loading, error, setError, loadPurchase, confirmPurchase, cancelPurchase } = usePurchase();
    const [actionLoading, setActionLoading] = useState(false);

    const loadPurchaseDetail = useCallback(async () => {
        if (!id) {
            return;
        }
        try {
            await loadPurchase(Number(id));
        } catch (loadError) {
            setError(getApiErrorMessage(loadError, "Nao foi possivel carregar a compra."));
        }
    }, [id, loadPurchase, setError]);

    useEffect(() => {
        void loadPurchaseDetail().catch(() => undefined);
    }, [loadPurchaseDetail]);

    async function runAction(action: "confirm" | "cancel") {
        if (!purchase) {
            return;
        }
        setActionLoading(true);
        setError(null);
        try {
            setPurchase(action === "confirm" ? await confirmPurchase(purchase.id) : await cancelPurchase(purchase.id));
        } catch (actionError) {
            setError(getApiErrorMessage(actionError, "Nao foi possivel atualizar a compra."));
        } finally {
            setActionLoading(false);
        }
    }

    if (loading) {
        return <LoadingState />;
    }

    if (!purchase) {
        return <section className="page-section"><PageHeader title="Compra nao encontrada" /></section>;
    }

    return (
        <section className="page-section">
            <PageHeader
                eyebrow="Compras"
                title={`Compra #${purchase.id}`}
                description={`${purchase.status} - ${formatDateTime(purchase.createdAt)}`}
                action={<Link className="secondary-button link-button" to="/purchases">Voltar</Link>}
            />
            {error && <div className="form-error">{error}</div>}
            <div className="detail-grid">
                <div><span>Fornecedor</span><strong>{purchase.supplierName ?? "-"}</strong></div>
                <div><span>Funcionario</span><strong>{purchase.employeeName ?? "-"}</strong></div>
                <div><span>Total</span><strong>{formatCurrency(purchase.total)}</strong></div>
                <div><span>Atualizada</span><strong>{formatDateTime(purchase.updatedAt)}</strong></div>
            </div>
            <div className="table-wrap">
                <table className="data-table">
                    <thead><tr><th>Produto</th><th>Quantidade</th><th>Custo</th><th>Subtotal</th></tr></thead>
                    <tbody>
                        {purchase.items.map((item, index) => (
                            <tr key={`${item.productId}-${index}`}>
                                <td>Produto #{item.productId ?? "-"}</td>
                                <td>{item.quantity}</td>
                                <td>{formatCurrency(item.unitCost)}</td>
                                <td>{formatCurrency(item.subtotal ?? item.quantity * item.unitCost)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {canManage(user?.role, ["admin", "gerente", "estoquista"]) && purchase.status === "PENDENTE" && (
                <div className="form-actions">
                    <button type="button" className="primary-button" disabled={actionLoading} onClick={() => void runAction("confirm")}>Confirmar recebimento</button>
                    <button type="button" className="danger-button" disabled={actionLoading} onClick={() => void runAction("cancel")}>Cancelar compra</button>
                </div>
            )}
        </section>
    );
}

export default PurchaseDetail;
