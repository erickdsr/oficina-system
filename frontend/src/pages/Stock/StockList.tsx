import { memo, useCallback, useEffect, useMemo, useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { useNavigate } from "react-router-dom";
import {
    AlertTriangle,
    BarChart3,
    ClipboardList,
    Coins,
    Download,
    Eye,
    History,
    Package,
    Pencil,
    Plus,
    RotateCw,
    SlidersHorizontal,
    X,
    XCircle,
} from "lucide-react";
import { toast } from "sonner";
import EmptyState from "../../components/common/EmptyState";
import { ActiveFilterChips, FilterPanel, FilterResultSummary, FilterSegmentedControl, FilterSelect } from "../../components/common/FilterPanel";
import PageHeader from "../../components/common/PageHeader";
import StatusBadge from "../../components/common/StatusBadge";
import { useAuth } from "../../context/auth.context";
import { getApiErrorMessage } from "../../services/api";
import useStock from "../../hooks/useStock";
import productService from "../../services/product.service";
import saleService from "../../services/sale.service";
import type { ProductResponse } from "../../types/product.types";
import type { SaleResponse } from "../../types/sale.types";
import type { StockMovementDTO, StockMovementType, StockRequest, StockResponse } from "../../types/stock.types";
import { displayValue, formatCurrency, formatDateTime } from "../../utils/formatters";
import { canManage } from "../../utils/permissions";
import { normalizeSearch } from "../../utils/text";

type StockStatusFilter = "all" | "normal" | "low" | "empty";
type StockSortKey = "name" | "quantity" | "updatedAt" | "stockDesc" | "stockAsc";
type AdjustmentMode = "create" | "edit" | "adjust";

interface StockFilters {
    search: string;
    categoryFilter: string;
    supplierFilter: string;
    statusFilter: StockStatusFilter;
    locationFilter: string;
    sortKey: StockSortKey;
}

const defaultStockFilters: StockFilters = {
    search: "",
    categoryFilter: "all",
    supplierFilter: "all",
    statusFilter: "all",
    locationFilter: "all",
    sortKey: "name",
};

interface StockRow {
    stock: StockResponse;
    product?: ProductResponse;
    status: StockStatus;
    inventoryValue: number;
    soldQuantity: number;
}

type StockStatus = "normal" | "low" | "empty";

interface AdjustmentDraft {
    productId: number;
    type: StockMovementType;
    quantity: number;
    minQuantity: number;
    location: string;
    reason: string;
    supplier: string;
    notes: string;
}

const initialAdjustment: AdjustmentDraft = {
    productId: 0,
    type: "ENTRADA",
    quantity: 0,
    minQuantity: 0,
    location: "",
    reason: "",
    supplier: "",
    notes: "",
};

function internalCode(product?: ProductResponse, stock?: StockResponse) {
    if (product?.partNumber?.trim()) {
        return product.partNumber;
    }

    const id = product?.id ?? stock?.productId ?? stock?.id;
    return id ? `PROD-${String(id).padStart(6, "0")}` : "Nao informado";
}

function stockStatus(stock: StockResponse): StockStatus {
    if (stock.quantity <= 0) {
        return "empty";
    }
    if (stock.quantity <= stock.minQuantity) {
        return "low";
    }
    return "normal";
}

function stockStatusMeta(status: StockStatus) {
    if (status === "empty") {
        return { label: "Sem Estoque", tone: "danger" as const };
    }
    if (status === "low") {
        return { label: "Baixo Estoque", tone: "warning" as const };
    }
    return { label: "Normal", tone: "success" as const };
}

function quantityBadge(stock: StockResponse) {
    return `${stock.quantity.toLocaleString("pt-BR")} un`;
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

function isStale(value?: string | null) {
    if (!value) {
        return false;
    }

    return Date.now() - new Date(value).getTime() > 90 * 86_400_000;
}

function stockPercent(stock: StockResponse) {
    if (stock.quantity <= 0) {
        return 0;
    }

    const reference = Math.max(stock.minQuantity * 2, stock.quantity, 1);
    return Math.min(100, Math.round((stock.quantity / reference) * 100));
}

function buildAdjustmentNote(form: AdjustmentDraft) {
    return [form.reason.trim(), form.supplier.trim() ? `Fornecedor: ${form.supplier.trim()}` : "", form.notes.trim()].filter(Boolean).join(" | ");
}

function isPresent(value?: string | null): value is string {
    return Boolean(value?.trim());
}

interface StockTableRowProps {
    row: StockRow;
    canEdit: boolean;
    selected: boolean;
    onView: (row: StockRow) => void;
    onEdit: (row: StockRow) => void;
    onAdjust: (row: StockRow) => void;
    onHistory: (row: StockRow) => void;
    onRequestPurchase: (row: StockRow) => void;
}

const StockTableRow = memo(function StockTableRow({
    row,
    canEdit,
    selected,
    onView,
    onEdit,
    onAdjust,
    onHistory,
    onRequestPurchase,
}: StockTableRowProps) {
    const { stock, product, status, inventoryValue, soldQuantity } = row;
    const meta = stockStatusMeta(status);
    const stale = isStale(stock.updatedAt);
    const nearMinimum = status === "normal" && stock.quantity <= Math.ceil(stock.minQuantity * 1.2);

    return (
        <tr className={`stock-row stock-row--${status}${selected ? " stock-row--selected" : ""}`} onClick={() => onView(row)}>
            <td>
                <div className="stock-product-cell">
                    <strong>{product?.name ?? `Produto #${stock.productId ?? "-"}`}</strong>
                    <span>{internalCode(product, stock)}</span>
                    <small>{product?.categoryName ?? "Categoria nao informada"} / {product?.supplierName ?? "Fornecedor nao informado"}</small>
                    <div className="stock-row-indicators">
                        {nearMinimum && <span className="stock-mini-alert">Proximo do minimo</span>}
                        {stale && <span className="stock-mini-alert muted">Sem movimento recente</span>}
                        {soldQuantity > 0 && <span className="stock-mini-alert success">Mais vendido</span>}
                    </div>
                </div>
            </td>
            <td>
                <div className={`stock-quantity-badge ${status}`}>
                    <strong>{quantityBadge(stock)}</strong>
                    <span className="product-stock-bar" aria-hidden="true"><span style={{ width: `${stockPercent(stock)}%` }} /></span>
                </div>
            </td>
            <td>{stock.minQuantity.toLocaleString("pt-BR")} un</td>
            <td><StatusBadge label={meta.label} tone={meta.tone} /></td>
            <td>{displayValue(stock.location)}</td>
            <td>
                <div className="stock-date-cell">
                    <strong>{formatDate(stock.updatedAt)}</strong>
                    <span>{formatTime(stock.updatedAt)}</span>
                </div>
            </td>
            <td className="stock-money">{formatCurrency(inventoryValue)}</td>
            <td className="stock-actions-cell">
                <div className="table-actions stock-actions">
                    <button type="button" className="table-action-button tooltip-button" data-tooltip="Visualizar" title="Visualizar" aria-label={`Visualizar estoque de ${product?.name ?? "produto"}`} onClick={(event) => { event.stopPropagation(); onView(row); }}>
                        <Eye size={22} aria-hidden="true" />
                    </button>
                    {canEdit && (
                        <button type="button" className="table-action-button table-action-button--edit tooltip-button" data-tooltip="Editar" title="Editar" aria-label={`Editar estoque de ${product?.name ?? "produto"}`} onClick={(event) => { event.stopPropagation(); onEdit(row); }}>
                            <Pencil size={22} aria-hidden="true" />
                        </button>
                    )}
                    {canEdit && (
                        <button type="button" className="table-action-button tooltip-button" data-tooltip="Ajustar estoque" title="Ajustar estoque" aria-label={`Ajustar estoque de ${product?.name ?? "produto"}`} onClick={(event) => { event.stopPropagation(); onAdjust(row); }}>
                            <SlidersHorizontal size={22} aria-hidden="true" />
                        </button>
                    )}
                    <button type="button" className="table-action-button tooltip-button" data-tooltip="Historico" title="Historico" aria-label={`Historico de estoque de ${product?.name ?? "produto"}`} onClick={(event) => { event.stopPropagation(); onHistory(row); }}>
                        <History size={22} aria-hidden="true" />
                    </button>
                    {status !== "normal" && (
                        <button type="button" className="table-action-button tooltip-button" data-tooltip="Solicitar compra" title="Solicitar compra" aria-label={`Solicitar compra de ${product?.name ?? "produto"}`} onClick={(event) => { event.stopPropagation(); onRequestPurchase(row); }}>
                            <ClipboardList size={22} aria-hidden="true" />
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
});

export function StockList() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { stocks, movements, loading, error, setError, loadStock, loadMovements, createStock, updateStock } = useStock();
    const [products, setProducts] = useState<ProductResponse[]>([]);
    const [sales, setSales] = useState<SaleResponse[]>([]);
    const [appliedFilters, setAppliedFilters] = useState<StockFilters>(defaultStockFilters);
    const [draftFilters, setDraftFilters] = useState<StockFilters>(defaultStockFilters);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [isApplyingFilters, setIsApplyingFilters] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selectedStockId, setSelectedStockId] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [adjustmentMode, setAdjustmentMode] = useState<AdjustmentMode>("adjust");
    const [adjustingRow, setAdjustingRow] = useState<StockRow | null>(null);
    const [adjustmentForm, setAdjustmentForm] = useState<AdjustmentDraft>(initialAdjustment);
    const [viewingRow, setViewingRow] = useState<StockRow | null>(null);
    const [historyRow, setHistoryRow] = useState<StockRow | null>(null);
    const [showHistory, setShowHistory] = useState(false);

    const canEditStock = canManage(user?.role, ["ADMIN", "MANAGER", "STOCK"]);

    const loadData = useCallback(async () => {
        setError(null);
        try {
            const [productData, saleData] = await Promise.all([
                productService.list(true),
                saleService.list(),
                loadStock(),
                loadMovements(),
            ]);
            setProducts(productData);
            setSales(saleData);
        } catch (loadError) {
            setError(getApiErrorMessage(loadError, "Nao foi possivel carregar estoque."));
        }
    }, [loadMovements, loadStock, setError]);

    useEffect(() => {
        void loadData().catch(() => undefined);
    }, [loadData]);

    const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
    const soldQuantityByProductId = useMemo(() => {
        const totals = new Map<number, number>();
        for (const sale of sales) {
            if (sale.status === "CANCELADA") {
                continue;
            }
            for (const item of sale.items) {
                if (!item.productId) {
                    continue;
                }
                totals.set(item.productId, (totals.get(item.productId) ?? 0) + item.quantity);
            }
        }
        return totals;
    }, [sales]);

    const stockRows = useMemo<StockRow[]>(() => stocks.map((stock) => {
        const product = stock.productId ? productById.get(stock.productId) : undefined;
        return {
            stock,
            product,
            status: stockStatus(stock),
            inventoryValue: stock.quantity * (product?.costPrice ?? 0),
            soldQuantity: stock.productId ? soldQuantityByProductId.get(stock.productId) ?? 0 : 0,
        };
    }), [productById, soldQuantityByProductId, stocks]);

    const categories = useMemo(() => Array.from(new Set(stockRows.map((row) => row.product?.categoryName).filter(isPresent))).sort(), [stockRows]);
    const suppliers = useMemo(() => Array.from(new Set(stockRows.map((row) => row.product?.supplierName).filter(isPresent))).sort(), [stockRows]);
    const locations = useMemo(() => Array.from(new Set(stockRows.map((row) => row.stock.location).filter(isPresent))).sort(), [stockRows]);

    const stockSummary = useMemo(() => {
        const totalQuantity = stockRows.reduce((total, row) => total + row.stock.quantity, 0);
        const lowCount = stockRows.filter((row) => row.status === "low").length;
        const emptyCount = stockRows.filter((row) => row.status === "empty").length;
        const totalValue = stockRows.reduce((total, row) => total + row.inventoryValue, 0);
        return {
            totalProducts: products.length,
            totalQuantity,
            lowCount,
            emptyCount,
            totalValue,
        };
    }, [products.length, stockRows]);

    const filteredRows = useMemo(() => {
        const term = normalizeSearch(appliedFilters.search);
        return [...stockRows]
            .filter((row) => {
                const product = row.product;
                const searchable = [
                    product?.name,
                    product?.partNumber,
                    product?.barCode,
                    product?.categoryName,
                    product?.supplierName,
                    row.stock.location,
                    internalCode(product, row.stock),
                ].map(normalizeSearch);

                if (term && !searchable.some((value) => value.includes(term))) {
                    return false;
                }
                if (appliedFilters.categoryFilter !== "all" && product?.categoryName !== appliedFilters.categoryFilter) {
                    return false;
                }
                if (appliedFilters.supplierFilter !== "all" && product?.supplierName !== appliedFilters.supplierFilter) {
                    return false;
                }
                if (appliedFilters.statusFilter !== "all" && row.status !== appliedFilters.statusFilter) {
                    return false;
                }
                if (appliedFilters.locationFilter !== "all" && row.stock.location !== appliedFilters.locationFilter) {
                    return false;
                }
                return true;
            })
            .sort((left, right) => {
                if (appliedFilters.sortKey === "quantity") {
                    return left.stock.quantity - right.stock.quantity;
                }
                if (appliedFilters.sortKey === "updatedAt") {
                    return new Date(right.stock.updatedAt).getTime() - new Date(left.stock.updatedAt).getTime();
                }
                if (appliedFilters.sortKey === "stockDesc") {
                    return right.stock.quantity - left.stock.quantity;
                }
                if (appliedFilters.sortKey === "stockAsc") {
                    return left.stock.quantity - right.stock.quantity;
                }
                return (left.product?.name ?? "").localeCompare(right.product?.name ?? "", "pt-BR", { sensitivity: "base" });
            });
    }, [appliedFilters.categoryFilter, appliedFilters.locationFilter, appliedFilters.search, appliedFilters.sortKey, appliedFilters.statusFilter, appliedFilters.supplierFilter, stockRows]);

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

    const movementProductId = historyRow?.stock.productId ?? null;
    const filteredMovements = useMemo(() => {
        const list = movementProductId ? movements.filter((movement) => movement.product === movementProductId) : movements;
        return [...list].sort((left, right) => new Date(right.createdAt ?? 0).getTime() - new Date(left.createdAt ?? 0).getTime());
    }, [movementProductId, movements]);

    const preview = useMemo(() => {
        const currentQuantity = adjustmentMode === "create" ? 0 : adjustingRow?.stock.quantity ?? 0;
        const quantity = Math.max(0, Number(adjustmentForm.quantity) || 0);
        let newQuantity = quantity;

        if (adjustmentForm.type === "ENTRADA") {
            newQuantity = currentQuantity + quantity;
        } else if (adjustmentForm.type === "SAIDA") {
            newQuantity = Math.max(0, currentQuantity - quantity);
        }

        return {
            currentQuantity,
            newQuantity,
            difference: newQuantity - currentQuantity,
        };
    }, [adjustingRow?.stock.quantity, adjustmentForm.quantity, adjustmentForm.type, adjustmentMode]);

    function resetFilters() {
        setDraftFilters(defaultStockFilters);
        setAppliedFilters(defaultStockFilters);
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
            appliedFilters.categoryFilter !== defaultStockFilters.categoryFilter,
            appliedFilters.supplierFilter !== defaultStockFilters.supplierFilter,
            appliedFilters.statusFilter !== defaultStockFilters.statusFilter,
            appliedFilters.locationFilter !== defaultStockFilters.locationFilter,
            appliedFilters.sortKey !== defaultStockFilters.sortKey,
        ].filter(Boolean).length;
    }, [appliedFilters]);

    const draftActiveFilterCount = useMemo(() => {
        return [
            draftFilters.search.trim() !== "",
            draftFilters.categoryFilter !== defaultStockFilters.categoryFilter,
            draftFilters.supplierFilter !== defaultStockFilters.supplierFilter,
            draftFilters.statusFilter !== defaultStockFilters.statusFilter,
            draftFilters.locationFilter !== defaultStockFilters.locationFilter,
            draftFilters.sortKey !== defaultStockFilters.sortKey,
        ].filter(Boolean).length;
    }, [draftFilters]);

    const hasActiveFilters = activeFilterCount > 0;

    function openCreateModal() {
        setAdjustmentMode("create");
        setAdjustingRow(null);
        setFormError(null);
        setAdjustmentForm({
            ...initialAdjustment,
            productId: products[0]?.id ?? 0,
            type: "AJUSTE",
        });
    }

    function openEditModal(row: StockRow) {
        setAdjustmentMode("edit");
        setAdjustingRow(row);
        setSelectedStockId(row.stock.id);
        setFormError(null);
        setAdjustmentForm({
            productId: row.stock.productId ?? 0,
            type: "AJUSTE",
            quantity: row.stock.quantity,
            minQuantity: row.stock.minQuantity,
            location: row.stock.location ?? "",
            reason: "Atualizacao cadastral",
            supplier: row.product?.supplierName ?? "",
            notes: "",
        });
    }

    function openAdjustModal(row: StockRow) {
        setAdjustmentMode("adjust");
        setAdjustingRow(row);
        setSelectedStockId(row.stock.id);
        setFormError(null);
        setAdjustmentForm({
            productId: row.stock.productId ?? 0,
            type: "ENTRADA",
            quantity: 0,
            minQuantity: row.stock.minQuantity,
            location: row.stock.location ?? "",
            reason: "",
            supplier: row.product?.supplierName ?? "",
            notes: "",
        });
    }

    function closeAdjustmentModal() {
        if (submitting) {
            return;
        }
        setAdjustingRow(null);
        setFormError(null);
        setAdjustmentForm(initialAdjustment);
    }

    async function handleAdjustmentSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (adjustmentForm.productId <= 0) {
            setFormError("Selecione um produto.");
            return;
        }
        if (adjustmentForm.quantity < 0) {
            setFormError("Informe uma quantidade valida.");
            return;
        }
        if (adjustmentForm.type === "SAIDA" && preview.newQuantity < 0) {
            setFormError("A saida nao pode deixar estoque negativo.");
            return;
        }

        const request: StockRequest = {
            productId: adjustmentForm.productId,
            quantity: preview.newQuantity,
            minQuantity: Math.max(0, adjustmentForm.minQuantity),
            location: adjustmentForm.location.trim(),
        };

        setSubmitting(true);
        setFormError(null);
        try {
            if (adjustmentMode === "create") {
                await createStock(request);
            } else if (adjustingRow) {
                await updateStock(adjustingRow.stock.id, request);
            }
            const note = buildAdjustmentNote(adjustmentForm);
            toast.success(note ? `Estoque atualizado. ${note}` : "Estoque atualizado.");
            closeAdjustmentModal();
            await loadData();
        } catch (submitError) {
            setFormError(getApiErrorMessage(submitError, "Nao foi possivel salvar o ajuste de estoque."));
        } finally {
            setSubmitting(false);
        }
    }

    function openView(row: StockRow) {
        setSelectedStockId(row.stock.id);
        setViewingRow(row);
    }

    function openHistory(row?: StockRow) {
        if (row) {
            setSelectedStockId(row.stock.id);
            setHistoryRow(row);
        } else {
            setHistoryRow(null);
        }
        setShowHistory(true);
    }

    function handleRequestPurchase(row: StockRow) {
        toast.info(`Compra sugerida para ${row.product?.name ?? "produto selecionado"}.`);
        navigate("/purchases/new");
    }

    function exportPdf() {
        const headers = ["Produto", "Codigo", "Categoria", "Fornecedor", "Qtd.", "Minimo", "Status", "Local", "Valor"];
        const rows = filteredRows.map((row) => [
            row.product?.name ?? `Produto #${row.stock.productId ?? "-"}`,
            internalCode(row.product, row.stock),
            row.product?.categoryName ?? "",
            row.product?.supplierName ?? "",
            row.stock.quantity,
            row.stock.minQuantity,
            stockStatusMeta(row.status).label,
            row.stock.location ?? "",
            formatCurrency(row.inventoryValue),
        ]);
        const html = `<html><head><title>Estoque</title><style>body{font-family:Arial,sans-serif;color:#111827}table{width:100%;border-collapse:collapse}th,td{border:1px solid #d1d5db;padding:8px;font-size:12px}th{background:#e5e7eb;text-align:left}h1{font-size:20px}</style></head><body><h1>Relatorio de Estoque</h1><table><thead><tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;
        const win = window.open("", "_blank", "width=1024,height=768");
        if (!win) {
            toast.error("Nao foi possivel abrir a janela de PDF.");
            return;
        }
        win.document.write(html);
        win.document.close();
        win.focus();
        win.print();
    }

    return (
        <section className="page-section stock-page">
            <PageHeader
                eyebrow="Estoque"
                title="Estoque"
                description="Controle de produtos disponiveis e movimentacoes de estoque."
                action={(
                    <div className="stock-header-actions">
                        {canEditStock && (
                            <button type="button" className="primary-button" onClick={openCreateModal}>
                                <Plus size={20} aria-hidden="true" />
                                Novo Estoque
                            </button>
                        )}
                        <button type="button" className="secondary-button" onClick={() => openHistory()}>
                            <History size={18} aria-hidden="true" />
                            Movimentacoes
                        </button>
                    </div>
                )}
            />

            <div className="stock-metric-row">
                <div className="metric-card supplier-metric-card stock-metric-card">
                    <Package size={18} aria-hidden="true" />
                    <span>Total de Produtos</span>
                    <strong>{stockSummary.totalProducts.toLocaleString("pt-BR")}</strong>
                    <small>Produtos cadastrados</small>
                </div>
                <div className="metric-card supplier-metric-card stock-metric-card success">
                    <BarChart3 size={18} aria-hidden="true" />
                    <span>Itens em Estoque</span>
                    <strong>{stockSummary.totalQuantity.toLocaleString("pt-BR")}</strong>
                    <small>Unidades disponiveis</small>
                </div>
                <div className="metric-card supplier-metric-card stock-metric-card warning">
                    <AlertTriangle size={18} aria-hidden="true" />
                    <span>Baixo Estoque</span>
                    <strong>{stockSummary.lowCount.toLocaleString("pt-BR")}</strong>
                    <small>Abaixo do minimo</small>
                </div>
                <div className="metric-card supplier-metric-card stock-metric-card danger">
                    <XCircle size={18} aria-hidden="true" />
                    <span>Estoque Zerado</span>
                    <strong>{stockSummary.emptyCount.toLocaleString("pt-BR")}</strong>
                    <small>Sem unidades</small>
                </div>
                <div className="metric-card supplier-metric-card stock-metric-card">
                    <Coins size={18} aria-hidden="true" />
                    <span>Valor Total em Estoque</span>
                    <strong>{formatCurrency(stockSummary.totalValue)}</strong>
                    <small>Quantidade x custo</small>
                </div>
            </div>

            <FilterPanel
                search={draftFilters.search}
                searchPlaceholder="Pesquisar por produto, codigo ou numero da peca..."
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
                        {draftFilters.statusFilter !== "all" && <button type="button" onClick={() => setDraftFilters((current) => ({ ...current, statusFilter: "all" }))}>Situacao <X size={13} aria-hidden="true" /></button>}
                        {draftFilters.categoryFilter !== "all" && <button type="button" onClick={() => setDraftFilters((current) => ({ ...current, categoryFilter: "all" }))}>Categoria <X size={13} aria-hidden="true" /></button>}
                        {draftFilters.supplierFilter !== "all" && <button type="button" onClick={() => setDraftFilters((current) => ({ ...current, supplierFilter: "all" }))}>Fornecedor <X size={13} aria-hidden="true" /></button>}
                    </ActiveFilterChips>
                )}
            >
                <FilterSelect label="Ordenacao" value={draftFilters.sortKey} onChange={(sortKey) => setDraftFilters((current) => ({ ...current, sortKey }))} options={[
                    { value: "name", label: "Nome" },
                    { value: "quantity", label: "Quantidade" },
                    { value: "updatedAt", label: "Atualizacao" },
                    { value: "stockDesc", label: "Maior estoque" },
                    { value: "stockAsc", label: "Menor estoque" },
                ]} />
                <FilterSegmentedControl label="Situacao" value={draftFilters.statusFilter} onChange={(statusFilter) => setDraftFilters((current) => ({ ...current, statusFilter }))} options={[
                    { value: "all", label: "Todos" },
                    { value: "normal", label: "Normal" },
                    { value: "low", label: "Baixo" },
                    { value: "empty", label: "Zerado" },
                ]} />
                <FilterSelect label="Categoria" value={draftFilters.categoryFilter} onChange={(categoryFilter) => setDraftFilters((current) => ({ ...current, categoryFilter }))} options={[
                    { value: "all", label: "Todas" },
                    ...categories.map((category) => ({ value: category, label: category })),
                ]} />
                <FilterSelect label="Fornecedor" value={draftFilters.supplierFilter} onChange={(supplierFilter) => setDraftFilters((current) => ({ ...current, supplierFilter }))} options={[
                    { value: "all", label: "Todos" },
                    ...suppliers.map((supplier) => ({ value: supplier, label: supplier })),
                ]} />
                <FilterSelect label="Localizacao" value={draftFilters.locationFilter} onChange={(locationFilter) => setDraftFilters((current) => ({ ...current, locationFilter }))} options={[
                    { value: "all", label: "Todos" },
                    { value: "Prateleira A", label: "Prateleira A" },
                    { value: "Prateleira B", label: "Prateleira B" },
                    { value: "Deposito", label: "Deposito" },
                    ...locations.filter((location) => !["Prateleira A", "Prateleira B", "Deposito"].includes(location)).map((location) => ({ value: location, label: location })),
                ]} />
                <section className="client-filter-group garage-filter-field">
                    <h3>Acoes</h3>
                    <div className="stock-filter-actions">
                        <button type="button" className="secondary-button" onClick={exportPdf}>
                            <Download size={18} aria-hidden="true" />
                            PDF
                        </button>
                        <button type="button" className="secondary-button" onClick={() => void loadData()}>
                            <RotateCw size={18} aria-hidden="true" />
                            Atualizar
                        </button>
                    </div>
                </section>
            </FilterPanel>

            {error && (
                <div className="form-error stock-error">
                    <span>{error}</span>
                    <button type="button" className="secondary-button" onClick={() => void loadData()}>Tentar novamente</button>
                </div>
            )}

            {loading ? (
                <StockSkeleton />
            ) : filteredRows.length === 0 ? (
                <EmptyState
                    message={hasActiveFilters ? "Nenhum item em estoque encontrado com os filtros atuais." : "Nenhum produto encontrado."}
                    description={hasActiveFilters ? "Ajuste os campos ou limpe os filtros para ampliar a busca." : "Ajuste a pesquisa ou cadastre um item de estoque."}
                    actionLabel={hasActiveFilters ? "Limpar filtros" : canEditStock ? "Novo Estoque" : undefined}
                    onAction={hasActiveFilters ? resetFilters : canEditStock ? openCreateModal : undefined}
                />
            ) : (
                <>
                    <FilterResultSummary total={filteredRows.length} noun="itens em estoque" hasActiveFilters={hasActiveFilters} />
                    <div className="table-wrap stock-table-wrap">
                        <table className="data-table stock-table">
                            <thead>
                                <tr>
                                    <th>Produto</th>
                                    <th>Quantidade</th>
                                    <th>Minimo</th>
                                    <th>Status</th>
                                    <th>Local</th>
                                    <th>Ultima Atualizacao</th>
                                    <th>Valor em Estoque</th>
                                    <th>Acoes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedRows.map((row) => (
                                    <StockTableRow
                                        key={row.stock.id}
                                        row={row}
                                        selected={selectedStockId === row.stock.id}
                                        canEdit={canEditStock}
                                        onView={openView}
                                        onEdit={openEditModal}
                                        onAdjust={openAdjustModal}
                                        onHistory={openHistory}
                                        onRequestPurchase={handleRequestPurchase}
                                    />
                                ))}
                            </tbody>
                        </table>
                        <StockPagination
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

                    <div className="stock-card-list">
                        {paginatedRows.map((row) => {
                            const meta = stockStatusMeta(row.status);
                            return (
                                <article key={row.stock.id} className={`stock-mobile-card stock-mobile-card--${row.status}`}>
                                    <div className="stock-mobile-card__header">
                                        <div>
                                            <strong>{row.product?.name ?? `Produto #${row.stock.productId ?? "-"}`}</strong>
                                            <span>{internalCode(row.product, row.stock)}</span>
                                        </div>
                                        <StatusBadge label={meta.label} tone={meta.tone} />
                                    </div>
                                    <dl>
                                        <div><dt>Categoria</dt><dd>{row.product?.categoryName ?? "Nao informado"}</dd></div>
                                        <div><dt>Fornecedor</dt><dd>{row.product?.supplierName ?? "Nao informado"}</dd></div>
                                        <div><dt>Quantidade</dt><dd>{row.stock.quantity.toLocaleString("pt-BR")} un</dd></div>
                                        <div><dt>Minimo</dt><dd>{row.stock.minQuantity.toLocaleString("pt-BR")} un</dd></div>
                                        <div><dt>Local</dt><dd>{displayValue(row.stock.location)}</dd></div>
                                        <div><dt>Valor</dt><dd>{formatCurrency(row.inventoryValue)}</dd></div>
                                    </dl>
                                    <div className="table-actions stock-actions">
                                        <button type="button" className="table-action-button tooltip-button" data-tooltip="Visualizar" aria-label="Visualizar estoque" onClick={() => openView(row)}><Eye size={22} aria-hidden="true" /></button>
                                        {canEditStock && <button type="button" className="table-action-button table-action-button--edit tooltip-button" data-tooltip="Editar" aria-label="Editar estoque" onClick={() => openEditModal(row)}><Pencil size={22} aria-hidden="true" /></button>}
                                        {canEditStock && <button type="button" className="table-action-button tooltip-button" data-tooltip="Ajustar estoque" aria-label="Ajustar estoque" onClick={() => openAdjustModal(row)}><SlidersHorizontal size={22} aria-hidden="true" /></button>}
                                        <button type="button" className="table-action-button tooltip-button" data-tooltip="Historico" aria-label="Historico de estoque" onClick={() => openHistory(row)}><History size={22} aria-hidden="true" /></button>
                                    </div>
                                </article>
                            );
                        })}
                        <StockPagination
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

            {(adjustmentMode === "create" || adjustingRow) && (
                <AdjustmentModal
                    mode={adjustmentMode}
                    row={adjustingRow}
                    products={products}
                    suppliers={suppliers}
                    form={adjustmentForm}
                    setForm={setAdjustmentForm}
                    preview={preview}
                    loading={submitting}
                    error={formError}
                    onSubmit={handleAdjustmentSubmit}
                    onCancel={closeAdjustmentModal}
                />
            )}

            {viewingRow && (
                <StockDetailModal row={viewingRow} onClose={() => setViewingRow(null)} onAdjust={canEditStock ? openAdjustModal : undefined} />
            )}

            {showHistory && (
                <StockHistoryDrawer
                    row={historyRow}
                    movements={filteredMovements}
                    products={productById}
                    onClose={() => { setShowHistory(false); setHistoryRow(null); }}
                />
            )}
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

function StockPagination({ pageStart, pageEnd, total, pageSize, setPageSize, currentPage, totalPages, visiblePages, setPage }: PaginationProps) {
    return (
        <div className="supplier-pagination stock-pagination">
            <span>Exibindo {pageStart}-{pageEnd} de {total.toLocaleString("pt-BR")} registros</span>
            <label>
                Itens por pagina
                <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
                    {[10, 20, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
                </select>
            </label>
            <div className="supplier-pagination__pages" aria-label="Paginacao de estoque">
                <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={currentPage === 1}>&lt;</button>
                {visiblePages.map((pageNumber) => (
                    <button key={pageNumber} type="button" className={pageNumber === currentPage ? "active" : undefined} onClick={() => setPage(pageNumber)}>{pageNumber}</button>
                ))}
                <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={currentPage === totalPages}>&gt;</button>
            </div>
        </div>
    );
}

interface AdjustmentModalProps {
    mode: AdjustmentMode;
    row: StockRow | null;
    products: ProductResponse[];
    suppliers: string[];
    form: AdjustmentDraft;
    setForm: Dispatch<SetStateAction<AdjustmentDraft>>;
    preview: { currentQuantity: number; newQuantity: number; difference: number };
    loading: boolean;
    error: string | null;
    onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
    onCancel: () => void;
}

function AdjustmentModal({ mode, row, products, suppliers, form, setForm, preview, loading, error, onSubmit, onCancel }: AdjustmentModalProps) {
    const title = mode === "create" ? "Novo Estoque" : mode === "edit" ? "Editar Estoque" : "Ajustar Estoque";
    const selectedProduct = products.find((product) => product.id === form.productId);

    return (
        <div className="modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
            <form className="stock-adjust-modal" role="dialog" aria-modal="true" aria-label={title} onSubmit={onSubmit} noValidate>
                <div className="supplier-detail-modal__header">
                    <div>
                        <span>{title}</span>
                        <h2>{selectedProduct?.name ?? row?.product?.name ?? "Produto"}</h2>
                    </div>
                    <button type="button" className="table-action-button tooltip-button" aria-label="Fechar ajuste" title="Fechar" data-tooltip="Fechar" onClick={onCancel} disabled={loading}>
                        <X size={19} aria-hidden="true" />
                    </button>
                </div>

                <div className="stock-adjust-preview">
                    <div><span>Estoque Atual</span><strong>{preview.currentQuantity.toLocaleString("pt-BR")} un</strong></div>
                    <div><span>Novo Estoque</span><strong>{preview.newQuantity.toLocaleString("pt-BR")} un</strong></div>
                    <div><span>Diferenca</span><strong className={preview.difference < 0 ? "danger" : preview.difference > 0 ? "success" : undefined}>{preview.difference.toLocaleString("pt-BR")} un</strong></div>
                </div>

                <div className="form-grid">
                    <label className="form-field span-2">
                        <span>Produto</span>
                        <select value={form.productId} onChange={(event) => setForm((current) => ({ ...current, productId: Number(event.target.value) }))} disabled={mode !== "create" || loading}>
                            <option value={0}>Selecione</option>
                            {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                        </select>
                    </label>
                    <label className="form-field">
                        <span>Tipo</span>
                        <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as StockMovementType }))} disabled={loading}>
                            <option value="ENTRADA">Entrada</option>
                            <option value="SAIDA">Saida</option>
                            <option value="AJUSTE">Ajuste</option>
                        </select>
                    </label>
                    <label className="form-field">
                        <span>Quantidade</span>
                        <input type="number" min="0" value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: Number(event.target.value) }))} disabled={loading} />
                    </label>
                    <label className="form-field">
                        <span>Quantidade minima</span>
                        <input type="number" min="0" value={form.minQuantity} onChange={(event) => setForm((current) => ({ ...current, minQuantity: Number(event.target.value) }))} disabled={loading} />
                    </label>
                    <label className="form-field">
                        <span>Localizacao</span>
                        <input value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} placeholder="Prateleira A-03" disabled={loading} />
                    </label>
                    <label className="form-field">
                        <span>Motivo</span>
                        <input value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} placeholder="Compra, venda, ajuste manual..." disabled={loading} />
                    </label>
                    <label className="form-field">
                        <span>Fornecedor</span>
                        <select value={form.supplier} onChange={(event) => setForm((current) => ({ ...current, supplier: event.target.value }))} disabled={loading}>
                            <option value="">Opcional</option>
                            {suppliers.map((supplier) => <option key={supplier} value={supplier}>{supplier}</option>)}
                        </select>
                    </label>
                    <label className="form-field span-2">
                        <span>Observacoes</span>
                        <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} disabled={loading} />
                    </label>
                </div>

                {error && <div className="form-error">{error}</div>}
                <div className="form-actions stock-modal-actions">
                    <button type="button" className="secondary-button" onClick={onCancel} disabled={loading}>Cancelar</button>
                    <button type="submit" className="primary-button" disabled={loading}>{loading ? "Salvando..." : "Salvar Ajuste"}</button>
                </div>
            </form>
        </div>
    );
}

function StockDetailModal({ row, onClose, onAdjust }: { row: StockRow; onClose: () => void; onAdjust?: (row: StockRow) => void }) {
    const meta = stockStatusMeta(row.status);

    return (
        <div className="modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
            <aside className="product-detail-modal stock-detail-modal" role="dialog" aria-modal="true" aria-label="Visualizar estoque">
                <div className="supplier-detail-modal__header">
                    <div>
                        <span>Visualizar Estoque</span>
                        <h2>{row.product?.name ?? `Produto #${row.stock.productId ?? "-"}`}</h2>
                    </div>
                    <button type="button" className="table-action-button tooltip-button" aria-label="Fechar detalhes" title="Fechar" data-tooltip="Fechar" onClick={onClose}>
                        <X size={19} aria-hidden="true" />
                    </button>
                </div>
                <dl className="supplier-detail-grid product-detail-grid">
                    <div><dt>Status</dt><dd><StatusBadge label={meta.label} tone={meta.tone} /></dd></div>
                    <div><dt>Quantidade</dt><dd>{row.stock.quantity.toLocaleString("pt-BR")} un</dd></div>
                    <div><dt>Minimo</dt><dd>{row.stock.minQuantity.toLocaleString("pt-BR")} un</dd></div>
                    <div><dt>Codigo da peca</dt><dd>{internalCode(row.product, row.stock)}</dd></div>
                    <div><dt>Categoria</dt><dd>{row.product?.categoryName ?? "Nao informado"}</dd></div>
                    <div><dt>Fornecedor</dt><dd>{row.product?.supplierName ?? "Nao informado"}</dd></div>
                    <div><dt>Local</dt><dd>{displayValue(row.stock.location)}</dd></div>
                    <div><dt>Valor em estoque</dt><dd>{formatCurrency(row.inventoryValue)}</dd></div>
                    <div><dt>Ultima atualizacao</dt><dd>{formatDateTime(row.stock.updatedAt)}</dd></div>
                </dl>
                {row.status !== "normal" && <p className="stock-detail-warning"><AlertTriangle size={18} aria-hidden="true" /> Item exige atencao de reposicao.</p>}
                {onAdjust && <button type="button" className="primary-button" onClick={() => { onClose(); onAdjust(row); }}>Ajustar Estoque</button>}
            </aside>
        </div>
    );
}

function StockHistoryDrawer({ row, movements, products, onClose }: { row: StockRow | null; movements: StockMovementDTO[]; products: Map<number, ProductResponse>; onClose: () => void }) {
    return (
        <div className="supplier-drawer-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
            <aside className="supplier-detail-drawer stock-history-drawer" role="dialog" aria-modal="true" aria-label="Historico de movimentacoes">
                <div className="supplier-detail-modal__header">
                    <div>
                        <span>Historico</span>
                        <h2>{row?.product?.name ?? "Movimentacoes de estoque"}</h2>
                    </div>
                    <button type="button" className="table-action-button tooltip-button" aria-label="Fechar historico" title="Fechar" data-tooltip="Fechar" onClick={onClose}>
                        <X size={19} aria-hidden="true" />
                    </button>
                </div>
                {movements.length === 0 ? (
                    <EmptyState message="Nenhuma movimentacao encontrada." description="As entradas, saidas e ajustes aparecerao aqui." />
                ) : (
                    <div className="stock-history-list">
                        {movements.map((movement, index) => {
                            const product = movement.product ? products.get(movement.product) : undefined;
                            return (
                                <article key={`${movement.product}-${movement.type}-${movement.createdAt ?? index}`} className="stock-history-item">
                                    <div>
                                        <strong>{product?.name ?? `Produto #${movement.product ?? "-"}`}</strong>
                                        <StatusBadge label={movement.type} />
                                    </div>
                                    <dl>
                                        <div><dt>Data</dt><dd>{formatDateTime(movement.createdAt)}</dd></div>
                                        <div><dt>Usuario</dt><dd>{movement.employee ? `Funcionario #${movement.employee}` : "Nao informado"}</dd></div>
                                        <div><dt>Quantidade</dt><dd>{movement.quantity?.toLocaleString("pt-BR") ?? "Nao informado"} un</dd></div>
                                        <div><dt>Estoque anterior</dt><dd>Nao informado</dd></div>
                                        <div><dt>Novo estoque</dt><dd>Nao informado</dd></div>
                                        <div><dt>Motivo</dt><dd>{displayValue(movement.reason)}</dd></div>
                                        <div><dt>Documento relacionado</dt><dd>{movement.type === "ENTRADA" ? "Compra" : movement.type === "SAIDA" ? "Venda" : "Ajuste manual"}</dd></div>
                                    </dl>
                                </article>
                            );
                        })}
                    </div>
                )}
            </aside>
        </div>
    );
}

function StockSkeleton() {
    return (
        <div className="table-wrap stock-skeleton" aria-label="Carregando estoque">
            {Array.from({ length: 8 }, (_, index) => (
                <div key={index} className="client-skeleton-row">
                    <span />
                    <span />
                    <span />
                    <span />
                </div>
            ))}
        </div>
    );
}

export default StockList;
