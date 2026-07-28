import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import ConfirmDeleteModal from "../../components/common/ConfirmDeleteModal";
import EmptyState from "../../components/common/EmptyState";
import LoadingState from "../../components/common/LoadingState";
import PageHeader from "../../components/common/PageHeader";
import SearchInput from "../../components/common/SearchInput";
import StatusBadge from "../../components/common/StatusBadge";
import { useAuth } from "../../context/auth.context";
import { getApiErrorMessage } from "../../services/api";
import usePurchase from "../../hooks/usePurchase";
import type { PurchaseResponse } from "../../types/purchase.types";
import { formatCurrency, formatDateTime } from "../../utils/formatters";
import { canDelete, canManage } from "../../utils/permissions";

export function PurchaseList() {
    const { user } = useAuth();
    const { purchases, loading, error, loadPurchases, removePurchase } = usePurchase();
    const [search, setSearch] = useState("");
    const [showInactive, setShowInactive] = useState(false);
    const [purchaseToDelete, setPurchaseToDelete] = useState<PurchaseResponse | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    useEffect(() => {
        void loadPurchases(showInactive).catch(() => undefined);
    }, [loadPurchases, showInactive]);

    const filteredPurchases = useMemo(() => {
        const term = search.toLowerCase();
        return purchases.filter((purchase) =>
            [purchase.supplierName ?? "", purchase.employeeName ?? "", purchase.status].some((value) => value.toLowerCase().includes(term)),
        );
    }, [purchases, search]);

    function handleDeleteClick(purchase: PurchaseResponse) {
        setDeleteError(null);
        setPurchaseToDelete(purchase);
    }

    function handleCancelDelete() {
        if (isDeleting) {
            return;
        }

        setPurchaseToDelete(null);
        setDeleteError(null);
    }

    async function handleConfirmDelete() {
        if (!purchaseToDelete || isDeleting) {
            return;
        }

        setIsDeleting(true);
        setDeleteError(null);
        try {
            await removePurchase(purchaseToDelete.id);
            await loadPurchases(showInactive);
            setPurchaseToDelete(null);
        } catch (removeError) {
            setDeleteError(getApiErrorMessage(removeError, "Nao foi possivel excluir a compra."));
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <section className="page-section">
            <PageHeader
                eyebrow="Compras"
                title="Compras"
                description="Pedidos de compra e recebimento."
                action={canManage(user?.role, ["ADMIN", "MANAGER", "STOCK", "BUYER"]) && <Link className="primary-button link-button" to="/purchases/new">Nova compra</Link>}
            />
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar compra..." />
            <label className="checkbox-field">
                <input type="checkbox" checked={showInactive} onChange={(event) => setShowInactive(event.target.checked)} />
                Mostrar registros desativados
            </label>
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
                                    <td className="table-actions">
                                        <Link className="secondary-button link-button" to={`/purchases/${purchase.id}`}>Detalhes</Link>
                                        {canDelete(user?.role, ["ADMIN", "MANAGER"]) && (
                                            <button
                                                type="button"
                                                className="danger-button"
                                                title="Excluir compra"
                                                aria-label={`Excluir compra #${purchase.id}`}
                                                onClick={() => handleDeleteClick(purchase)}
                                                disabled={isDeleting}
                                            >
                                                <Trash2 size={18} aria-hidden="true" />
                                                Excluir
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <ConfirmDeleteModal
                isOpen={purchaseToDelete !== null}
                title="Excluir compra"
                itemName={purchaseToDelete ? `#${purchaseToDelete.id}` : undefined}
                description="Esta acao podera ser irreversivel."
                confirmLabel="Excluir compra"
                loadingLabel="Excluindo..."
                isLoading={isDeleting}
                error={deleteError}
                details={purchaseToDelete ? [
                    { label: "Fornecedor", value: purchaseToDelete.supplierName ?? "-" },
                    { label: "Valor total", value: formatCurrency(purchaseToDelete.total) },
                    { label: "Status", value: purchaseToDelete.status },
                ] : []}
                userRole={user?.role}
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
            />
        </section>
    );
}

export default PurchaseList;
