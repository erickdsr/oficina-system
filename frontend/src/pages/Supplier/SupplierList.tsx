import { useEffect, useMemo, useState } from "react";
import EmptyState from "../../components/common/EmptyState";
import LoadingState from "../../components/common/LoadingState";
import PageHeader from "../../components/common/PageHeader";
import SearchInput from "../../components/common/SearchInput";
import StatusBadge from "../../components/common/StatusBadge";
import { useAuth } from "../../context/auth.context";
import { getApiErrorMessage } from "../../services/api";
import supplierService from "../../services/supplier.service";
import type { Supplier, SupplierRequest } from "../../types/supplier.types";
import { canDelete, canManage } from "../../utils/permissions";
import SupplierForm from "./SupplierForm";

export function SupplierList() {
    const { user } = useAuth();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [showForm, setShowForm] = useState(false);

    async function loadSuppliers() {
        setLoading(true);
        setError(null);
        try {
            setSuppliers(await supplierService.list());
        } catch (loadError) {
            setError(getApiErrorMessage(loadError, "Nao foi possivel carregar fornecedores."));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadSuppliers();
    }, []);

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
                await supplierService.update(editingSupplier.id, data);
            } else {
                await supplierService.create(data);
            }
            setShowForm(false);
            setEditingSupplier(null);
            await loadSuppliers();
        } catch (submitError) {
            setFormError(getApiErrorMessage(submitError, "Nao foi possivel salvar o fornecedor."));
        } finally {
            setSubmitting(false);
        }
    }

    async function handleRemove(supplier: Supplier) {
        if (!window.confirm(`Excluir fornecedor ${supplier.name}?`)) {
            return;
        }
        try {
            await supplierService.remove(supplier.id);
            await loadSuppliers();
        } catch (removeError) {
            setError(getApiErrorMessage(removeError, "Nao foi possivel excluir o fornecedor."));
        }
    }

    return (
        <section className="page-section">
            <PageHeader
                eyebrow="Cadastros"
                title="Fornecedores"
                description="Controle fornecedores da distribuidora."
                action={
                    canManage(user?.role, ["admin", "gerente", "estoquista"]) && (
                        <button type="button" className="primary-button" onClick={() => setShowForm(true)}>
                            Novo fornecedor
                        </button>
                    )
                }
            />
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar fornecedor..." />
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
                                        {canManage(user?.role, ["admin", "gerente", "estoquista"]) && (
                                            <button type="button" className="secondary-button" onClick={() => { setEditingSupplier(supplier); setShowForm(true); }}>
                                                Editar
                                            </button>
                                        )}
                                        {canDelete(user?.role) && (
                                            <button type="button" className="danger-button" onClick={() => void handleRemove(supplier)}>
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
        </section>
    );
}

export default SupplierList;
