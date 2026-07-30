import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Eye, ListFilter, Pencil, Trash2, X } from "lucide-react";
import EmptyState from "../../components/common/EmptyState";
import ConfirmDeleteModal from "../../components/common/ConfirmDeleteModal";
import LoadingState from "../../components/common/LoadingState";
import PageHeader from "../../components/common/PageHeader";
import SearchInput from "../../components/common/SearchInput";
import StatusBadge from "../../components/common/StatusBadge";
import { useAuth } from "../../context/auth.context";
import { getApiErrorMessage } from "../../services/api";
import productService from "../../services/product.service";
import supplierService from "../../services/supplier.service";
import useSupplier from "../../hooks/useSupplier";
import type { DeletionReport } from "../../types/api.types";
import type { Supplier, SupplierRequest } from "../../types/supplier.types";
import { canDelete, canManage } from "../../utils/permissions";
import { formatDateTime } from "../../utils/formatters";
import { cityState, formatCnpj, formatPhone, formatZipCode, normalizeSearch, onlyDigits } from "../../utils/supplier-formatters";
import SupplierForm from "./SupplierForm";

interface SupplierTableRowProps {
    supplier: Supplier;
    canEdit: boolean;
    canRemove: boolean;
    selected: boolean;
    onView: (supplier: Supplier) => void;
    onEdit: (supplier: Supplier) => void;
    onDelete: (supplier: Supplier) => void;
}

type SupplierSortKey = "name" | "cnpj" | "city" | "status";
type SortDirection = "asc" | "desc";

function supplierStatus(supplier: Supplier) {
    return supplier.status
        ? { label: "Ativo", tone: "success" as const }
        : { label: "Desativado", tone: "muted" as const };
}

const SupplierTableRow = memo(function SupplierTableRow({
    supplier,
    canEdit,
    canRemove,
    selected,
    onView,
    onEdit,
    onDelete,
}: SupplierTableRowProps) {
    const status = supplierStatus(supplier);

    return (
        <tr className={`supplier-row${selected ? " supplier-row--selected" : ""}`} onClick={() => onView(supplier)}>
            <td>
                <div className="supplier-name-cell">
                    <strong>{supplier.tradeName || supplier.name}</strong>
                    <span>{supplier.legalName || supplier.name}</span>
                </div>
            </td>
            <td className="supplier-code">{formatCnpj(supplier.cnpj)}</td>
            <td>
                <div className="supplier-contact-cell">
                    <strong>{supplier.contactName || "-"}</strong>
                    <span>{supplier.email || "-"}</span>
                </div>
            </td>
            <td>{cityState(supplier.city, supplier.state)}</td>
            <td>
                <StatusBadge label={status.label} tone={status.tone} />
            </td>
            <td className="table-actions supplier-actions">
                <button
                    type="button"
                    className="table-action-button tooltip-button"
                    aria-label={`Visualizar fornecedor ${supplier.name}`}
                    title="Visualizar fornecedor"
                    data-tooltip="Visualizar fornecedor"
                    onClick={(event) => {
                        event.stopPropagation();
                        onView(supplier);
                    }}
                >
                    <Eye size={22} strokeWidth={2.3} aria-hidden="true" />
                </button>
                {canEdit && (
                    <button
                        type="button"
                        className="table-action-button table-action-button--edit tooltip-button"
                        aria-label={`Editar fornecedor ${supplier.name}`}
                        title="Editar fornecedor"
                        data-tooltip="Editar fornecedor"
                        onClick={(event) => {
                            event.stopPropagation();
                            onEdit(supplier);
                        }}
                    >
                        <Pencil size={22} strokeWidth={2.3} aria-hidden="true" />
                    </button>
                )}
                {canRemove && (
                    <button
                        type="button"
                        className="table-action-button table-action-button--delete tooltip-button"
                        aria-label={`Excluir fornecedor ${supplier.name}`}
                        title="Excluir fornecedor"
                        data-tooltip="Excluir fornecedor"
                        onClick={(event) => {
                            event.stopPropagation();
                            onDelete(supplier);
                        }}
                    >
                        <Trash2 size={22} strokeWidth={2.3} aria-hidden="true" />
                    </button>
                )}
            </td>
        </tr>
    );
});

export function SupplierList() {
    const { user } = useAuth();
    const { suppliers, loading, error, setError, fetchAll, create, update, remove, forceDelete } = useSupplier();
    const [search, setSearch] = useState("");
    const [showInactive, setShowInactive] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [deletionReport, setDeletionReport] = useState<DeletionReport | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [supplierToView, setSupplierToView] = useState<Supplier | null>(null);
    const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
    const [linkedProductsCount, setLinkedProductsCount] = useState(0);
    const [sortKey, setSortKey] = useState<SupplierSortKey>("name");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        void fetchAll(showInactive).catch(() => undefined);
    }, [fetchAll, showInactive]);

    useEffect(() => {
        let active = true;

        void productService.list().then((products) => {
            if (active) {
                setLinkedProductsCount(products.filter((product) => product.supplierId !== null).length);
            }
        }).catch(() => {
            if (active) {
                setLinkedProductsCount(0);
            }
        });

        return () => {
            active = false;
        };
    }, []);

    const filteredSuppliers = useMemo(() => {
        const term = normalizeSearch(search);
        const numericTerm = onlyDigits(search);

        return [...suppliers]
            .filter((supplier) => {
                if (!term && !numericTerm) {
                    return true;
                }

                const searchableText = [
                    supplier.name,
                    supplier.tradeName,
                    supplier.legalName,
                    supplier.contactName,
                    supplier.email,
                    supplier.city,
                ]
                    .map(normalizeSearch)
                    .join(" ");
                const searchableDigits = [supplier.cnpj, supplier.phone].map(onlyDigits).join(" ");

                return searchableText.includes(term) || (numericTerm.length > 0 && searchableDigits.includes(numericTerm));
            })
            .sort((left, right) => {
                let comparison: number;

                if (sortKey === "cnpj") {
                    comparison = onlyDigits(left.cnpj).localeCompare(onlyDigits(right.cnpj));
                } else if (sortKey === "city") {
                    comparison = cityState(left.city, left.state).localeCompare(cityState(right.city, right.state), "pt-BR", { sensitivity: "base" });
                } else if (sortKey === "status") {
                    comparison = Number(left.status) - Number(right.status);
                } else {
                    comparison = (left.tradeName || left.name).localeCompare(right.tradeName || right.name, "pt-BR", { sensitivity: "base" });
                }

                return sortDirection === "asc" ? comparison : -comparison;
            });
    }, [search, sortDirection, sortKey, suppliers]);

    useEffect(() => {
        setPage(1);
    }, [search, showInactive, pageSize, sortDirection, sortKey]);

    const supplierStats = useMemo(() => {
        const activeCount = suppliers.filter((supplier) => supplier.status).length;
        const inactiveCount = suppliers.length - activeCount;
        const servedStates = new Set(
            suppliers
                .filter((supplier) => supplier.status && supplier.state)
                .map((supplier) => supplier.state.trim().toUpperCase()),
        ).size;

        return {
            activeCount,
            inactiveCount,
            servedStates,
            linkedProductsCount,
        };
    }, [linkedProductsCount, suppliers]);

    const totalPages = Math.max(1, Math.ceil(filteredSuppliers.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const pageStart = filteredSuppliers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const pageEnd = Math.min(currentPage * pageSize, filteredSuppliers.length);
    const paginatedSuppliers = useMemo(
        () => filteredSuppliers.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [currentPage, filteredSuppliers, pageSize],
    );
    const visiblePages = useMemo(() => {
        const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
        const end = Math.min(totalPages, start + 4);
        return Array.from({ length: end - start + 1 }, (_, index) => start + index);
    }, [currentPage, totalPages]);

    const hasLinkedProducts = Boolean((deletionReport?.dependencies.products ?? 0) > 0);
    const canEditSupplier = canManage(user?.role, ["ADMIN", "MANAGER", "STOCK", "BUYER"]);
    const canDeleteSupplier = canDelete(user?.role, ["ADMIN", "MANAGER", "STOCK"]);

    const handleViewClick = useCallback((supplier: Supplier) => {
        setSelectedSupplierId(supplier.id);
        setSupplierToView(supplier);
    }, []);

    function handleSort(nextSortKey: SupplierSortKey) {
        if (sortKey === nextSortKey) {
            setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
            return;
        }

        setSortKey(nextSortKey);
        setSortDirection("asc");
    }

    function sortIndicator(targetSortKey: SupplierSortKey) {
        if (sortKey !== targetSortKey) {
            return "";
        }

        return sortDirection === "asc" ? " ^" : " v";
    }

    function resetFilters() {
        setSearch("");
        setShowInactive(false);
        setSortKey("name");
        setSortDirection("asc");
    }

    const handleEditClick = useCallback((supplier: Supplier) => {
        setEditingSupplier(supplier);
        setShowForm(true);
    }, []);

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

    const handleDeleteClick = useCallback(async (supplier: Supplier) => {
        setDeleteError(null);
        setError(null);
        setSupplierToDelete(supplier);
        setDeletionReport(null);
        try {
            setDeletionReport(await supplierService.getDeletionReport(supplier.id));
        } catch (reportError) {
            setDeleteError(getApiErrorMessage(reportError, "Nao foi possivel carregar os vinculos do fornecedor."));
        }
    }, [setError]);

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
            />
            <div className="supplier-stats-row">
                <div className="metric-card supplier-metric-card success">
                    <span>Fornecedores ativos</span>
                    <strong>{supplierStats.activeCount}</strong>
                </div>
                <div className="metric-card supplier-metric-card">
                    <span>Desativados</span>
                    <strong>{supplierStats.inactiveCount}</strong>
                </div>
                <div className="metric-card supplier-metric-card">
                    <span>Estados atendidos</span>
                    <strong>{supplierStats.servedStates}</strong>
                </div>
                <div className="metric-card supplier-metric-card">
                    <span>Produtos vinculados</span>
                    <strong>{supplierStats.linkedProductsCount.toLocaleString("pt-BR")}</strong>
                </div>
            </div>
            <div className="supplier-filter-panel">
                <div className="supplier-filter-panel__search">
                    <SearchInput value={search} onChange={setSearch} placeholder="Pesquisar fornecedor..." />
                    <span>{filteredSuppliers.length} fornecedores encontrados</span>
                </div>
                <div className="supplier-filter-panel__actions">
                    <button type="button" className="secondary-button" onClick={() => setFiltersOpen((current) => !current)} aria-expanded={filtersOpen}>
                        <ListFilter size={18} aria-hidden="true" />
                        Filtros
                        <ChevronDown className={filtersOpen ? "is-open" : undefined} size={16} aria-hidden="true" />
                    </button>
                    {canEditSupplier && (
                        <button type="button" className="primary-button" onClick={() => setShowForm(true)}>
                            Novo fornecedor
                        </button>
                    )}
                </div>
            </div>
            {filtersOpen && (
                <div className="product-filter-grid supplier-filter-grid">
                    <label className="client-switch-field">
                        Mostrar registros desativados
                        <button type="button" className={`client-switch${showInactive ? " active" : ""}`} aria-pressed={showInactive} onClick={() => setShowInactive((current) => !current)}>
                            <span />
                        </button>
                    </label>
                    <button type="button" className="secondary-button product-filter-reset" onClick={resetFilters}>
                        <ListFilter size={18} aria-hidden="true" />
                        Limpar filtros
                    </button>
                </div>
            )}
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
                    <table className="data-table supplier-table">
                        <thead>
                            <tr>
                                <th><button type="button" className="table-sort-button" onClick={() => handleSort("name")}>Nome{sortIndicator("name")}</button></th>
                                <th><button type="button" className="table-sort-button" onClick={() => handleSort("cnpj")}>CNPJ{sortIndicator("cnpj")}</button></th>
                                <th>Contato</th>
                                <th><button type="button" className="table-sort-button" onClick={() => handleSort("city")}>Cidade{sortIndicator("city")}</button></th>
                                <th><button type="button" className="table-sort-button" onClick={() => handleSort("status")}>Status{sortIndicator("status")}</button></th>
                                <th>Acoes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedSuppliers.map((supplier) => (
                                <SupplierTableRow
                                    key={supplier.id}
                                    supplier={supplier}
                                    canEdit={canEditSupplier}
                                    canRemove={canDeleteSupplier}
                                    selected={selectedSupplierId === supplier.id}
                                    onView={handleViewClick}
                                    onEdit={handleEditClick}
                                    onDelete={handleDeleteClick}
                                />
                            ))}
                        </tbody>
                    </table>
                    <div className="supplier-pagination">
                        <span>Mostrando {pageStart}-{pageEnd} de {filteredSuppliers.length} fornecedores</span>
                        <label>
                            Registros por pagina
                            <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
                                {[10, 25, 50, 100].map((size) => (
                                    <option key={size} value={size}>{size}</option>
                                ))}
                            </select>
                        </label>
                        <div className="supplier-pagination__pages" aria-label="Paginacao de fornecedores">
                            <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={currentPage === 1}>
                                &lt;
                            </button>
                            {visiblePages.map((pageNumber) => (
                                <button
                                    key={pageNumber}
                                    type="button"
                                    className={pageNumber === currentPage ? "active" : undefined}
                                    onClick={() => setPage(pageNumber)}
                                >
                                    {pageNumber}
                                </button>
                            ))}
                            <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={currentPage === totalPages}>
                                &gt;
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <ConfirmDeleteModal
                isOpen={supplierToDelete !== null}
                title="Excluir fornecedor"
                itemName={supplierToDelete?.name}
                prompt="Tem certeza que deseja excluir este fornecedor?"
                description="Esta acao nao podera ser desfeita."
                dependencyDescription={
                    hasLinkedProducts
                        ? "Este fornecedor possui produtos vinculados. Deseja apenas desativa-lo?"
                        : "Para preservar a integridade do historico, o registro sera apenas desativado."
                }
                confirmLabel="Excluir fornecedor"
                isLoading={isDeleting}
                error={deleteError}
                report={deletionReport}
                userRole={user?.role}
                onConfirm={handleConfirmDelete}
                onForceConfirm={handleForceDelete}
                onCancel={handleCancelDelete}
            />
            {supplierToView && (
                <div className="supplier-drawer-overlay" role="presentation" onMouseDown={(event) => {
                    if (event.target === event.currentTarget) {
                        setSupplierToView(null);
                    }
                }}>
                    <aside className="supplier-detail-drawer" role="dialog" aria-modal="true" aria-label="Visualizar fornecedor">
                        <div className="supplier-detail-modal__header">
                            <div>
                                <span>Visualizar fornecedor</span>
                                <h2>{supplierToView.tradeName || supplierToView.name}</h2>
                            </div>
                            <button
                                type="button"
                                className="table-action-button tooltip-button"
                                aria-label="Fechar detalhes"
                                title="Fechar"
                                data-tooltip="Fechar"
                                onClick={() => setSupplierToView(null)}
                            >
                                <X size={19} aria-hidden="true" />
                            </button>
                        </div>
                        <section className="supplier-detail-section">
                            <h3>Informacoes gerais</h3>
                            <dl className="supplier-detail-grid">
                                <div><dt>Razao Social</dt><dd>{supplierToView.legalName || supplierToView.name}</dd></div>
                                <div><dt>Nome Fantasia</dt><dd>{supplierToView.tradeName || supplierToView.name}</dd></div>
                                <div><dt>CNPJ</dt><dd>{formatCnpj(supplierToView.cnpj)}</dd></div>
                                <div><dt>IE</dt><dd>{supplierToView.stateRegistration || "-"}</dd></div>
                            </dl>
                        </section>
                        <section className="supplier-detail-section">
                            <h3>Contato</h3>
                            <dl className="supplier-detail-grid">
                                <div><dt>Responsavel</dt><dd>{supplierToView.contactName || "-"}</dd></div>
                                <div><dt>Email</dt><dd>{supplierToView.email || "-"}</dd></div>
                                <div><dt>Telefone</dt><dd>{formatPhone(supplierToView.phone) || "-"}</dd></div>
                            </dl>
                        </section>
                        <section className="supplier-detail-section">
                            <h3>Endereco</h3>
                            <dl className="supplier-detail-grid">
                                <div><dt>CEP</dt><dd>{formatZipCode(supplierToView.zipCode) || "-"}</dd></div>
                                <div><dt>Rua</dt><dd>{supplierToView.street || "-"}</dd></div>
                                <div><dt>Numero</dt><dd>{supplierToView.number || "-"}</dd></div>
                                <div><dt>Bairro</dt><dd>{supplierToView.district || "-"}</dd></div>
                                <div><dt>Cidade</dt><dd>{supplierToView.city || "-"}</dd></div>
                                <div><dt>Estado</dt><dd>{supplierToView.state || "-"}</dd></div>
                                <div className="span-2"><dt>Endereco completo</dt><dd>{supplierToView.address || [supplierToView.street, supplierToView.number, supplierToView.district].filter(Boolean).join(", ") || "-"}</dd></div>
                            </dl>
                        </section>
                        <section className="supplier-detail-section">
                            <h3>Sistema</h3>
                            <dl className="supplier-detail-grid">
                                <div><dt>Status</dt><dd><StatusBadge label={supplierStatus(supplierToView).label} tone={supplierStatus(supplierToView).tone} /></dd></div>
                                <div><dt>Data de criacao</dt><dd>{formatDateTime(supplierToView.createdAt)}</dd></div>
                                <div><dt>Ultima atualizacao</dt><dd>{formatDateTime(supplierToView.updatedAt)}</dd></div>
                            </dl>
                        </section>
                    </aside>
                </div>
            )}
        </section>
    );
}

export default SupplierList;
