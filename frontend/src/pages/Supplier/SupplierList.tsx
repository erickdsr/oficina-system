import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import EmptyState from "../../components/common/EmptyState";
import ConfirmDeleteModal from "../../components/common/ConfirmDeleteModal";
import LoadingState from "../../components/common/LoadingState";
import PageHeader from "../../components/common/PageHeader";
import SearchInput from "../../components/common/SearchInput";
import StatusBadge from "../../components/common/StatusBadge";
import { useAuth } from "../../context/auth.context";
import { getApiErrorMessage } from "../../services/api";
import supplierService from "../../services/supplier.service";
import useSupplier from "../../hooks/useSupplier";
import type { DeletionReport } from "../../types/api.types";
import type { Supplier, SupplierRequest } from "../../types/supplier.types";
import { canDelete, canManage } from "../../utils/permissions";
import SupplierForm from "./SupplierForm";

export function SupplierList() {
    const { user } = useAuth();
    const { suppliers, loading, error, setError, fetchAll, create, update, remove, forceDelete } = useSupplier();
    const [search, setSearch] = useState("");
    const [showInactive, setShowInactive] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [deletionReport, setDeletionReport] = useState<DeletionReport | null>(null);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        void fetchAll(showInactive).catch(() => undefined);
    }, [fetchAll, showInactive]);

    const filteredSuppliers = useMemo(() => {
        const term = search.toLowerCase();
        return suppliers.filter((supplier) =>
            [supplier.name, supplier.cnpj, supplier.email, supplier.city].some((value) => value.toLowerCase().includes(term)),
        );
    }, [search, suppliers]);

    async function handleSubmit(data: SupplierRequest) {
        setSubmitting(true);
        setFormError(null);
        try {
            if (editingSupplier) {
                await update(editingSupplier.id, data);
            } else {
                await create(data);
            }
            setShowForm(false);
            setEditingSupplier(null);
            await fetchAll(showInactive);
        } catch (submitError) {
            setFormError(getApiErrorMessage(submitError, "Nao foi possivel salvar o fornecedor."));
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDeleteClick(supplier: Supplier) {
        setDeleteError(null);
        setError(null);
        setSupplierToDelete(supplier);
        setDeletionReport(null);
        try {
            setDeletionReport(await supplierService.getDeletionReport(supplier.id));
        } catch (reportError) {
            setDeleteError(getApiErrorMessage(reportError, "Nao foi possivel carregar os vinculos do fornecedor."));
        }
    }

    async function handleConfirmDelete() {
        if (!supplierToDelete || isDeleting) {
            return;
        }

        setIsDeleting(true);
        setDeleteError(null);
        try {
            await remove(supplierToDelete.id);
            await fetchAll(showInactive);
            setSupplierToDelete(null);
            setDeletionReport(null);
        } catch (removeError) {
            setDeleteError(getApiErrorMessage(removeError, "Nao foi possivel excluir o fornecedor. Tente novamente."));
        } finally {
            setIsDeleting(false);
        }
    }

    async function handleForceDelete() {
        if (!supplierToDelete || isDeleting) {
            return;
        }

        setIsDeleting(true);
        setDeleteError(null);
        try {
            await forceDelete(supplierToDelete.id);
            await fetchAll(showInactive);
            setSupplierToDelete(null);
            setDeletionReport(null);
        } catch (removeError) {
            setDeleteError(getApiErrorMessage(removeError, "Nao foi possivel excluir definitivamente o fornecedor."));
        } finally {
            setIsDeleting(false);
        }
    }

    function handleCancelDelete() {
        if (isDeleting) {
            return;
        }

        setSupplierToDelete(null);
        setDeleteError(null);
        setDeletionReport(null);
    }

    return (
        <section className="page-section">
            <PageHeader
                eyebrow="Cadastros"
                title="Fornecedores"
                description="Controle fornecedores da distribuidora."
                action={
                    canManage(user?.role, ["ADMIN", "MANAGER", "STOCK"]) && (
                        <button type="button" className="primary-button" onClick={() => setShowForm(true)}>
                            Novo fornecedor
                        </button>
                    )
                }
            />
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar fornecedor..." />
            <label className="checkbox-field">
                <input type="checkbox" checked={showInactive} onChange={(event) => setShowInactive(event.target.checked)} />
                Mostrar registros desativados
            </label>
            {showForm && (
                <SupplierForm
                    supplier={editingSupplier}
                    loading={submitting}
                    error={formError}
                    onCancel={() => {
                        setShowForm(false);
                        setEditingSupplier(null);
                    }}
                    onSubmit={handleSubmit}
                />
            )}
            {error && <div className="form-error">{error}</div>}
            {loading ? (
                <LoadingState />
            ) : filteredSuppliers.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>CNPJ</th>
                                <th>Contato</th>
                                <th>Cidade</th>
                                <th>Status</th>
                                <th>Acoes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSuppliers.map((supplier) => (
                                <tr key={supplier.id}>
                                    <td>{supplier.name}</td>
                                    <td>{supplier.cnpj}</td>
                                    <td>{supplier.email || supplier.phone}</td>
                                    <td>{supplier.city} / {supplier.state}</td>
                                    <td><StatusBadge active={supplier.status} /></td>
                                    <td className="table-actions">
                                        {canManage(user?.role, ["ADMIN", "MANAGER", "STOCK"]) && (
                                            <button
                                                type="button"
                                                className="table-action-button table-action-button--edit"
                                                aria-label={`Editar fornecedor ${supplier.name}`}
                                                title="Editar"
                                                onClick={() => { setEditingSupplier(supplier); setShowForm(true); }}
                                            >
                                                <Pencil size={20} aria-hidden="true" />
                                            </button>
                                        )}
                                        {canDelete(user?.role, ["ADMIN", "MANAGER", "STOCK"]) && (
                                            <button
                                                type="button"
                                                className="table-action-button table-action-button--delete"
                                                aria-label={`Excluir fornecedor ${supplier.name}`}
                                                title="Excluir"
                                                onClick={() => handleDeleteClick(supplier)}
                                            >
                                                <Trash2 size={20} aria-hidden="true" />
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
                isOpen={supplierToDelete !== null}
                title="Excluir fornecedor"
                itemName={supplierToDelete?.name}
                description="Esta acao nao podera ser desfeita."
                confirmLabel="Excluir fornecedor"
                isLoading={isDeleting}
                error={deleteError}
                report={deletionReport}
                userRole={user?.role}
                onConfirm={handleConfirmDelete}
                onForceConfirm={handleForceDelete}
                onCancel={handleCancelDelete}
            />
        </section>
    );
}

export default SupplierList;
