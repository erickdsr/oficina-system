import { memo, useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Ban,
    CheckCircle2,
    ClipboardList,
    Copy,
    CreditCard,
    Eye,
    PackageCheck,
    Pencil,
    Plus,
    RefreshCw,
    ShoppingCart,
    Timer,
    Trash2,
    WalletCards,
    XCircle,
} from "lucide-react";
import { ActiveFilterChips, FilterPanel, FilterResultSummary, FilterSegmentedControl, FilterSelect } from "../../components/common/FilterPanel";
import ConfirmDeleteModal from "../../components/common/ConfirmDeleteModal";
import EmptyState from "../../components/common/EmptyState";
import LoadingState from "../../components/common/LoadingState";
import PageHeader from "../../components/common/PageHeader";
import { useAuth } from "../../context/auth.context";
import { getApiErrorMessage } from "../../services/api";
import productService from "../../services/product.service";
import supplierService from "../../services/supplier.service";
import usePurchase from "../../hooks/usePurchase";
import type { ProductResponse } from "../../types/product.types";
import type { PurchaseRequest, PurchaseResponse, PurchaseStatus } from "../../types/purchase.types";
import type { Supplier } from "../../types/supplier.types";
import { displayValue, formatCurrency, formatDateTime } from "../../utils/formatters";
import { canDelete, canManage } from "../../utils/permissions";
import { normalizeSearch } from "../../utils/text";

type PurchaseStatusFilter = "all" | PurchaseStatus | "PROCESSANDO";
type PurchasePeriodFilter = "all" | "today" | "week" | "month" | "custom";
type PurchaseSortKey = "recent" | "oldest" | "highest" | "lowest";
type PurchaseActionLoading = { id: number; action: "receive" | "cancel" | "duplicate" } | null;

interface PurchaseFilters {
    search: string;
    supplierFilter: string;
    statusFilter: PurchaseStatusFilter;
    periodFilter: PurchasePeriodFilter;
    customStart: string;
    customEnd: string;
    sortKey: PurchaseSortKey;
    minValue: string;
    maxValue: string;
}

const defaultPurchaseFilters: PurchaseFilters = {
    search: "",
    supplierFilter: "all",
    statusFilter: "all",
    periodFilter: "all",
    customStart: "",
    customEnd: "",
    sortKey: "recent",
    minValue: "",
    maxValue: "",
};

interface PurchaseRow {
    purchase: PurchaseResponse;
    supplier?: Supplier;
    itemCount: number;
    productNames: string[];
}

interface PurchaseTableRowProps {
    row: PurchaseRow;
    canEdit: boolean;
    canRemove: boolean;
    actionLoading: PurchaseActionLoading;
    onView: (purchase: PurchaseResponse) => void;
    onEdit: (purchase: PurchaseResponse) => void;
    onReceive: (purchase: PurchaseResponse) => void;
    onDuplicate: (purchase: PurchaseResponse) => void;
    onCancel: (purchase: PurchaseResponse) => void;
    onDelete: (purchase: PurchaseResponse) => void;
}

function formatDate(value?: string | null) {
    if (!value) {
        return "Nao informado";
    }

    return new Intl.DateTimeFormat("pt-BR").format(new Date(value));
}

function formatTime(value?: string | null) {
    if (!value) {
        return "";
    }

    return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatDocument(value?: string | null) {
    const digits = (value ?? "").replace(/\D/g, "");
    if (digits.length === 14) {
        return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
    }
    return displayValue(value);
}

function supplierLocation(supplier?: Supplier) {
    return [supplier?.city, supplier?.state].filter(Boolean).join(" / ") || "Cidade nao informada";
}

function purchaseNumber(purchase: PurchaseResponse) {
    return `COMP-${String(purchase.id).padStart(6, "0")}`;
}

function statusMeta(status: string) {
    const normalized = status.toUpperCase();
    if (normalized === "RECEBIDA") {
        return { label: "Recebida", tone: "success", Icon: CheckCircle2 };
    }
    if (normalized === "PENDENTE") {
        return { label: "Pendente", tone: "warning", Icon: Timer };
    }
    if (normalized === "CANCELADA") {
        return { label: "Cancelada", tone: "danger", Icon: XCircle };
    }
    return { label: "Em processamento", tone: "info", Icon: RefreshCw };
}

function PurchaseStatusBadge({ status }: { status: string }) {
    const { label, tone, Icon } = statusMeta(status);
    return (
        <span className={`status-badge purchase-status-badge ${tone}`}>
            <Icon size={14} aria-hidden="true" />
            {label}
        </span>
    );
}

function isWithinPeriod(value: string, period: PurchasePeriodFilter, start: string, end: string) {
    if (period === "all") {
        return true;
    }

    const date = new Date(value);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const time = date.getTime();

    if (period === "today") {
        return time >= startOfToday;
    }

    if (period === "week") {
        return time >= startOfToday - 6 * 86_400_000;
    }

    if (period === "month") {
        return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    }

    const startTime = start ? new Date(`${start}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY;
    const endTime = end ? new Date(`${end}T23:59:59`).getTime() : Number.POSITIVE_INFINITY;
    return time >= startTime && time <= endTime;
}

const PurchaseTableRow = memo(function PurchaseTableRow({
    row,
    canEdit,
    canRemove,
    actionLoading,
    onView,
    onEdit,
    onReceive,
    onDuplicate,
    onCancel,
    onDelete,
}: PurchaseTableRowProps) {
    const { purchase, supplier, itemCount } = row;
    const isPending = purchase.status === "PENDENTE";
    const isActionLoading = actionLoading?.id === purchase.id;

    return (
        <tr className={`purchase-row purchase-row--${purchase.status.toLowerCase()}`} onClick={() => onView(purchase)}>
            <td>
                <div className="purchase-number-cell">
                    <strong>{purchaseNumber(purchase)}</strong>
                    <span>#{purchase.id}</span>
                </div>
            </td>
            <td>
                <div className="purchase-supplier-cell">
                    <strong>{purchase.supplierName ?? supplier?.name ?? "Fornecedor nao informado"}</strong>
                    <span>{formatDocument(supplier?.cnpj)}</span>
                    <small>{supplierLocation(supplier)}</small>
                </div>
            </td>
            <td>{itemCount.toLocaleString("pt-BR")} itens</td>
            <td>
                <div className="purchase-total-cell">
                    <strong>{formatCurrency(purchase.total)}</strong>
                    <span>{itemCount.toLocaleString("pt-BR")} itens</span>
                </div>
            </td>
            <td><PurchaseStatusBadge status={purchase.status} /></td>
            <td>{displayValue(purchase.employeeName)}</td>
            <td>
                <div className="purchase-payment-cell">
                    <CreditCard size={16} aria-hidden="true" />
                    <span>Nao informado</span>
                </div>
            </td>
            <td>
                <div className="stock-date-cell">
                    <strong>{formatDate(purchase.createdAt)}</strong>
                    <span>{formatTime(purchase.createdAt)}</span>
                </div>
            </td>
            <td>
                <div className="stock-date-cell">
                    <strong>{formatDate(purchase.updatedAt)}</strong>
                    <span>{formatTime(purchase.updatedAt)}</span>
                </div>
            </td>
            <td>
                <span className="purchase-note-cell">{displayValue(purchase.notes)}</span>
            </td>
            <td className="purchase-actions-cell">
                <div className="table-actions purchase-actions">
                    <button type="button" className="table-action-button tooltip-button" data-tooltip="Visualizar" title="Visualizar" aria-label={`Visualizar compra ${purchaseNumber(purchase)}`} onClick={(event) => { event.stopPropagation(); onView(purchase); }}>
                        <Eye size={22} strokeWidth={2.3} aria-hidden="true" />
                    </button>
                    {canEdit && (
                        <button type="button" className="table-action-button table-action-button--edit tooltip-button" data-tooltip="Editar" title="Editar" aria-label={`Editar compra ${purchaseNumber(purchase)}`} onClick={(event) => { event.stopPropagation(); onEdit(purchase); }}>
                            <Pencil size={22} strokeWidth={2.3} aria-hidden="true" />
                        </button>
                    )}
                    {canEdit && isPending && (
                        <button type="button" className="table-action-button tooltip-button" data-tooltip="Receber compra" title="Receber compra" aria-label={`Receber compra ${purchaseNumber(purchase)}`} onClick={(event) => { event.stopPropagation(); onReceive(purchase); }} disabled={isActionLoading}>
                            <PackageCheck size={22} strokeWidth={2.3} aria-hidden="true" />
                        </button>
                    )}
                    {canEdit && (
                        <button type="button" className="table-action-button tooltip-button" data-tooltip="Duplicar compra" title="Duplicar compra" aria-label={`Duplicar compra ${purchaseNumber(purchase)}`} onClick={(event) => { event.stopPropagation(); onDuplicate(purchase); }} disabled={isActionLoading}>
                            <Copy size={22} strokeWidth={2.3} aria-hidden="true" />
                        </button>
                    )}
                    {canEdit && isPending && (
                        <button type="button" className="table-action-button tooltip-button" data-tooltip="Cancelar compra" title="Cancelar compra" aria-label={`Cancelar compra ${purchaseNumber(purchase)}`} onClick={(event) => { event.stopPropagation(); onCancel(purchase); }} disabled={isActionLoading}>
                            <Ban size={22} strokeWidth={2.3} aria-hidden="true" />
                        </button>
                    )}
                    {canRemove && (
                        <button type="button" className="table-action-button table-action-button--delete tooltip-button" data-tooltip="Excluir" title="Excluir" aria-label={`Excluir compra ${purchaseNumber(purchase)}`} onClick={(event) => { event.stopPropagation(); onDelete(purchase); }}>
                            <Trash2 size={22} strokeWidth={2.3} aria-hidden="true" />
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
});

export function PurchaseList() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { purchases, loading, error, loadPurchases, removePurchase, confirmPurchase, cancelPurchase, createPurchase } = usePurchase();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<ProductResponse[]>([]);
    const [metadataLoading, setMetadataLoading] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState<PurchaseFilters>(defaultPurchaseFilters);
    const [draftFilters, setDraftFilters] = useState<PurchaseFilters>(defaultPurchaseFilters);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [isApplyingFilters, setIsApplyingFilters] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [purchaseToDelete, setPurchaseToDelete] = useState<PurchaseResponse | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<PurchaseActionLoading>(null);

    const canEditPurchase = canManage(user?.role, ["ADMIN", "MANAGER", "STOCK", "BUYER"]);
    const canDeletePurchase = canDelete(user?.role, ["ADMIN", "MANAGER"]);

    const loadData = useCallback(async () => {
        setMetadataLoading(true);
        try {
            const [, supplierData, productData] = await Promise.all([
                loadPurchases(appliedFilters.statusFilter !== "all"),
                supplierService.list(true),
                productService.list(true),
            ]);
            setSuppliers(supplierData);
            setProducts(productData);
        } finally {
            setMetadataLoading(false);
        }
    }, [appliedFilters.statusFilter, loadPurchases]);

    useEffect(() => {
        void loadData().catch(() => undefined);
    }, [loadData]);

    const supplierById = useMemo(() => new Map(suppliers.map((supplier) => [supplier.id, supplier])), [suppliers]);
    const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);

    const purchaseRows = useMemo<PurchaseRow[]>(() => purchases.map((purchase) => ({
        purchase,
        supplier: purchase.supplierId ? supplierById.get(purchase.supplierId) : undefined,
        itemCount: purchase.items.reduce((sum, item) => sum + item.quantity, 0),
        productNames: purchase.items.map((item) => item.productId ? productById.get(item.productId)?.name ?? `Produto #${item.productId}` : "Produto sem cadastro"),
    })), [productById, purchases, supplierById]);

    const purchaseSummary = useMemo(() => {
        const received = purchases.filter((purchase) => purchase.status === "RECEBIDA").length;
        const pending = purchases.filter((purchase) => purchase.status === "PENDENTE").length;
        const totalValue = purchases.reduce((sum, purchase) => sum + purchase.total, 0);
        return {
            total: purchases.length,
            pending,
            received,
            totalValue,
            average: purchases.length > 0 ? totalValue / purchases.length : 0,
        };
    }, [purchases]);

    const filteredRows = useMemo(() => {
        const term = normalizeSearch(appliedFilters.search);
        const min = appliedFilters.minValue ? Number(appliedFilters.minValue) : Number.NEGATIVE_INFINITY;
        const max = appliedFilters.maxValue ? Number(appliedFilters.maxValue) : Number.POSITIVE_INFINITY;

        return [...purchaseRows]
            .filter((row) => {
                const { purchase, supplier, productNames } = row;
                const searchable = [
                    purchase.id,
                    purchaseNumber(purchase),
                    purchase.supplierName,
                    supplier?.cnpj,
                    supplier?.city,
                    supplier?.state,
                    purchase.employeeName,
                    purchase.status,
                    purchase.notes,
                    ...productNames,
                ].map((value) => normalizeSearch(String(value ?? "")));

                if (term && !searchable.some((value) => value.includes(term))) {
                    return false;
                }
                if (appliedFilters.supplierFilter !== "all" && String(purchase.supplierId ?? "") !== appliedFilters.supplierFilter) {
                    return false;
                }
                if (appliedFilters.statusFilter !== "all" && purchase.status !== appliedFilters.statusFilter) {
                    return false;
                }
                if (!isWithinPeriod(purchase.createdAt, appliedFilters.periodFilter, appliedFilters.customStart, appliedFilters.customEnd)) {
                    return false;
                }
                if (purchase.total < min || purchase.total > max) {
                    return false;
                }
                return true;
            })
            .sort((left, right) => {
                if (appliedFilters.sortKey === "oldest") {
                    return new Date(left.purchase.createdAt).getTime() - new Date(right.purchase.createdAt).getTime();
                }
                if (appliedFilters.sortKey === "highest") {
                    return right.purchase.total - left.purchase.total;
                }
                if (appliedFilters.sortKey === "lowest") {
                    return left.purchase.total - right.purchase.total;
                }
                return new Date(right.purchase.createdAt).getTime() - new Date(left.purchase.createdAt).getTime();
            });
    }, [appliedFilters.customEnd, appliedFilters.customStart, appliedFilters.maxValue, appliedFilters.minValue, appliedFilters.periodFilter, appliedFilters.search, appliedFilters.sortKey, appliedFilters.statusFilter, appliedFilters.supplierFilter, purchaseRows]);

    useEffect(() => {
        setPage(1);
    }, [appliedFilters, pageSize]);

    const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const pageStart = filteredRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const pageEnd = Math.min(currentPage * pageSize, filteredRows.length);
    const paginatedRows = useMemo(() => filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize), [currentPage, filteredRows, pageSize]);
    const visiblePages = useMemo(() => {
        const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
        const end = Math.min(totalPages, start + 4);
        return Array.from({ length: end - start + 1 }, (_, index) => start + index);
    }, [currentPage, totalPages]);

    function resetFilters() {
        setDraftFilters(defaultPurchaseFilters);
        setAppliedFilters(defaultPurchaseFilters);
        setIsApplyingFilters(false);
    }

    function applyFilters() {
        setIsApplyingFilters(true);
        setAppliedFilters(draftFilters);
        setPage(1);
        window.setTimeout(() => setIsApplyingFilters(false), 180);
    }

    const activeFilterCount = useMemo(() => {
        return [
            appliedFilters.search.trim() !== "",
            appliedFilters.supplierFilter !== defaultPurchaseFilters.supplierFilter,
            appliedFilters.statusFilter !== defaultPurchaseFilters.statusFilter,
            appliedFilters.periodFilter !== defaultPurchaseFilters.periodFilter,
            appliedFilters.sortKey !== defaultPurchaseFilters.sortKey,
            appliedFilters.minValue !== "" || appliedFilters.maxValue !== "",
            appliedFilters.customStart !== "" || appliedFilters.customEnd !== "",
        ].filter(Boolean).length;
    }, [appliedFilters]);

    const draftActiveFilterCount = useMemo(() => {
        return [
            draftFilters.search.trim() !== "",
            draftFilters.supplierFilter !== defaultPurchaseFilters.supplierFilter,
            draftFilters.statusFilter !== defaultPurchaseFilters.statusFilter,
            draftFilters.periodFilter !== defaultPurchaseFilters.periodFilter,
            draftFilters.sortKey !== defaultPurchaseFilters.sortKey,
            draftFilters.minValue !== "" || draftFilters.maxValue !== "",
            draftFilters.customStart !== "" || draftFilters.customEnd !== "",
        ].filter(Boolean).length;
    }, [draftFilters]);

    const hasActiveFilters = activeFilterCount > 0;

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
            await loadData();
            setPurchaseToDelete(null);
        } catch (removeError) {
            setDeleteError(getApiErrorMessage(removeError, "Nao foi possivel excluir a compra."));
        } finally {
            setIsDeleting(false);
        }
    }

    async function runPurchaseAction(purchase: PurchaseResponse, action: "receive" | "cancel" | "duplicate") {
        setActionLoading({ id: purchase.id, action });
        try {
            if (action === "receive") {
                await confirmPurchase(purchase.id);
            } else if (action === "cancel") {
                await cancelPurchase(purchase.id);
            } else {
                const payload: PurchaseRequest = {
                    supplierId: purchase.supplierId ?? 0,
                    employeeId: user?.employeeId ?? purchase.employeeId ?? 0,
                    notes: purchase.notes ? `Duplicada da ${purchaseNumber(purchase)} - ${purchase.notes}` : `Duplicada da ${purchaseNumber(purchase)}`,
                    items: purchase.items.map((item) => ({ ...item, subtotal: item.quantity * item.unitCost })),
                };
                const duplicated = await createPurchase(payload);
                navigate(`/purchases/${duplicated.id}`);
                return;
            }
            await loadData();
        } catch (actionError) {
            setDeleteError(getApiErrorMessage(actionError, "Nao foi possivel atualizar a compra."));
        } finally {
            setActionLoading(null);
        }
    }

    return (
        <section className="page-section purchase-page">
            <PageHeader
                eyebrow="Compras"
                title="Compras"
                description="Pedidos de compra e recebimento."
                action={canEditPurchase && (
                    <Link className="primary-button link-button" to="/purchases/new">
                        <Plus size={20} aria-hidden="true" />
                        Nova compra
                    </Link>
                )}
            />

            <div className="stock-metric-row purchase-metric-row">
                <div className="metric-card supplier-metric-card stock-metric-card purchase-metric-card">
                    <ShoppingCart size={18} aria-hidden="true" />
                    <span>Total de Compras</span>
                    <strong>{purchaseSummary.total.toLocaleString("pt-BR")}</strong>
                    <small>Pedidos registrados</small>
                </div>
                <div className="metric-card supplier-metric-card stock-metric-card purchase-metric-card warning">
                    <Timer size={18} aria-hidden="true" />
                    <span>Compras Pendentes</span>
                    <strong>{purchaseSummary.pending.toLocaleString("pt-BR")}</strong>
                    <small>Aguardando recebimento</small>
                </div>
                <div className="metric-card supplier-metric-card stock-metric-card purchase-metric-card success">
                    <PackageCheck size={18} aria-hidden="true" />
                    <span>Compras Recebidas</span>
                    <strong>{purchaseSummary.received.toLocaleString("pt-BR")}</strong>
                    <small>Estoque atualizado</small>
                </div>
                <div className="metric-card supplier-metric-card stock-metric-card purchase-metric-card">
                    <WalletCards size={18} aria-hidden="true" />
                    <span>Valor Total Comprado</span>
                    <strong>{formatCurrency(purchaseSummary.totalValue)}</strong>
                    <small>Soma do periodo listado</small>
                </div>
                <div className="metric-card supplier-metric-card stock-metric-card purchase-metric-card">
                    <ClipboardList size={18} aria-hidden="true" />
                    <span>Valor Medio por Compra</span>
                    <strong>{formatCurrency(purchaseSummary.average)}</strong>
                    <small>Ticket medio de compra</small>
                </div>
            </div>

            <FilterPanel
                search={draftFilters.search}
                searchPlaceholder="Pesquisar por numero, fornecedor ou responsavel..."
                filtersOpen={filtersOpen}
                activeFilterCount={activeFilterCount}
                isApplying={isApplyingFilters}
                hasActiveFilters={hasActiveFilters}
                onSearchChange={(search) => setDraftFilters((current) => ({ ...current, search }))}
                onSearchSubmit={applyFilters}
                onToggleFilters={() => setFiltersOpen((current) => !current)}
                onClearFilters={resetFilters}
                onApplyFilters={applyFilters}
                chips={draftActiveFilterCount > 0 && (
                    <ActiveFilterChips>
                        {draftFilters.statusFilter !== "all" && <button type="button" onClick={() => setDraftFilters((current) => ({ ...current, statusFilter: "all" }))}>{draftFilters.statusFilter} <XCircle size={13} aria-hidden="true" /></button>}
                        {draftFilters.supplierFilter !== "all" && <button type="button" onClick={() => setDraftFilters((current) => ({ ...current, supplierFilter: "all" }))}>Fornecedor <XCircle size={13} aria-hidden="true" /></button>}
                        {draftFilters.periodFilter !== "all" && <button type="button" onClick={() => setDraftFilters((current) => ({ ...current, periodFilter: "all", customStart: "", customEnd: "" }))}>Periodo <XCircle size={13} aria-hidden="true" /></button>}
                    </ActiveFilterChips>
                )}
            >
                <FilterSelect label="Ordenacao" value={draftFilters.sortKey} onChange={(sortKey) => setDraftFilters((current) => ({ ...current, sortKey }))} options={[
                    { value: "recent", label: "Mais recentes" },
                    { value: "oldest", label: "Mais antigas" },
                    { value: "highest", label: "Maior valor" },
                    { value: "lowest", label: "Menor valor" },
                ]} />
                <FilterSegmentedControl label="Status" value={draftFilters.statusFilter} onChange={(statusFilter) => setDraftFilters((current) => ({ ...current, statusFilter }))} options={[
                    { value: "all", label: "Todas" },
                    { value: "PENDENTE", label: "Pendentes" },
                    { value: "RECEBIDA", label: "Recebidas" },
                    { value: "CANCELADA", label: "Canceladas" },
                ]} />
                <FilterSelect label="Fornecedor" value={draftFilters.supplierFilter} onChange={(supplierFilter) => setDraftFilters((current) => ({ ...current, supplierFilter }))} options={[
                    { value: "all", label: "Todos" },
                    ...suppliers.map((supplier) => ({ value: String(supplier.id), label: supplier.tradeName || supplier.name })),
                ]} />
                <FilterSelect label="Periodo" value={draftFilters.periodFilter} onChange={(periodFilter) => setDraftFilters((current) => ({ ...current, periodFilter }))} options={[
                    { value: "all", label: "Todos" },
                    { value: "today", label: "Hoje" },
                    { value: "week", label: "Semana" },
                    { value: "month", label: "Mes" },
                    { value: "custom", label: "Personalizado" },
                ]} />
                <section className="client-filter-group garage-filter-field">
                    <h3>Valor minimo</h3>
                    <div className="client-input-wrap"><input type="number" min="0" step="0.01" value={draftFilters.minValue} onChange={(event) => setDraftFilters((current) => ({ ...current, minValue: event.target.value }))} placeholder="R$ 0,00" /></div>
                </section>
                <section className="client-filter-group garage-filter-field">
                    <h3>Valor maximo</h3>
                    <div className="client-input-wrap"><input type="number" min="0" step="0.01" value={draftFilters.maxValue} onChange={(event) => setDraftFilters((current) => ({ ...current, maxValue: event.target.value }))} placeholder="Sem limite" /></div>
                </section>
                {draftFilters.periodFilter === "custom" && (
                    <>
                        <section className="client-filter-group garage-filter-field"><h3>Inicio</h3><div className="client-input-wrap"><input type="date" value={draftFilters.customStart} onChange={(event) => setDraftFilters((current) => ({ ...current, customStart: event.target.value }))} /></div></section>
                        <section className="client-filter-group garage-filter-field"><h3>Fim</h3><div className="client-input-wrap"><input type="date" value={draftFilters.customEnd} onChange={(event) => setDraftFilters((current) => ({ ...current, customEnd: event.target.value }))} /></div></section>
                    </>
                )}
            </FilterPanel>

            {error && <div className="form-error">{error}</div>}
            {deleteError && !purchaseToDelete && <div className="form-error">{deleteError}</div>}

            {loading || metadataLoading ? <LoadingState /> : filteredRows.length === 0 ? (
                <EmptyState
                    message={hasActiveFilters ? "Nenhuma compra encontrada com os filtros atuais." : "Nenhuma compra encontrada."}
                    description={hasActiveFilters ? "Ajuste os campos ou limpe os filtros para ampliar a busca." : "Registre uma nova compra para continuar."}
                    actionLabel={hasActiveFilters ? "Limpar filtros" : canEditPurchase ? "Nova Compra" : undefined}
                    onAction={hasActiveFilters ? resetFilters : canEditPurchase ? () => navigate("/purchases/new") : undefined}
                />
            ) : (
                <>
                    <FilterResultSummary total={filteredRows.length} noun="compras" hasActiveFilters={hasActiveFilters} />
                    <div className="table-wrap purchase-table-wrap">
                        <table className="data-table purchase-table">
                            <thead>
                                <tr>
                                    <th>Numero</th>
                                    <th>Fornecedor</th>
                                    <th>Qtd. Itens</th>
                                    <th>Valor Total</th>
                                    <th>Status</th>
                                    <th>Responsavel</th>
                                    <th>Pagamento</th>
                                    <th>Data da Compra</th>
                                    <th>Atualizacao</th>
                                    <th>Observacao</th>
                                    <th>Acoes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedRows.map((row) => (
                                    <PurchaseTableRow
                                        key={row.purchase.id}
                                        row={row}
                                        canEdit={canEditPurchase}
                                        canRemove={canDeletePurchase}
                                        actionLoading={actionLoading}
                                        onView={(purchase) => navigate(`/purchases/${purchase.id}`)}
                                        onEdit={(purchase) => navigate(`/purchases/${purchase.id}`)}
                                        onReceive={(purchase) => void runPurchaseAction(purchase, "receive")}
                                        onDuplicate={(purchase) => void runPurchaseAction(purchase, "duplicate")}
                                        onCancel={(purchase) => void runPurchaseAction(purchase, "cancel")}
                                        onDelete={handleDeleteClick}
                                    />
                                ))}
                            </tbody>
                        </table>
                        <PurchasePagination
                            pageStart={pageStart}
                            pageEnd={pageEnd}
                            total={filteredRows.length}
                            pageSize={pageSize}
                            setPageSize={setPageSize}
                            currentPage={currentPage}
                            totalPages={totalPages}
                            visiblePages={visiblePages}
                            setPage={setPage}
                        />
                    </div>

                    <div className="purchase-card-list">
                        {paginatedRows.map((row) => (
                            <article key={row.purchase.id} className="purchase-mobile-card">
                                <div className="purchase-mobile-card__header">
                                    <div>
                                        <strong>{purchaseNumber(row.purchase)}</strong>
                                        <span>{row.purchase.supplierName ?? "Fornecedor nao informado"}</span>
                                    </div>
                                    <PurchaseStatusBadge status={row.purchase.status} />
                                </div>
                                <dl>
                                    <div><dt>CNPJ</dt><dd>{formatDocument(row.supplier?.cnpj)}</dd></div>
                                    <div><dt>Local</dt><dd>{supplierLocation(row.supplier)}</dd></div>
                                    <div><dt>Total</dt><dd>{formatCurrency(row.purchase.total)}</dd></div>
                                    <div><dt>Itens</dt><dd>{row.itemCount.toLocaleString("pt-BR")}</dd></div>
                                    <div><dt>Responsavel</dt><dd>{displayValue(row.purchase.employeeName)}</dd></div>
                                    <div><dt>Data</dt><dd>{formatDateTime(row.purchase.createdAt)}</dd></div>
                                </dl>
                                <div className="table-actions purchase-actions">
                                    <button type="button" className="table-action-button tooltip-button" data-tooltip="Visualizar" aria-label="Visualizar compra" onClick={() => navigate(`/purchases/${row.purchase.id}`)}><Eye size={22} aria-hidden="true" /></button>
                                    {canEditPurchase && <button type="button" className="table-action-button table-action-button--edit tooltip-button" data-tooltip="Editar" aria-label="Editar compra" onClick={() => navigate(`/purchases/${row.purchase.id}`)}><Pencil size={22} aria-hidden="true" /></button>}
                                    {canEditPurchase && row.purchase.status === "PENDENTE" && <button type="button" className="table-action-button tooltip-button" data-tooltip="Receber compra" aria-label="Receber compra" onClick={() => void runPurchaseAction(row.purchase, "receive")}><PackageCheck size={22} aria-hidden="true" /></button>}
                                    {canEditPurchase && <button type="button" className="table-action-button tooltip-button" data-tooltip="Duplicar compra" aria-label="Duplicar compra" onClick={() => void runPurchaseAction(row.purchase, "duplicate")}><Copy size={22} aria-hidden="true" /></button>}
                                    {canEditPurchase && row.purchase.status === "PENDENTE" && <button type="button" className="table-action-button tooltip-button" data-tooltip="Cancelar compra" aria-label="Cancelar compra" onClick={() => void runPurchaseAction(row.purchase, "cancel")}><Ban size={22} aria-hidden="true" /></button>}
                                    {canDeletePurchase && <button type="button" className="table-action-button table-action-button--delete tooltip-button" data-tooltip="Excluir" aria-label="Excluir compra" onClick={() => handleDeleteClick(row.purchase)}><Trash2 size={22} aria-hidden="true" /></button>}
                                </div>
                            </article>
                        ))}
                        <PurchasePagination
                            pageStart={pageStart}
                            pageEnd={pageEnd}
                            total={filteredRows.length}
                            pageSize={pageSize}
                            setPageSize={setPageSize}
                            currentPage={currentPage}
                            totalPages={totalPages}
                            visiblePages={visiblePages}
                            setPage={setPage}
                        />
                    </div>
                </>
            )}

            <ConfirmDeleteModal
                isOpen={purchaseToDelete !== null}
                title="Excluir compra"
                itemName={purchaseToDelete ? purchaseNumber(purchaseToDelete) : undefined}
                prompt="Deseja realmente excluir esta compra?"
                description="Essa acao nao podera ser desfeita."
                confirmLabel="Excluir Compra"
                loadingLabel="Excluindo..."
                isLoading={isDeleting}
                error={deleteError}
                details={purchaseToDelete ? [
                    { label: "Fornecedor", value: purchaseToDelete.supplierName ?? "-" },
                    { label: "Valor total", value: formatCurrency(purchaseToDelete.total) },
                    { label: "Status", value: statusMeta(purchaseToDelete.status).label },
                ] : []}
                userRole={user?.role}
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
            />
        </section>
    );
}

interface PaginationProps {
    pageStart: number;
    pageEnd: number;
    total: number;
    pageSize: number;
    setPageSize: (size: number) => void;
    currentPage: number;
    totalPages: number;
    visiblePages: number[];
    setPage: Dispatch<SetStateAction<number>>;
}

function PurchasePagination({ pageStart, pageEnd, total, pageSize, setPageSize, currentPage, totalPages, visiblePages, setPage }: PaginationProps) {
    return (
        <div className="supplier-pagination purchase-pagination">
            <span>Mostrando {pageStart}-{pageEnd} de {total.toLocaleString("pt-BR")} compras</span>
            <label>
                <select aria-label="Registros por pagina" value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
                    {[10, 20, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
                </select>
            </label>
            <div className="supplier-pagination__pages" aria-label="Paginacao de compras">
                <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={currentPage === 1}>Anterior</button>
                {visiblePages.map((pageNumber) => (
                    <button key={pageNumber} type="button" className={pageNumber === currentPage ? "active" : undefined} onClick={() => setPage(pageNumber)}>{pageNumber}</button>
                ))}
                <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={currentPage === totalPages}>Proximo</button>
            </div>
        </div>
    );
}

export default PurchaseList;
