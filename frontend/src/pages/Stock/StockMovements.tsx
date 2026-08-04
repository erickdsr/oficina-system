import { memo, useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowDownCircle,
    ArrowUpCircle,
    Clock,
    Download,
    Eye,
    FileSpreadsheet,
    Package,
    PackageSearch,
    Plus,
    Printer,
    X,
} from "lucide-react";
import { ActiveFilterChips, FilterPanel, FilterResultSummary, FilterSegmentedControl, FilterSelect } from "../../components/common/FilterPanel";
import PageHeader from "../../components/common/PageHeader";
import { getApiErrorMessage } from "../../services/api";
import employeeService from "../../services/employee.service";
import productService from "../../services/product.service";
import useStock from "../../hooks/useStock";
import type { Employee } from "../../types/employee.types";
import type { ProductResponse } from "../../types/product.types";
import type { StockMovementDTO, StockMovementType } from "../../types/stock.types";
import { normalizeSearch } from "../../utils/text";

type MovementTypeFilter = "all" | StockMovementType | "TRANSFERENCIA" | "PERDA" | "DEVOLUCAO";
type MovementPeriodFilter = "all" | "today" | "week" | "month" | "custom";
type MovementOriginFilter = "all" | "COMPRA" | "VENDA" | "AJUSTE" | "DEVOLUCAO" | "TRANSFERENCIA" | "INVENTARIO";
type MovementSortKey = "date" | "product" | "type" | "quantity" | "previousBalance" | "currentBalance" | "origin" | "employee" | "reason";
type SortDirection = "asc" | "desc";

interface MovementFilters {
    search: string;
    typeFilter: MovementTypeFilter;
    productFilter: string;
    employeeFilter: string;
    periodFilter: MovementPeriodFilter;
    originFilter: MovementOriginFilter;
    customStart: string;
    customEnd: string;
    sortKey: MovementSortKey;
    sortDirection: SortDirection;
}

const defaultMovementFilters: MovementFilters = {
    search: "",
    typeFilter: "all",
    productFilter: "all",
    employeeFilter: "all",
    periodFilter: "all",
    originFilter: "all",
    customStart: "",
    customEnd: "",
    sortKey: "date",
    sortDirection: "desc",
};

function loadStoredMovementFilters(): MovementFilters {
    const storedPeriod = localStorage.getItem("garageos.movements.period") as MovementPeriodFilter | null;
    const migratedPeriodDefault = localStorage.getItem("garageos.movements.periodDefaultMigrated") === "true";
    const periodFilter: MovementPeriodFilter = !migratedPeriodDefault && storedPeriod === "today"
        ? defaultMovementFilters.periodFilter
        : storedPeriod && ["all", "today", "week", "month", "custom"].includes(storedPeriod)
        ? storedPeriod
        : defaultMovementFilters.periodFilter;
    localStorage.setItem("garageos.movements.periodDefaultMigrated", "true");

    return {
        ...defaultMovementFilters,
        search: localStorage.getItem("garageos.movements.search") ?? "",
        typeFilter: (localStorage.getItem("garageos.movements.type") as MovementTypeFilter | null) ?? "all",
        productFilter: localStorage.getItem("garageos.movements.product") ?? "all",
        employeeFilter: localStorage.getItem("garageos.movements.employee") ?? "all",
        periodFilter,
        originFilter: (localStorage.getItem("garageos.movements.origin") as MovementOriginFilter | null) ?? "all",
        customStart: localStorage.getItem("garageos.movements.start") ?? "",
        customEnd: localStorage.getItem("garageos.movements.end") ?? "",
    };
}

interface MovementRow {
    movement: StockMovementDTO;
    product?: ProductResponse;
    employee?: Employee;
    origin: MovementOriginFilter;
    originLabel: string;
    relatedDocument: string;
    displayReason: string;
    previousBalance: number | null;
    currentBalance: number | null;
}

interface MovementTableRowProps {
    row: MovementRow;
    selected: boolean;
    onView: (row: MovementRow) => void;
    onPrint: (row: MovementRow) => void;
    onExport: (row: MovementRow) => void;
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

function isWithinPeriod(value: string | undefined, period: MovementPeriodFilter, start: string, end: string) {
    if (!value) {
        return false;
    }
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

function minutesSince(value?: string | null) {
    if (!value) {
        return "Sem registro";
    }

    const diff = Math.max(0, Date.now() - new Date(value).getTime());
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1) {
        return "Agora";
    }
    if (minutes < 60) {
        return `Ha ${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `Ha ${hours} ${hours === 1 ? "hora" : "horas"}`;
    }
    const days = Math.floor(hours / 24);
    return `Ha ${days} ${days === 1 ? "dia" : "dias"}`;
}

function movementNumber(row: MovementRow) {
    const id = row.movement.id ?? row.movement.product ?? 0;
    return `MOV-${String(id).padStart(6, "0")}`;
}

function initials(name?: string | null) {
    const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
        return "--";
    }
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

function signedQuantity(type: StockMovementType, quantity: number) {
    if (type === "SAIDA") {
        return `-${quantity.toLocaleString("pt-BR")}`;
    }
    return `+${quantity.toLocaleString("pt-BR")}`;
}

function movementTypeLabel(type: string) {
    if (type === "ENTRADA") {
        return "Entrada";
    }
    if (type === "SAIDA") {
        return "Saida";
    }
    if (type === "AJUSTE") {
        return "Ajuste";
    }
    if (type === "TRANSFERENCIA") {
        return "Transferencia";
    }
    if (type === "PERDA") {
        return "Perda";
    }
    if (type === "DEVOLUCAO") {
        return "Devolucao";
    }
    return type;
}

function typeTone(type: string) {
    if (type === "ENTRADA") {
        return "success";
    }
    if (type === "SAIDA") {
        return "danger";
    }
    if (type === "AJUSTE") {
        return "warning";
    }
    if (type === "TRANSFERENCIA") {
        return "info";
    }
    if (type === "DEVOLUCAO") {
        return "purple";
    }
    return "dark";
}

function originFromReason(reason?: string | null, type?: string): Pick<MovementRow, "origin" | "originLabel" | "relatedDocument" | "displayReason"> {
    const value = reason ?? "";
    const normalized = normalizeSearch(value);
    const numberMatch = value.match(/#\s*(\d+)/);
    const number = numberMatch?.[1];

    if (normalized.includes("compra")) {
        return {
            origin: "COMPRA",
            originLabel: number ? `Compra #${number}` : "Compra",
            relatedDocument: number ? `Compra #${number}` : "Compra",
            displayReason: number ? `Recebimento da Compra #${number}` : "Recebimento de compra",
        };
    }
    if (normalized.includes("venda")) {
        return {
            origin: type === "ENTRADA" ? "DEVOLUCAO" : "VENDA",
            originLabel: number ? `Venda #${number}` : "Venda",
            relatedDocument: number ? `Venda #${number}` : "Venda",
            displayReason: type === "ENTRADA" && number ? `Devolucao da Venda #${number}` : number ? `Venda #${number} finalizada` : "Venda finalizada",
        };
    }
    if (normalized.includes("inventario")) {
        return { origin: "INVENTARIO", originLabel: "Inventario", relatedDocument: "Inventario", displayReason: "Inventario de estoque" };
    }
    if (normalized.includes("transfer")) {
        return { origin: "TRANSFERENCIA", originLabel: "Transferencia", relatedDocument: "Transferencia", displayReason: "Transferencia entre estoques" };
    }
    if (normalized.includes("devol")) {
        return { origin: "DEVOLUCAO", originLabel: "Devolucao", relatedDocument: "Devolucao", displayReason: "Devolucao ao estoque" };
    }

    return {
        origin: "AJUSTE",
        originLabel: "Ajuste Manual",
        relatedDocument: "Ajuste Manual",
        displayReason: value.trim() || "Ajuste manual de estoque",
    };
}

function OriginBadge({ origin, label }: { origin: MovementOriginFilter; label: string }) {
    return <span className={`movement-origin-badge ${origin.toLowerCase()}`}>{label}</span>;
}

function MovementTypeBadge({ type }: { type: string }) {
    return <span className={`status-badge movement-type-badge ${typeTone(type)}`}>{movementTypeLabel(type)}</span>;
}

const MovementTableRow = memo(function MovementTableRow({ row, selected, onView, onPrint, onExport }: MovementTableRowProps) {
    const { movement, product, employee } = row;

    return (
        <tr className={`movement-row${selected ? " movement-row--selected" : ""}`} onClick={() => onView(row)}>
            <td>
                <div className="stock-date-cell">
                    <strong>{formatDate(movement.createdAt)}</strong>
                    <span>{formatTime(movement.createdAt)}</span>
                </div>
            </td>
            <td>
                <div className="movement-product-cell">
                    <strong>{product?.name ?? `Produto #${movement.product ?? "-"}`}</strong>
                    <span>{product?.partNumber || "-"}</span>
                    <small>{product?.categoryName ?? "Categoria nao informada"}</small>
                </div>
            </td>
            <td><MovementTypeBadge type={movement.type} /></td>
            <td className={`movement-quantity-cell ${movement.type === "SAIDA" ? "negative" : "positive"}`}>{signedQuantity(movement.type, movement.quantity)}</td>
            <td>{row.previousBalance ?? "-"}</td>
            <td>{row.currentBalance ?? "-"}</td>
            <td><OriginBadge origin={row.origin} label={row.originLabel} /></td>
            <td>
                <div className="movement-employee-cell">
                    <span>{initials(employee?.name)}</span>
                    <div>
                        <strong>{employee?.name ?? `Funcionario #${movement.employee ?? "-"}`}</strong>
                        <small>{employee?.roleName ?? "Cargo nao informado"}</small>
                    </div>
                </div>
            </td>
            <td><span className="movement-reason-cell">{row.displayReason}</span></td>
            <td className="movement-actions-cell">
                <div className="table-actions movement-actions">
                    <button type="button" className="table-action-button tooltip-button" data-tooltip="Visualizar" title="Visualizar" aria-label={`Visualizar movimentacao ${movementNumber(row)}`} onClick={(event) => { event.stopPropagation(); onView(row); }}>
                        <Eye size={22} strokeWidth={2.3} aria-hidden="true" />
                    </button>
                    <button type="button" className="table-action-button tooltip-button" data-tooltip="Imprimir" title="Imprimir" aria-label={`Imprimir movimentacao ${movementNumber(row)}`} onClick={(event) => { event.stopPropagation(); onPrint(row); }}>
                        <Printer size={22} strokeWidth={2.3} aria-hidden="true" />
                    </button>
                    <button type="button" className="table-action-button tooltip-button" data-tooltip="Exportar" title="Exportar" aria-label={`Exportar movimentacao ${movementNumber(row)}`} onClick={(event) => { event.stopPropagation(); onExport(row); }}>
                        <Download size={22} strokeWidth={2.3} aria-hidden="true" />
                    </button>
                </div>
            </td>
        </tr>
    );
});

export function StockMovements() {
    const navigate = useNavigate();
    const { movements, loading, error, setError, loadMovements } = useStock();
    const [products, setProducts] = useState<ProductResponse[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [metadataLoading, setMetadataLoading] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState<MovementFilters>(() => loadStoredMovementFilters());
    const [draftFilters, setDraftFilters] = useState<MovementFilters>(() => loadStoredMovementFilters());
    const [isApplyingFilters, setIsApplyingFilters] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selectedRow, setSelectedRow] = useState<MovementRow | null>(null);

    const loadData = useCallback(async () => {
        setMetadataLoading(true);
        setError(null);
        try {
            const [productData, employeeData] = await Promise.all([
                productService.list(true),
                employeeService.list(true),
                loadMovements(),
            ]).then(([productsData, employeesData]) => [productsData, employeesData] as const);
            setProducts(productData);
            setEmployees(employeeData);
        } catch (loadError) {
            setError(getApiErrorMessage(loadError, "Nao foi possivel carregar movimentacoes."));
        } finally {
            setMetadataLoading(false);
        }
    }, [loadMovements, setError]);

    useEffect(() => {
        void loadData().catch(() => undefined);
    }, [loadData]);

    useEffect(() => {
        localStorage.setItem("garageos.movements.search", appliedFilters.search);
        localStorage.setItem("garageos.movements.type", appliedFilters.typeFilter);
        localStorage.setItem("garageos.movements.product", appliedFilters.productFilter);
        localStorage.setItem("garageos.movements.employee", appliedFilters.employeeFilter);
        localStorage.setItem("garageos.movements.period", appliedFilters.periodFilter);
        localStorage.setItem("garageos.movements.origin", appliedFilters.originFilter);
        localStorage.setItem("garageos.movements.start", appliedFilters.customStart);
        localStorage.setItem("garageos.movements.end", appliedFilters.customEnd);
    }, [appliedFilters]);

    const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
    const employeeById = useMemo(() => new Map(employees.map((employee) => [employee.id, employee])), [employees]);

    const rows = useMemo<MovementRow[]>(() => movements.map((movement) => {
        const product = movement.product ? productById.get(movement.product) : undefined;
        const employee = movement.employee ? employeeById.get(movement.employee) : undefined;
        const origin = originFromReason(movement.reason, movement.type);
        const previousBalance = movement.previousBalance ?? null;
        const currentBalance = movement.currentBalance ?? null;
        return { movement, product, employee, previousBalance, currentBalance, ...origin };
    }), [employeeById, movements, productById]);

    const todayKey = dateKey(new Date().toISOString());
    const stats = useMemo(() => {
        const todayRows = rows.filter((row) => dateKey(row.movement.createdAt) === todayKey);
        const entries = todayRows.filter((row) => row.movement.type === "ENTRADA").length;
        const exits = todayRows.filter((row) => row.movement.type === "SAIDA").length;
        const movedProducts = new Set(rows.map((row) => row.movement.product).filter(Boolean)).size;
        const lastMovement = [...rows].sort((left, right) => new Date(right.movement.createdAt ?? 0).getTime() - new Date(left.movement.createdAt ?? 0).getTime())[0];
        return { entries, exits, movedProducts, lastMovement };
    }, [rows, todayKey]);

    const filteredRows = useMemo(() => {
        const term = normalizeSearch(appliedFilters.search);
        return [...rows]
            .filter((row) => {
                const { movement, product, employee } = row;
                const searchable = [
                    movementNumber(row),
                    movement.type,
                    row.originLabel,
                    row.relatedDocument,
                    row.displayReason,
                    movement.reason,
                    product?.name,
                    product?.partNumber,
                    product?.categoryName,
                    employee?.name,
                    employee?.roleName,
                ].map((value) => normalizeSearch(String(value ?? "")));

                if (term && !searchable.some((value) => value.includes(term))) {
                    return false;
                }
                if (appliedFilters.typeFilter !== "all" && movement.type !== appliedFilters.typeFilter) {
                    return false;
                }
                if (appliedFilters.productFilter !== "all" && String(movement.product ?? "") !== appliedFilters.productFilter) {
                    return false;
                }
                if (appliedFilters.employeeFilter !== "all" && String(movement.employee ?? "") !== appliedFilters.employeeFilter) {
                    return false;
                }
                if (appliedFilters.originFilter !== "all" && row.origin !== appliedFilters.originFilter) {
                    return false;
                }
                return isWithinPeriod(movement.createdAt, appliedFilters.periodFilter, appliedFilters.customStart, appliedFilters.customEnd);
            })
            .sort((left, right) => {
                const direction = appliedFilters.sortDirection === "asc" ? 1 : -1;
                let comparison: number;
                if (appliedFilters.sortKey === "date") {
                    comparison = new Date(left.movement.createdAt ?? 0).getTime() - new Date(right.movement.createdAt ?? 0).getTime();
                } else if (appliedFilters.sortKey === "product") {
                    comparison = (left.product?.name ?? "").localeCompare(right.product?.name ?? "", "pt-BR", { sensitivity: "base" });
                } else if (appliedFilters.sortKey === "type") {
                    comparison = left.movement.type.localeCompare(right.movement.type);
                } else if (appliedFilters.sortKey === "quantity") {
                    comparison = left.movement.quantity - right.movement.quantity;
                } else if (appliedFilters.sortKey === "previousBalance") {
                    comparison = (left.previousBalance ?? -1) - (right.previousBalance ?? -1);
                } else if (appliedFilters.sortKey === "currentBalance") {
                    comparison = (left.currentBalance ?? -1) - (right.currentBalance ?? -1);
                } else if (appliedFilters.sortKey === "origin") {
                    comparison = left.originLabel.localeCompare(right.originLabel, "pt-BR", { sensitivity: "base" });
                } else if (appliedFilters.sortKey === "employee") {
                    comparison = (left.employee?.name ?? "").localeCompare(right.employee?.name ?? "", "pt-BR", { sensitivity: "base" });
                } else {
                    comparison = left.displayReason.localeCompare(right.displayReason, "pt-BR", { sensitivity: "base" });
                }
                return comparison * direction;
            });
    }, [appliedFilters.customEnd, appliedFilters.customStart, appliedFilters.employeeFilter, appliedFilters.originFilter, appliedFilters.periodFilter, appliedFilters.productFilter, appliedFilters.search, appliedFilters.sortDirection, appliedFilters.sortKey, appliedFilters.typeFilter, rows]);

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

    function toggleSort(key: MovementSortKey) {
        if (appliedFilters.sortKey === key) {
            const sortDirection = appliedFilters.sortDirection === "asc" ? "desc" : "asc";
            setAppliedFilters((current) => ({ ...current, sortDirection }));
            setDraftFilters((current) => ({ ...current, sortDirection }));
            return;
        }
        const sortDirection = key === "date" ? "desc" : "asc";
        setAppliedFilters((current) => ({ ...current, sortKey: key, sortDirection }));
        setDraftFilters((current) => ({ ...current, sortKey: key, sortDirection }));
    }

    function sortIndicator(key: MovementSortKey) {
        if (appliedFilters.sortKey !== key) {
            return "";
        }
        const sortDirection = appliedFilters.sortDirection;
        return sortDirection === "asc" ? " ↑" : " ↓";
    }

    function resetFilters() {
        setDraftFilters(defaultMovementFilters);
        setAppliedFilters(defaultMovementFilters);
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
            appliedFilters.typeFilter !== defaultMovementFilters.typeFilter,
            appliedFilters.productFilter !== defaultMovementFilters.productFilter,
            appliedFilters.employeeFilter !== defaultMovementFilters.employeeFilter,
            appliedFilters.periodFilter !== defaultMovementFilters.periodFilter,
            appliedFilters.originFilter !== defaultMovementFilters.originFilter,
            appliedFilters.customStart !== "" || appliedFilters.customEnd !== "",
            appliedFilters.sortKey !== defaultMovementFilters.sortKey || appliedFilters.sortDirection !== defaultMovementFilters.sortDirection,
        ].filter(Boolean).length;
    }, [appliedFilters]);

    const draftActiveFilterCount = useMemo(() => {
        return [
            draftFilters.search.trim() !== "",
            draftFilters.typeFilter !== defaultMovementFilters.typeFilter,
            draftFilters.productFilter !== defaultMovementFilters.productFilter,
            draftFilters.employeeFilter !== defaultMovementFilters.employeeFilter,
            draftFilters.periodFilter !== defaultMovementFilters.periodFilter,
            draftFilters.originFilter !== defaultMovementFilters.originFilter,
            draftFilters.customStart !== "" || draftFilters.customEnd !== "",
            draftFilters.sortKey !== defaultMovementFilters.sortKey || draftFilters.sortDirection !== defaultMovementFilters.sortDirection,
        ].filter(Boolean).length;
    }, [draftFilters]);

    const hasActiveFilters = activeFilterCount > 0;

    function toExportRows(exportRows: MovementRow[]) {
        return exportRows.map((row) => ({
            id: movementNumber(row),
            data: formatDate(row.movement.createdAt),
            hora: formatTime(row.movement.createdAt),
            produto: row.product?.name ?? `Produto #${row.movement.product ?? ""}`,
            codigo: row.product?.partNumber ?? "",
            categoria: row.product?.categoryName ?? "",
            tipo: movementTypeLabel(row.movement.type),
            quantidade: signedQuantity(row.movement.type, row.movement.quantity),
            saldoAnterior: row.previousBalance ?? "",
            saldoAtual: row.currentBalance ?? "",
            origem: row.originLabel,
            responsavel: row.employee?.name ?? "",
            cargo: row.employee?.roleName ?? "",
            motivo: row.displayReason,
        }));
    }

    function downloadCsv(exportRows: MovementRow[], filename: string) {
        const rowsToExport = toExportRows(exportRows);
        const headers = Object.keys(rowsToExport[0] ?? { id: "", data: "", hora: "", produto: "", codigo: "", categoria: "", tipo: "", quantidade: "", saldoAnterior: "", saldoAtual: "", origem: "", responsavel: "", cargo: "", motivo: "" });
        const csv = [
            headers.join(";"),
            ...rowsToExport.map((row) => headers.map((header) => `"${String(row[header as keyof typeof row]).replace(/"/g, '""')}"`).join(";")),
        ].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }

    function exportExcel() {
        downloadCsv(filteredRows, "historico-movimentacoes.xls");
    }

    function exportSelected(row: MovementRow) {
        downloadCsv([row], `${movementNumber(row)}.csv`);
    }

    return (
        <section className="page-section movements-page">
            <PageHeader
                eyebrow="Estoque"
                title="Movimentacoes"
                description="Acompanhe todas as entradas, saidas e ajustes de estoque realizados no sistema."
                action={(
                    <div className="stock-header-actions movements-header-actions">
                        <button type="button" className="secondary-button" onClick={() => downloadCsv(filteredRows, "historico-movimentacoes.csv")}>
                            <Download size={18} aria-hidden="true" />
                            Exportar Historico
                        </button>
                        <button type="button" className="primary-button" onClick={() => navigate("/stock")}>
                            <Plus size={20} aria-hidden="true" />
                            Nova Movimentacao
                        </button>
                    </div>
                )}
            />

            <div className="supplier-stats-row movements-metric-row">
                <div className="metric-card supplier-metric-card movements-metric-card success">
                    <ArrowDownCircle size={18} aria-hidden="true" />
                    <span>Entradas Hoje</span>
                    <strong>{stats.entries.toLocaleString("pt-BR")} movimentacoes</strong>
                </div>
                <div className="metric-card supplier-metric-card movements-metric-card danger">
                    <ArrowUpCircle size={18} aria-hidden="true" />
                    <span>Saidas Hoje</span>
                    <strong>{stats.exits.toLocaleString("pt-BR")} movimentacoes</strong>
                </div>
                <div className="metric-card supplier-metric-card movements-metric-card">
                    <Package size={18} aria-hidden="true" />
                    <span>Produtos Movimentados</span>
                    <strong>{stats.movedProducts.toLocaleString("pt-BR")} produtos</strong>
                </div>
                <div className="metric-card supplier-metric-card movements-metric-card">
                    <Clock size={18} aria-hidden="true" />
                    <span>Ultima Movimentacao</span>
                    <strong>{minutesSince(stats.lastMovement?.movement.createdAt)}</strong>
                </div>
            </div>

            <FilterPanel
                search={draftFilters.search}
                searchPlaceholder="Pesquisar por produto, documento ou responsavel..."
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
                        {draftFilters.typeFilter !== "all" && <button type="button" onClick={() => setDraftFilters((current) => ({ ...current, typeFilter: "all" }))}>Tipo <X size={13} aria-hidden="true" /></button>}
                        {draftFilters.originFilter !== "all" && <button type="button" onClick={() => setDraftFilters((current) => ({ ...current, originFilter: "all" }))}>Origem <X size={13} aria-hidden="true" /></button>}
                        {draftFilters.productFilter !== "all" && <button type="button" onClick={() => setDraftFilters((current) => ({ ...current, productFilter: "all" }))}>Produto <X size={13} aria-hidden="true" /></button>}
                    </ActiveFilterChips>
                )}
            >
                <FilterSelect label="Ordenacao" value={draftFilters.sortKey} onChange={(sortKey) => setDraftFilters((current) => ({ ...current, sortKey }))} options={[
                    { value: "date", label: "Data" },
                    { value: "product", label: "Produto" },
                    { value: "type", label: "Tipo" },
                    { value: "quantity", label: "Quantidade" },
                    { value: "origin", label: "Origem" },
                    { value: "employee", label: "Responsavel" },
                ]} />
                <FilterSegmentedControl label="Tipo" value={draftFilters.typeFilter} onChange={(typeFilter) => setDraftFilters((current) => ({ ...current, typeFilter }))} options={[
                    { value: "all", label: "Todas" },
                    { value: "ENTRADA", label: "Entrada" },
                    { value: "SAIDA", label: "Saida" },
                    { value: "AJUSTE", label: "Ajuste" },
                ]} />
                <FilterSelect label="Origem" value={draftFilters.originFilter} onChange={(originFilter) => setDraftFilters((current) => ({ ...current, originFilter }))} options={[
                    { value: "all", label: "Todas" },
                    { value: "COMPRA", label: "Compra" },
                    { value: "VENDA", label: "Venda" },
                    { value: "AJUSTE", label: "Ajuste manual" },
                    { value: "DEVOLUCAO", label: "Devolucao" },
                    { value: "TRANSFERENCIA", label: "Transferencia" },
                    { value: "INVENTARIO", label: "Inventario" },
                ]} />
                <FilterSelect label="Produto" value={draftFilters.productFilter} onChange={(productFilter) => setDraftFilters((current) => ({ ...current, productFilter }))} options={[
                    { value: "all", label: "Todos" },
                    ...products.map((product) => ({ value: String(product.id), label: product.name })),
                ]} />
                <FilterSelect label="Responsavel" value={draftFilters.employeeFilter} onChange={(employeeFilter) => setDraftFilters((current) => ({ ...current, employeeFilter }))} options={[
                    { value: "all", label: "Todos" },
                    ...employees.map((employee) => ({ value: String(employee.id), label: employee.name })),
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
                        <section className="client-filter-group garage-filter-field"><h3>Inicio</h3><div className="client-input-wrap"><input type="date" value={draftFilters.customStart} onChange={(event) => setDraftFilters((current) => ({ ...current, customStart: event.target.value }))} /></div></section>
                        <section className="client-filter-group garage-filter-field"><h3>Fim</h3><div className="client-input-wrap"><input type="date" value={draftFilters.customEnd} onChange={(event) => setDraftFilters((current) => ({ ...current, customEnd: event.target.value }))} /></div></section>
                    </>
                )}
                <section className="client-filter-group garage-filter-field">
                    <h3>Acoes</h3>
                    <div className="stock-filter-actions">
                        <button type="button" className="secondary-button" onClick={exportExcel}><FileSpreadsheet size={18} aria-hidden="true" />Excel</button>
                        <button type="button" className="secondary-button" onClick={() => window.print()}><Printer size={18} aria-hidden="true" />Imprimir</button>
                    </div>
                </section>
            </FilterPanel>

            {error && <div className="form-error">{error}</div>}

            {loading || metadataLoading ? <MovementsSkeleton /> : filteredRows.length === 0 ? (
                <div className="empty-state movements-empty-state">
                    <div className="empty-state__icon" aria-hidden="true">
                        <PackageSearch size={24} />
                    </div>
                    <strong>{hasActiveFilters ? "Nenhuma movimentacao encontrada com os filtros atuais." : "Nenhuma movimentacao encontrada."}</strong>
                    <span>{hasActiveFilters ? "Ajuste os campos ou limpe os filtros para ampliar a busca." : "As entradas e saidas de estoque aparecerao aqui."}</span>
                    {hasActiveFilters ? (
                        <button type="button" className="secondary-button" onClick={resetFilters}>Limpar filtros</button>
                    ) : (
                        <button type="button" className="primary-button" onClick={() => navigate("/stock")}>
                            <Plus size={20} aria-hidden="true" />
                            Nova movimentacao
                        </button>
                    )}
                </div>
            ) : (
                <>
                    <FilterResultSummary total={filteredRows.length} noun="movimentacoes" hasActiveFilters={hasActiveFilters} />
                    <div className="table-wrap movements-table-wrap">
                        <table className="data-table movements-table">
                            <thead>
                                <tr>
                                    <th><button type="button" className="table-sort-button" onClick={() => toggleSort("date")}>Data/Hora{sortIndicator("date")}</button></th>
                                    <th><button type="button" className="table-sort-button" onClick={() => toggleSort("product")}>Produto{sortIndicator("product")}</button></th>
                                    <th><button type="button" className="table-sort-button" onClick={() => toggleSort("type")}>Tipo{sortIndicator("type")}</button></th>
                                    <th><button type="button" className="table-sort-button" onClick={() => toggleSort("quantity")}>Quantidade{sortIndicator("quantity")}</button></th>
                                    <th><button type="button" className="table-sort-button" onClick={() => toggleSort("previousBalance")}>Saldo Anterior{sortIndicator("previousBalance")}</button></th>
                                    <th><button type="button" className="table-sort-button" onClick={() => toggleSort("currentBalance")}>Saldo Atual{sortIndicator("currentBalance")}</button></th>
                                    <th><button type="button" className="table-sort-button" onClick={() => toggleSort("origin")}>Origem{sortIndicator("origin")}</button></th>
                                    <th><button type="button" className="table-sort-button" onClick={() => toggleSort("employee")}>Responsavel{sortIndicator("employee")}</button></th>
                                    <th><button type="button" className="table-sort-button" onClick={() => toggleSort("reason")}>Motivo{sortIndicator("reason")}</button></th>
                                    <th>Acoes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedRows.map((row, index) => (
                                    <MovementTableRow
                                        key={row.movement.id ?? `${row.movement.product}-${row.movement.createdAt}-${index}`}
                                        row={row}
                                        selected={selectedRow?.movement.id === row.movement.id && row.movement.id !== undefined}
                                        onView={setSelectedRow}
                                        onPrint={(movementRow) => { setSelectedRow(movementRow); window.setTimeout(() => window.print(), 80); }}
                                        onExport={exportSelected}
                                    />
                                ))}
                            </tbody>
                        </table>
                        <MovementsPagination pageStart={pageStart} pageEnd={pageEnd} total={filteredRows.length} pageSize={pageSize} setPageSize={setPageSize} currentPage={currentPage} totalPages={totalPages} visiblePages={visiblePages} setPage={setPage} />
                    </div>

                    <div className="movements-card-list">
                        {paginatedRows.map((row, index) => (
                            <article key={row.movement.id ?? `${row.movement.product}-${row.movement.createdAt}-${index}`} className="purchase-mobile-card movements-mobile-card">
                                <div className="purchase-mobile-card__header">
                                    <div>
                                        <strong>{row.product?.name ?? `Produto #${row.movement.product ?? "-"}`}</strong>
                                        <span>{formatDate(row.movement.createdAt)} {formatTime(row.movement.createdAt)}</span>
                                    </div>
                                    <MovementTypeBadge type={row.movement.type} />
                                </div>
                                <dl>
                                    <div><dt>Quantidade</dt><dd className={row.movement.type === "SAIDA" ? "negative" : "positive"}>{signedQuantity(row.movement.type, row.movement.quantity)}</dd></div>
                                    <div><dt>Saldo</dt><dd>{row.previousBalance ?? "-"} → {row.currentBalance ?? "-"}</dd></div>
                                    <div><dt>Origem</dt><dd>{row.originLabel}</dd></div>
                                    <div><dt>Responsavel</dt><dd>{row.employee?.name ?? "-"}</dd></div>
                                    <div><dt>Codigo</dt><dd>{row.product?.partNumber || "-"}</dd></div>
                                    <div><dt>Motivo</dt><dd>{row.displayReason}</dd></div>
                                </dl>
                                <div className="table-actions movement-actions">
                                    <button type="button" className="table-action-button tooltip-button" data-tooltip="Visualizar" aria-label="Visualizar movimentacao" onClick={() => setSelectedRow(row)}><Eye size={22} aria-hidden="true" /></button>
                                    <button type="button" className="table-action-button tooltip-button" data-tooltip="Imprimir" aria-label="Imprimir movimentacao" onClick={() => { setSelectedRow(row); window.setTimeout(() => window.print(), 80); }}><Printer size={22} aria-hidden="true" /></button>
                                    <button type="button" className="table-action-button tooltip-button" data-tooltip="Exportar" aria-label="Exportar movimentacao" onClick={() => exportSelected(row)}><Download size={22} aria-hidden="true" /></button>
                                </div>
                            </article>
                        ))}
                        <MovementsPagination pageStart={pageStart} pageEnd={pageEnd} total={filteredRows.length} pageSize={pageSize} setPageSize={setPageSize} currentPage={currentPage} totalPages={totalPages} visiblePages={visiblePages} setPage={setPage} />
                    </div>
                </>
            )}

            {selectedRow && <MovementDetailModal row={selectedRow} onClose={() => setSelectedRow(null)} onPrint={() => window.print()} />}
        </section>
    );
}

function MovementDetailModal({ row, onClose, onPrint }: { row: MovementRow; onClose: () => void; onPrint: () => void }) {
    return (
        <div className="modal-overlay movement-modal-overlay" role="presentation" onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
                onClose();
            }
        }}>
            <aside className="product-detail-modal movement-detail-modal" role="dialog" aria-modal="true" aria-label="Detalhes da movimentacao">
                <div className="supplier-detail-modal__header">
                    <div>
                        <span>Historico de estoque</span>
                        <h2>{movementNumber(row)}</h2>
                    </div>
                    <button type="button" className="table-action-button tooltip-button" aria-label="Fechar detalhes" title="Fechar" data-tooltip="Fechar" onClick={onClose}>
                        <X size={19} aria-hidden="true" />
                    </button>
                </div>
                <dl className="supplier-detail-grid product-detail-grid movement-detail-grid">
                    <div><dt>ID da movimentacao</dt><dd>{movementNumber(row)}</dd></div>
                    <div><dt>Produto</dt><dd>{row.product?.name ?? `Produto #${row.movement.product ?? "-"}`}</dd></div>
                    <div><dt>Codigo</dt><dd>{row.product?.partNumber || "-"}</dd></div>
                    <div><dt>Categoria</dt><dd>{row.product?.categoryName ?? "-"}</dd></div>
                    <div><dt>Quantidade movimentada</dt><dd className={row.movement.type === "SAIDA" ? "negative" : "positive"}>{signedQuantity(row.movement.type, row.movement.quantity)}</dd></div>
                    <div><dt>Saldo antes</dt><dd>{row.previousBalance ?? "-"}</dd></div>
                    <div><dt>Saldo depois</dt><dd>{row.currentBalance ?? "-"}</dd></div>
                    <div><dt>Tipo</dt><dd><MovementTypeBadge type={row.movement.type} /></dd></div>
                    <div><dt>Origem</dt><dd>{row.originLabel}</dd></div>
                    <div><dt>Documento relacionado</dt><dd>{row.relatedDocument}</dd></div>
                    <div><dt>Funcionario</dt><dd>{row.employee?.name ?? `Funcionario #${row.movement.employee ?? "-"}`}</dd></div>
                    <div><dt>Data</dt><dd>{formatDate(row.movement.createdAt)}</dd></div>
                    <div><dt>Hora</dt><dd>{formatTime(row.movement.createdAt)}</dd></div>
                    <div className="span-2"><dt>Observacoes</dt><dd>{row.displayReason}</dd></div>
                </dl>
                <div className="form-actions movement-detail-actions">
                    <button type="button" className="primary-button" onClick={onPrint}>
                        <Printer size={18} aria-hidden="true" />
                        Imprimir
                    </button>
                </div>
            </aside>
        </div>
    );
}

function MovementsSkeleton() {
    return (
        <div className="movements-skeleton" aria-label="Carregando movimentacoes">
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

function MovementsPagination({ pageStart, pageEnd, total, pageSize, setPageSize, currentPage, totalPages, visiblePages, setPage }: PaginationProps) {
    return (
        <div className="supplier-pagination movements-pagination">
            <span>Mostrando {pageStart}-{pageEnd} de {total.toLocaleString("pt-BR")} movimentacoes</span>
            <label>
                <select aria-label="Registros por pagina" value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
                    {[10, 20, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
                </select>
            </label>
            <div className="supplier-pagination__pages" aria-label="Paginacao de movimentacoes">
                <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={currentPage === 1}>&lt;</button>
                {visiblePages.map((pageNumber) => (
                    <button key={pageNumber} type="button" className={pageNumber === currentPage ? "active" : undefined} onClick={() => setPage(pageNumber)}>{pageNumber}</button>
                ))}
                <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={currentPage === totalPages}>&gt;</button>
            </div>
        </div>
    );
}

export default StockMovements;
