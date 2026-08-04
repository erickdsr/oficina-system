import { memo, useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Ban,
    CheckCircle2,
    Clock,
    Copy,
    DollarSign,
    Eye,
    Pencil,
    Plus,
    Printer,
    ReceiptText,
    RefreshCw,
    ShoppingCart,
    TrendingUp,
    X,
} from "lucide-react";
import { ActiveFilterChips, FilterPanel, FilterResultSummary, FilterSegmentedControl, FilterSelect } from "../../components/common/FilterPanel";
import PageHeader from "../../components/common/PageHeader";
import { useAuth } from "../../context/auth.context";
import { getApiErrorMessage } from "../../services/api";
import clientService from "../../services/client.service";
import paymentMethodService from "../../services/payment-method.service";
import productService from "../../services/product.service";
import useSale from "../../hooks/useSale";
import type { ClientListItem } from "../../types/client.types";
import type { PaymentMethod } from "../../types/payment-method.types";
import type { ProductResponse } from "../../types/product.types";
import type { SaleRequest, SaleResponse, SaleStatus } from "../../types/sale.types";
import { displayValue, formatCpfCnpj, formatCurrency } from "../../utils/formatters";
import { canManage } from "../../utils/permissions";
import { normalizeSearch } from "../../utils/text";

type SaleStatusFilter = "all" | SaleStatus | "EM_ANDAMENTO";
type SalePaymentFilter = "all" | "pix" | "dinheiro" | "credito" | "debito" | "boleto";
type SalePeriodFilter = "all" | "today" | "week" | "month" | "custom";
type SaleActionLoading = { id: number; action: "finalize" | "cancel" | "duplicate" } | null;

interface SaleFilters {
    search: string;
    statusFilter: SaleStatusFilter;
    paymentFilter: SalePaymentFilter;
    periodFilter: SalePeriodFilter;
    customStart: string;
    customEnd: string;
}

const defaultSaleFilters: SaleFilters = {
    search: "",
    statusFilter: "all",
    paymentFilter: "all",
    periodFilter: "all",
    customStart: "",
    customEnd: "",
};

interface SaleRow {
    sale: SaleResponse;
    client?: ClientListItem;
    itemCount: number;
    productNames: string[];
    paymentNames: string[];
}

interface SaleTableRowProps {
    row: SaleRow;
    canEdit: boolean;
    actionLoading: SaleActionLoading;
    onView: (sale: SaleResponse) => void;
    onEdit: (sale: SaleResponse) => void;
    onReceipt: (sale: SaleResponse) => void;
    onFinalize: (sale: SaleResponse) => void;
    onCancel: (sale: SaleResponse) => void;
    onDuplicate: (sale: SaleResponse) => void;
}

function saleNumber(sale: SaleResponse) {
    return `VEN-${String(sale.id).padStart(6, "0")}`;
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

function dateKey(value?: string | null) {
    if (!value) {
        return "";
    }

    const date = new Date(value);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isWithinPeriod(value: string, period: SalePeriodFilter, start: string, end: string) {
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
        return time >= startOfToday - 29 * 86_400_000;
    }

    const startTime = start ? new Date(`${start}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY;
    const endTime = end ? new Date(`${end}T23:59:59`).getTime() : Number.POSITIVE_INFINITY;
    return time >= startTime && time <= endTime;
}

function statusMeta(status: string) {
    const normalized = status.toUpperCase();
    if (normalized === "FINALIZADA") {
        return { label: "Finalizada", tone: "success" };
    }
    if (normalized === "PENDENTE") {
        return { label: "Pendente", tone: "warning" };
    }
    if (normalized === "CANCELADA") {
        return { label: "Cancelada", tone: "danger" };
    }
    return { label: "Em andamento", tone: "info" };
}

function SaleStatusBadge({ status }: { status: string }) {
    const meta = statusMeta(status);
    return <span className={`status-badge sale-status-badge ${meta.tone}`}>{meta.label}</span>;
}

function paymentTone(name: string) {
    const normalized = normalizeSearch(name);
    if (normalized.includes("pix")) {
        return "pix";
    }
    if (normalized.includes("credito") || normalized.includes("debito") || normalized.includes("cartao")) {
        return "card";
    }
    if (normalized.includes("dinheiro")) {
        return "cash";
    }
    if (normalized.includes("boleto")) {
        return "boleto";
    }
    return "muted";
}

function paymentLabel(names: string[]) {
    if (names.length === 0) {
        return "Nao informado";
    }
    if (names.length > 1) {
        return "Multiplo";
    }
    return names[0];
}

function paymentMatchesFilter(names: string[], filter: SalePaymentFilter) {
    if (filter === "all") {
        return true;
    }

    return names.some((name) => {
        const normalized = normalizeSearch(name);
        if (filter === "pix") {
            return normalized.includes("pix");
        }
        if (filter === "dinheiro") {
            return normalized.includes("dinheiro");
        }
        if (filter === "credito") {
            return normalized.includes("credito") || normalized.includes("cartao credito");
        }
        if (filter === "debito") {
            return normalized.includes("debito") || normalized.includes("cartao debito");
        }
        return normalized.includes("boleto");
    });
}

const SaleTableRow = memo(function SaleTableRow({
    row,
    canEdit,
    actionLoading,
    onView,
    onEdit,
    onReceipt,
    onFinalize,
    onCancel,
    onDuplicate,
}: SaleTableRowProps) {
    const { sale, client, itemCount, productNames, paymentNames } = row;
    const canChangeSale = canEdit && sale.status === "PENDENTE";
    const isActionLoading = actionLoading?.id === sale.id;
    const payment = paymentLabel(paymentNames);

    return (
        <tr className={`sale-row sale-row--${sale.status.toLowerCase()}`} onClick={() => onView(sale)}>
            <td>
                <div className="sale-number-cell">
                    <strong>{saleNumber(sale)}</strong>
                    <span>#{sale.id}</span>
                </div>
            </td>
            <td>
                <div className="sale-client-cell">
                    <strong>{sale.clientName ?? client?.name ?? "Cliente nao informado"}</strong>
                    <span>{client?.clientType === "PJ" ? "CNPJ" : "CPF"}</span>
                    <small>{formatCpfCnpj(client?.cpfCnpj)}</small>
                </div>
            </td>
            <td>{displayValue(sale.employeeName)}</td>
            <td>
                <span className="sale-items-cell" title={productNames.join("\n") || "Itens nao informados"}>
                    {itemCount.toLocaleString("pt-BR")} {itemCount === 1 ? "produto" : "produtos"}
                </span>
            </td>
            <td><span className={`sale-payment-badge ${paymentTone(payment)}`}>{payment}</span></td>
            <td><SaleStatusBadge status={sale.status} /></td>
            <td className="sale-total-cell">{formatCurrency(sale.total)}</td>
            <td>
                <div className="stock-date-cell">
                    <strong>{formatDate(sale.createdAt)}</strong>
                    <span>{formatTime(sale.createdAt)}</span>
                </div>
            </td>
            <td className="sale-actions-cell">
                <div className="table-actions sale-actions">
                    <button type="button" className="table-action-button tooltip-button" data-tooltip="Visualizar" title="Visualizar" aria-label={`Visualizar venda ${saleNumber(sale)}`} onClick={(event) => { event.stopPropagation(); onView(sale); }}>
                        <Eye size={22} strokeWidth={2.3} aria-hidden="true" />
                    </button>
                    {canChangeSale && (
                        <button type="button" className="table-action-button table-action-button--edit tooltip-button" data-tooltip="Editar" title="Editar" aria-label={`Editar venda ${saleNumber(sale)}`} onClick={(event) => { event.stopPropagation(); onEdit(sale); }}>
                            <Pencil size={22} strokeWidth={2.3} aria-hidden="true" />
                        </button>
                    )}
                    <button type="button" className="table-action-button tooltip-button" data-tooltip="Comprovante" title="Emitir comprovante" aria-label={`Emitir comprovante da venda ${saleNumber(sale)}`} onClick={(event) => { event.stopPropagation(); onReceipt(sale); }}>
                        <ReceiptText size={22} strokeWidth={2.3} aria-hidden="true" />
                    </button>
                    {canChangeSale && (
                        <button type="button" className="table-action-button tooltip-button" data-tooltip="Finalizar venda" title="Finalizar venda" aria-label={`Finalizar venda ${saleNumber(sale)}`} disabled={isActionLoading} onClick={(event) => { event.stopPropagation(); onFinalize(sale); }}>
                            <CheckCircle2 size={22} strokeWidth={2.3} aria-hidden="true" />
                        </button>
                    )}
                    {canChangeSale && (
                        <button type="button" className="table-action-button tooltip-button" data-tooltip="Cancelar" title="Cancelar venda" aria-label={`Cancelar venda ${saleNumber(sale)}`} disabled={isActionLoading} onClick={(event) => { event.stopPropagation(); onCancel(sale); }}>
                            <Ban size={22} strokeWidth={2.3} aria-hidden="true" />
                        </button>
                    )}
                    {canEdit && (
                        <button type="button" className="table-action-button tooltip-button" data-tooltip="Duplicar" title="Duplicar venda" aria-label={`Duplicar venda ${saleNumber(sale)}`} disabled={isActionLoading} onClick={(event) => { event.stopPropagation(); onDuplicate(sale); }}>
                            <Copy size={22} strokeWidth={2.3} aria-hidden="true" />
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
});

export function SaleList() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { sales, loading, error, loadSales, finalizeSale, cancelSale, createSale } = useSale();
    const [clients, setClients] = useState<ClientListItem[]>([]);
    const [products, setProducts] = useState<ProductResponse[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [metadataLoading, setMetadataLoading] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState<SaleFilters>(defaultSaleFilters);
    const [draftFilters, setDraftFilters] = useState<SaleFilters>(defaultSaleFilters);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [isApplyingFilters, setIsApplyingFilters] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selectedSale, setSelectedSale] = useState<SaleResponse | null>(null);
    const [actionLoading, setActionLoading] = useState<SaleActionLoading>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    const canEditSale = canManage(user?.role, ["ADMIN", "MANAGER", "SALESPERSON"]);

    const loadData = useCallback(async () => {
        setMetadataLoading(true);
        setActionError(null);
        try {
            const [saleData, clientData, productData, paymentData] = await Promise.all([
                loadSales(),
                clientService.list(true),
                productService.list(true),
                paymentMethodService.list(),
            ]);
            setClients(clientData);
            setProducts(productData);
            setPaymentMethods(paymentData);
            return saleData;
        } catch (loadError) {
            setActionError(getApiErrorMessage(loadError, "Nao foi possivel carregar os dados de vendas."));
            throw loadError;
        } finally {
            setMetadataLoading(false);
        }
    }, [loadSales]);

    useEffect(() => {
        void loadData().catch(() => undefined);
    }, [loadData]);

    const clientById = useMemo(() => new Map(clients.map((client) => [client.id, client])), [clients]);
    const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
    const paymentById = useMemo(() => new Map(paymentMethods.map((method) => [method.id, method])), [paymentMethods]);

    const saleRows = useMemo<SaleRow[]>(() => sales.map((sale) => ({
        sale,
        client: sale.clientId ? clientById.get(sale.clientId) : undefined,
        itemCount: sale.items.reduce((sum, item) => sum + item.quantity, 0),
        productNames: sale.items.map((item) => item.productId ? productById.get(item.productId)?.name ?? `Produto #${item.productId}` : "Produto sem cadastro"),
        paymentNames: sale.payments.map((payment) => paymentById.get(payment.paymentMethodId)?.name ?? `Metodo #${payment.paymentMethodId}`),
    })), [clientById, paymentById, productById, sales]);

    const todayKey = dateKey(new Date().toISOString());
    const saleStats = useMemo(() => {
        const todaySales = sales.filter((sale) => dateKey(sale.createdAt) === todayKey);
        const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
        const pending = sales.filter((sale) => sale.status === "PENDENTE").length;

        return {
            todayCount: todaySales.length,
            todayRevenue,
            averageTicket: todaySales.length > 0 ? todayRevenue / todaySales.length : 0,
            pending,
        };
    }, [sales, todayKey]);

    const filteredRows = useMemo(() => {
        const term = normalizeSearch(appliedFilters.search);

        return [...saleRows]
            .filter((row) => {
                const { sale, client, productNames, paymentNames } = row;
                const searchable = [
                    sale.id,
                    saleNumber(sale),
                    sale.clientName,
                    client?.cpfCnpj,
                    sale.employeeName,
                    sale.status,
                    sale.notes,
                    ...productNames,
                    ...paymentNames,
                ].map((value) => normalizeSearch(String(value ?? "")));

                if (term && !searchable.some((value) => value.includes(term))) {
                    return false;
                }
                if (appliedFilters.statusFilter !== "all" && sale.status !== appliedFilters.statusFilter) {
                    return false;
                }
                if (!paymentMatchesFilter(paymentNames, appliedFilters.paymentFilter)) {
                    return false;
                }
                if (!isWithinPeriod(sale.createdAt, appliedFilters.periodFilter, appliedFilters.customStart, appliedFilters.customEnd)) {
                    return false;
                }
                return true;
            })
            .sort((left, right) => new Date(right.sale.createdAt).getTime() - new Date(left.sale.createdAt).getTime());
    }, [appliedFilters.customEnd, appliedFilters.customStart, appliedFilters.paymentFilter, appliedFilters.periodFilter, appliedFilters.search, appliedFilters.statusFilter, saleRows]);

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
        setDraftFilters(defaultSaleFilters);
        setAppliedFilters(defaultSaleFilters);
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
            appliedFilters.statusFilter !== defaultSaleFilters.statusFilter,
            appliedFilters.paymentFilter !== defaultSaleFilters.paymentFilter,
            appliedFilters.periodFilter !== defaultSaleFilters.periodFilter,
            appliedFilters.customStart !== "" || appliedFilters.customEnd !== "",
        ].filter(Boolean).length;
    }, [appliedFilters]);

    const draftActiveFilterCount = useMemo(() => {
        return [
            draftFilters.search.trim() !== "",
            draftFilters.statusFilter !== defaultSaleFilters.statusFilter,
            draftFilters.paymentFilter !== defaultSaleFilters.paymentFilter,
            draftFilters.periodFilter !== defaultSaleFilters.periodFilter,
            draftFilters.customStart !== "" || draftFilters.customEnd !== "",
        ].filter(Boolean).length;
    }, [draftFilters]);

    const hasActiveFilters = activeFilterCount > 0;

    function printReceipt() {
        window.print();
    }

    async function runSaleAction(sale: SaleResponse, action: "finalize" | "cancel" | "duplicate") {
        setActionLoading({ id: sale.id, action });
        setActionError(null);
        try {
            if (action === "finalize") {
                await finalizeSale(sale.id);
            } else if (action === "cancel") {
                await cancelSale(sale.id);
            } else {
                const payload: SaleRequest = {
                    clientId: sale.clientId ?? 0,
                    employeeId: user?.employeeId ?? sale.employeeId ?? 0,
                    discount: sale.discount,
                    notes: sale.notes ? `Duplicada da ${saleNumber(sale)} - ${sale.notes}` : `Duplicada da ${saleNumber(sale)}`,
                    items: sale.items.map((item) => ({ ...item })),
                    payments: sale.payments.map((payment) => ({ ...payment })),
                };
                const duplicated = await createSale(payload);
                navigate(`/sales/${duplicated.id}`);
                return;
            }
            await loadData();
        } catch (saleActionError) {
            setActionError(getApiErrorMessage(saleActionError, "Nao foi possivel atualizar a venda."));
        } finally {
            setActionLoading(null);
        }
    }

    const selectedRow = selectedSale ? saleRows.find((row) => row.sale.id === selectedSale.id) : undefined;

    return (
        <section className="page-section sale-page">
            <PageHeader
                eyebrow="Vendas"
                title="Vendas"
                description="Gerencie todas as vendas realizadas pelo sistema."
                action={(
                    <div className="sale-header-actions">
                        {canEditSale && (
                            <Link className="primary-button link-button" to="/sales/new">
                                <Plus size={20} aria-hidden="true" />
                                Nova Venda
                            </Link>
                        )}
                        <Link className="secondary-button link-button" to="/stock/movements">
                            <RefreshCw size={18} aria-hidden="true" />
                            Movimentacoes
                        </Link>
                    </div>
                )}
            />

            <div className="supplier-stats-row sale-metric-row">
                <div className="metric-card supplier-metric-card sale-metric-card">
                    <ShoppingCart size={18} aria-hidden="true" />
                    <span>Vendas Hoje</span>
                    <strong>{saleStats.todayCount.toLocaleString("pt-BR")} vendas</strong>
                </div>
                <div className="metric-card supplier-metric-card sale-metric-card success">
                    <DollarSign size={18} aria-hidden="true" />
                    <span>Faturamento Hoje</span>
                    <strong>{formatCurrency(saleStats.todayRevenue)}</strong>
                </div>
                <div className="metric-card supplier-metric-card sale-metric-card">
                    <TrendingUp size={18} aria-hidden="true" />
                    <span>Ticket Medio</span>
                    <strong>{formatCurrency(saleStats.averageTicket)}</strong>
                </div>
                <div className={`metric-card supplier-metric-card sale-metric-card${saleStats.pending > 0 ? " warning" : ""}`}>
                    <Clock size={18} aria-hidden="true" />
                    <span>Pedidos Pendentes</span>
                    <strong>{saleStats.pending.toLocaleString("pt-BR")} pedidos</strong>
                </div>
            </div>

            <FilterPanel
                search={draftFilters.search}
                searchPlaceholder="Pesquisar por numero, cliente ou vendedor..."
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
                        {draftFilters.statusFilter !== "all" && <button type="button" onClick={() => setDraftFilters((current) => ({ ...current, statusFilter: "all" }))}>{draftFilters.statusFilter} <X size={13} aria-hidden="true" /></button>}
                        {draftFilters.paymentFilter !== "all" && <button type="button" onClick={() => setDraftFilters((current) => ({ ...current, paymentFilter: "all" }))}>Pagamento <X size={13} aria-hidden="true" /></button>}
                        {draftFilters.periodFilter !== "all" && <button type="button" onClick={() => setDraftFilters((current) => ({ ...current, periodFilter: "all", customStart: "", customEnd: "" }))}>Periodo <X size={13} aria-hidden="true" /></button>}
                    </ActiveFilterChips>
                )}
            >
                <FilterSegmentedControl label="Status" value={draftFilters.statusFilter} onChange={(statusFilter) => setDraftFilters((current) => ({ ...current, statusFilter }))} options={[
                    { value: "all", label: "Todas" },
                    { value: "PENDENTE", label: "Pendentes" },
                    { value: "FINALIZADA", label: "Finalizadas" },
                    { value: "CANCELADA", label: "Canceladas" },
                ]} />
                <FilterSelect label="Pagamento" value={draftFilters.paymentFilter} onChange={(paymentFilter) => setDraftFilters((current) => ({ ...current, paymentFilter }))} options={[
                    { value: "all", label: "Todas" },
                    { value: "pix", label: "Pix" },
                    { value: "dinheiro", label: "Dinheiro" },
                    { value: "credito", label: "Cartao credito" },
                    { value: "debito", label: "Cartao debito" },
                    { value: "boleto", label: "Boleto" },
                ]} />
                <FilterSelect label="Periodo" value={draftFilters.periodFilter} onChange={(periodFilter) => setDraftFilters((current) => ({ ...current, periodFilter }))} options={[
                    { value: "all", label: "Todas" },
                    { value: "today", label: "Hoje" },
                    { value: "week", label: "Ultimos 7 dias" },
                    { value: "month", label: "30 dias" },
                    { value: "custom", label: "Personalizado" },
                ]} />
                {draftFilters.periodFilter === "custom" && (
                    <>
                        <section className="client-filter-group garage-filter-field">
                            <h3>Inicio</h3>
                            <div className="client-input-wrap"><input type="date" value={draftFilters.customStart} onChange={(event) => setDraftFilters((current) => ({ ...current, customStart: event.target.value }))} /></div>
                        </section>
                        <section className="client-filter-group garage-filter-field">
                            <h3>Fim</h3>
                            <div className="client-input-wrap"><input type="date" value={draftFilters.customEnd} onChange={(event) => setDraftFilters((current) => ({ ...current, customEnd: event.target.value }))} /></div>
                        </section>
                    </>
                )}
            </FilterPanel>

            {(error || actionError) && <div className="form-error">{error ?? actionError}</div>}

            {loading || metadataLoading ? <SaleSkeleton /> : filteredRows.length === 0 ? (
                <div className="empty-state sale-empty-state">
                    <div className="empty-state__icon" aria-hidden="true">
                        <ShoppingCart size={24} />
                    </div>
                    <strong>{hasActiveFilters ? "Nenhuma venda encontrada com os filtros atuais." : "Nenhuma venda encontrada"}</strong>
                    <span>{hasActiveFilters ? "Ajuste os campos ou limpe os filtros para ampliar a busca." : "Comece registrando sua primeira venda."}</span>
                    {hasActiveFilters ? (
                        <button type="button" className="secondary-button" onClick={resetFilters}>Limpar filtros</button>
                    ) : canEditSale && (
                        <button type="button" className="primary-button" onClick={() => navigate("/sales/new")}>
                            <Plus size={20} aria-hidden="true" />
                            Nova Venda
                        </button>
                    )}
                </div>
            ) : (
                <>
                    <FilterResultSummary total={filteredRows.length} noun="vendas" hasActiveFilters={hasActiveFilters} />
                    <div className="table-wrap sale-table-wrap">
                        <table className="data-table sale-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Cliente</th>
                                    <th>Funcionario</th>
                                    <th>Itens</th>
                                    <th>Forma de pagamento</th>
                                    <th>Status</th>
                                    <th>Total</th>
                                    <th>Data</th>
                                    <th>Acoes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedRows.map((row) => (
                                    <SaleTableRow
                                        key={row.sale.id}
                                        row={row}
                                        canEdit={canEditSale}
                                        actionLoading={actionLoading}
                                        onView={setSelectedSale}
                                        onEdit={(sale) => navigate(`/sales/${sale.id}`)}
                                        onReceipt={(sale) => { setSelectedSale(sale); window.setTimeout(printReceipt, 80); }}
                                        onFinalize={(sale) => void runSaleAction(sale, "finalize")}
                                        onCancel={(sale) => void runSaleAction(sale, "cancel")}
                                        onDuplicate={(sale) => void runSaleAction(sale, "duplicate")}
                                    />
                                ))}
                            </tbody>
                        </table>
                        <SalePagination
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

                    <div className="sale-card-list">
                        {paginatedRows.map((row) => (
                            <article key={row.sale.id} className="purchase-mobile-card sale-mobile-card">
                                <div className="purchase-mobile-card__header">
                                    <div>
                                        <strong>{saleNumber(row.sale)}</strong>
                                        <span>{row.sale.clientName ?? "Cliente nao informado"}</span>
                                    </div>
                                    <SaleStatusBadge status={row.sale.status} />
                                </div>
                                <dl>
                                    <div><dt>Documento</dt><dd>{formatCpfCnpj(row.client?.cpfCnpj)}</dd></div>
                                    <div><dt>Funcionario</dt><dd>{displayValue(row.sale.employeeName)}</dd></div>
                                    <div><dt>Itens</dt><dd>{row.itemCount.toLocaleString("pt-BR")}</dd></div>
                                    <div><dt>Pagamento</dt><dd>{paymentLabel(row.paymentNames)}</dd></div>
                                    <div><dt>Total</dt><dd>{formatCurrency(row.sale.total)}</dd></div>
                                    <div><dt>Data</dt><dd>{formatDate(row.sale.createdAt)} {formatTime(row.sale.createdAt)}</dd></div>
                                </dl>
                                <div className="table-actions sale-actions">
                                    <button type="button" className="table-action-button tooltip-button" data-tooltip="Visualizar" aria-label="Visualizar venda" onClick={() => setSelectedSale(row.sale)}><Eye size={22} aria-hidden="true" /></button>
                                    {canEditSale && row.sale.status === "PENDENTE" && <button type="button" className="table-action-button table-action-button--edit tooltip-button" data-tooltip="Editar" aria-label="Editar venda" onClick={() => navigate(`/sales/${row.sale.id}`)}><Pencil size={22} aria-hidden="true" /></button>}
                                    <button type="button" className="table-action-button tooltip-button" data-tooltip="Comprovante" aria-label="Emitir comprovante" onClick={() => { setSelectedSale(row.sale); window.setTimeout(printReceipt, 80); }}><ReceiptText size={22} aria-hidden="true" /></button>
                                    {canEditSale && row.sale.status === "PENDENTE" && <button type="button" className="table-action-button tooltip-button" data-tooltip="Finalizar venda" aria-label="Finalizar venda" onClick={() => void runSaleAction(row.sale, "finalize")}><CheckCircle2 size={22} aria-hidden="true" /></button>}
                                    {canEditSale && row.sale.status === "PENDENTE" && <button type="button" className="table-action-button tooltip-button" data-tooltip="Cancelar" aria-label="Cancelar venda" onClick={() => void runSaleAction(row.sale, "cancel")}><Ban size={22} aria-hidden="true" /></button>}
                                    {canEditSale && <button type="button" className="table-action-button tooltip-button" data-tooltip="Duplicar" aria-label="Duplicar venda" onClick={() => void runSaleAction(row.sale, "duplicate")}><Copy size={22} aria-hidden="true" /></button>}
                                </div>
                            </article>
                        ))}
                        <SalePagination
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

            {selectedSale && selectedRow && (
                <SaleDetailModal row={selectedRow} onClose={() => setSelectedSale(null)} onPrint={printReceipt} />
            )}
        </section>
    );
}

interface SaleDetailModalProps {
    row: SaleRow;
    onClose: () => void;
    onPrint: () => void;
}

function SaleDetailModal({ row, onClose, onPrint }: SaleDetailModalProps) {
    const { sale, client, productNames, paymentNames } = row;
    const itemsTotal = sale.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const finalTotal = Math.max(0, sale.total);

    return (
        <div className="modal-overlay sale-modal-overlay" role="presentation" onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
                onClose();
            }
        }}>
            <aside className="product-detail-modal sale-detail-modal" role="dialog" aria-modal="true" aria-label="Visualizar venda">
                <div className="supplier-detail-modal__header">
                    <div>
                        <span>Dados da venda</span>
                        <h2>{saleNumber(sale)}</h2>
                    </div>
                    <button type="button" className="table-action-button tooltip-button" aria-label="Fechar detalhes" title="Fechar" data-tooltip="Fechar" onClick={onClose}>
                        <X size={19} aria-hidden="true" />
                    </button>
                </div>

                <dl className="supplier-detail-grid product-detail-grid sale-detail-grid">
                    <div><dt>Cliente</dt><dd>{sale.clientName ?? client?.name ?? "-"}</dd></div>
                    <div><dt>Funcionario</dt><dd>{displayValue(sale.employeeName)}</dd></div>
                    <div><dt>Forma de pagamento</dt><dd>{paymentLabel(paymentNames)}</dd></div>
                    <div><dt>Status</dt><dd><SaleStatusBadge status={sale.status} /></dd></div>
                    <div><dt>Data</dt><dd>{formatDate(sale.createdAt)} {formatTime(sale.createdAt)}</dd></div>
                    <div><dt>Documento</dt><dd>{formatCpfCnpj(client?.cpfCnpj)}</dd></div>
                    <div><dt>Subtotal</dt><dd>{formatCurrency(itemsTotal)}</dd></div>
                    <div><dt>Desconto</dt><dd>{formatCurrency(sale.discount)}</dd></div>
                    <div><dt>Valor final</dt><dd>{formatCurrency(finalTotal)}</dd></div>
                    <div className="span-2"><dt>Observacoes</dt><dd>{sale.notes?.trim() || "-"}</dd></div>
                </dl>

                <div className="table-wrap sale-modal-table-wrap">
                    <table className="data-table sale-modal-table">
                        <thead>
                            <tr>
                                <th>Produto</th>
                                <th>Quantidade</th>
                                <th>Valor unitario</th>
                                <th>Subtotal</th>
                                <th>Desconto</th>
                                <th>Valor final</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sale.items.map((item, index) => {
                                const grossSubtotal = item.quantity * item.unitPrice;
                                return (
                                    <tr key={`${item.productId}-${index}`}>
                                        <td>{productNames[index] ?? `Produto #${item.productId ?? "-"}`}</td>
                                        <td>{item.quantity}</td>
                                        <td>{formatCurrency(item.unitPrice)}</td>
                                        <td>{formatCurrency(grossSubtotal)}</td>
                                        <td>{formatCurrency(item.discount)}</td>
                                        <td>{formatCurrency(item.subtotal)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="form-actions sale-detail-actions">
                    <button type="button" className="primary-button" onClick={onPrint}>
                        <Printer size={18} aria-hidden="true" />
                        Imprimir comprovante
                    </button>
                </div>
            </aside>
        </div>
    );
}

function SaleSkeleton() {
    return (
        <div className="sale-skeleton" aria-label="Carregando vendas">
            <div className="home-skeleton card" />
            <div className="home-skeleton panel" />
        </div>
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

function SalePagination({ pageStart, pageEnd, total, pageSize, setPageSize, currentPage, totalPages, visiblePages, setPage }: PaginationProps) {
    return (
        <div className="supplier-pagination sale-pagination">
            <span>Mostrando {pageStart}-{pageEnd} de {total.toLocaleString("pt-BR")} vendas</span>
            <label>
                <select aria-label="Registros por pagina" value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
                    {[10, 20, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
                </select>
            </label>
            <div className="supplier-pagination__pages" aria-label="Paginacao de vendas">
                <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={currentPage === 1}>Anterior</button>
                {visiblePages.map((pageNumber) => (
                    <button key={pageNumber} type="button" className={pageNumber === currentPage ? "active" : undefined} onClick={() => setPage(pageNumber)}>{pageNumber}</button>
                ))}
                <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={currentPage === totalPages}>Proximo</button>
            </div>
        </div>
    );
}

export default SaleList;
