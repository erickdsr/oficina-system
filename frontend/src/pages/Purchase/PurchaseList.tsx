import { memo, useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Ban,
    CheckCircle2,
    ClipboardList,
    Copy,
    CreditCard,
    Eye,
    FileText,
    PackageCheck,
    Pencil,
    Plus,
    RefreshCw,
    Search,
    ShoppingCart,
    Timer,
    Trash2,
    WalletCards,
    XCircle,
} from "lucide-react";
import ConfirmDeleteModal from "../../components/common/ConfirmDeleteModal";
import EmptyState from "../../components/common/EmptyState";
import LoadingState from "../../components/common/LoadingState";
import PageHeader from "../../components/common/PageHeader";
import SearchInput from "../../components/common/SearchInput";
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
    const [search, setSearch] = useState("");
    const [showInactive, setShowInactive] = useState(false);
    const [supplierFilter, setSupplierFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState<PurchaseStatusFilter>("all");
    const [periodFilter, setPeriodFilter] = useState<PurchasePeriodFilter>("all");
    const [customStart, setCustomStart] = useState("");
    const [customEnd, setCustomEnd] = useState("");
    const [sortKey, setSortKey] = useState<PurchaseSortKey>("recent");
    const [minValue, setMinValue] = useState("");
    const [maxValue, setMaxValue] = useState("");
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
                loadPurchases(showInactive),
                supplierService.list(true),
                productService.list(true),
            ]);
            setSuppliers(supplierData);
            setProducts(productData);
        } finally {
            setMetadataLoading(false);
        }
    }, [loadPurchases, showInactive]);

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
        const term = normalizeSearch(search);
        const min = minValue ? Number(minValue) : Number.NEGATIVE_INFINITY;
        const max = maxValue ? Number(maxValue) : Number.POSITIVE_INFINITY;

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
                if (supplierFilter !== "all" && String(purchase.supplierId ?? "") !== supplierFilter) {
                    return false;
                }
                if (statusFilter !== "all" && purchase.status !== statusFilter) {
                    return false;
                }
                if (!isWithinPeriod(purchase.createdAt, periodFilter, customStart, customEnd)) {
                    return false;
                }
                if (purchase.total < min || purchase.total > max) {
                    return false;
                }
                return true;
            })
            .sort((left, right) => {
                if (sortKey === "oldest") {
                    return new Date(left.purchase.createdAt).getTime() - new Date(right.purchase.createdAt).getTime();
                }
                if (sortKey === "highest") {
                    return right.purchase.total - left.purchase.total;
                }
                if (sortKey === "lowest") {
                    return left.purchase.total - right.purchase.total;
                }
                return new Date(right.purchase.createdAt).getTime() - new Date(left.purchase.createdAt).getTime();
            });
    }, [customEnd, customStart, maxValue, minValue, periodFilter, purchaseRows, search, sortKey, statusFilter, supplierFilter]);

    useEffect(() => {
        setPage(1);
    }, [customEnd, customStart, maxValue, minValue, pageSize, periodFilter, search, sortKey, statusFilter, supplierFilter]);

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
        setSearch("");
        setSupplierFilter("all");
        setStatusFilter("all");
        setPeriodFilter("all");
        setCustomStart("");
        setCustomEnd("");
        setSortKey("recent");
        setMinValue("");
        setMaxValue("");
        setShowInactive(false);
    }

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

            <div className="supplier-filter-panel stock-filter-panel purchase-filter-panel">
                <div className="supplier-filter-panel__search purchase-filter-panel__search">
                    <SearchInput value={search} onChange={setSearch} placeholder="Pesquisar compra, fornecedor, CNPJ, produto ou responsavel..." />
                    <div className="client-search-hints" aria-label="Campos pesquisaveis">
                        <Search size={14} aria-hidden="true" />
                        <span>Busca em tempo real por numero, fornecedor, CNPJ, produto e responsavel</span>
                    </div>
                </div>
                <div className="stock-filter-grid purchase-filter-grid">
                    <label className="employee-filter-field">
                        Fornecedor
                        <select value={supplierFilter} onChange={(event) => setSupplierFilter(event.target.value)}>
                            <option value="all">Todos</option>
                            {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.tradeName || supplier.name}</option>)}
                        </select>
                    </label>
                    <label className="employee-filter-field">
                        Status
                        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as PurchaseStatusFilter)}>
                            <option value="all">Todos</option>
                            <option value="PENDENTE">Pendente</option>
                            <option value="RECEBIDA">Recebida</option>
                            <option value="CANCELADA">Cancelada</option>
                        </select>
                    </label>
                    <label className="employee-filter-field">
                        Periodo
                        <select value={periodFilter} onChange={(event) => setPeriodFilter(event.target.value as PurchasePeriodFilter)}>
                            <option value="all">Todos</option>
                            <option value="today">Hoje</option>
                            <option value="week">Semana</option>
                            <option value="month">Mes</option>
                            <option value="custom">Personalizado</option>
                        </select>
                    </label>
                    <label className="employee-filter-field">
                        Ordenacao
                        <select value={sortKey} onChange={(event) => setSortKey(event.target.value as PurchaseSortKey)}>
                            <option value="recent">Mais recente</option>
                            <option value="oldest">Mais antiga</option>
                            <option value="highest">Maior valor</option>
                            <option value="lowest">Menor valor</option>
                        </select>
                    </label>
                    <label className="employee-filter-field">
                        Valor minimo
                        <input type="number" min="0" step="0.01" value={minValue} onChange={(event) => setMinValue(event.target.value)} placeholder="R$ 0,00" />
                    </label>
                    <label className="employee-filter-field">
                        Valor maximo
                        <input type="number" min="0" step="0.01" value={maxValue} onChange={(event) => setMaxValue(event.target.value)} placeholder="Sem limite" />
                    </label>
                    {periodFilter === "custom" && (
                        <>
                            <label className="employee-filter-field">
                                Inicio
                                <input type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} />
                            </label>
                            <label className="employee-filter-field">
                                Fim
                                <input type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} />
                            </label>
                        </>
                    )}
                    <label className="purchase-switch-field">
                        <span>Mostrar registros desativados</span>
                        <button type="button" className={`client-switch${showInactive ? " active" : ""}`} role="switch" aria-checked={showInactive} onClick={() => setShowInactive((current) => !current)}>
                            <span />
                        </button>
                    </label>
                    <div className="stock-filter-actions purchase-filter-actions">
                        <button type="button" className="secondary-button" onClick={resetFilters}>
                            <FileText size={18} aria-hidden="true" />
                            Limpar filtros
                        </button>
                        <button type="button" className="secondary-button" onClick={() => void loadData()} disabled={metadataLoading}>
                            <RefreshCw size={18} aria-hidden="true" />
                            Atualizar
                        </button>
                    </div>
                </div>
            </div>

            {error && <div className="form-error">{error}</div>}
            {deleteError && !purchaseToDelete && <div className="form-error">{deleteError}</div>}

            {loading ? <LoadingState /> : filteredRows.length === 0 ? (
                <EmptyState
                    message="Nenhuma compra encontrada."
                    description="Ajuste os filtros ou registre uma nova compra para continuar."
                    actionLabel={canEditPurchase ? "Nova Compra" : undefined}
                    onAction={canEditPurchase ? () => navigate("/purchases/new") : undefined}
                />
            ) : (
                <>
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
                Registros por pagina
                <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
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
