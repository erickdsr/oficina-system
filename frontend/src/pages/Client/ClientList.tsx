import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
    Ban,
    ChevronDown,
    Download,
    Eye,
    FileSpreadsheet,
    History,
    ListFilter,
    Loader2,
    Pencil,
    Plus,
    Search,
    Trash2,
    UserCheck,
    UserRoundX,
    Users,
    X,
} from "lucide-react";
import { toast } from "sonner";
import EmptyState from "../../components/common/EmptyState";
import ConfirmDeleteModal from "../../components/common/ConfirmDeleteModal";
import PageHeader from "../../components/common/PageHeader";
import SearchInput from "../../components/common/SearchInput";
import StatusBadge from "../../components/common/StatusBadge";
import { useAuth } from "../../context/auth.context";
import { getApiErrorMessage } from "../../services/api";
import clientService from "../../services/client.service";
import saleService from "../../services/sale.service";
import useClient from "../../hooks/useClient";
import type { DeletionReport } from "../../types/api.types";
import type { Client, ClientRequest, ClientSummary } from "../../types/client.types";
import type { SaleResponse } from "../../types/sale.types";
import { canDelete, canManage, normalizeRole } from "../../utils/permissions";
import { displayValue, formatCpfCnpj, formatCurrency, formatDateTime, formatPhone, onlyDigits } from "../../utils/formatters";
import { normalizeSearch } from "../../utils/text";
import { brazilianStates } from "../../utils/brazilian-states";
import ClientForm from "./ClientForm";

type ClientSortKey = "name" | "createdAt" | "lastPurchase" | "totalPurchased";
type SortDirection = "asc" | "desc";
type StatusFilter = "all" | "active" | "inactive";
type TypeFilter = "all" | "PF" | "PJ";
type DeleteMode = "deactivate" | "force";

interface ClientTableRowProps {
    client: Client;
    metrics: ClientCommercialMetrics;
    selected: boolean;
    canEdit: boolean;
    canDeactivate: boolean;
    canHardDelete: boolean;
    onView: (client: Client) => void;
    onEdit: (client: Client) => void;
    onDeactivate: (client: Client) => void;
    onDelete: (client: Client) => void;
}

interface ClientCommercialMetrics {
    lastPurchaseAt: string | null;
    purchaseCount: number;
    totalPurchased: number;
    topProducts: string[];
    sales: SaleResponse[];
}

const avatarColors = ["blue", "green", "orange", "purple", "red"] as const;

function initials(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? "C";
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : parts[0]?.[1] ?? "";
    return `${first}${last}`.toUpperCase();
}

function avatarTone(name: string) {
    const total = Array.from(name).reduce((sum, character) => sum + character.charCodeAt(0), 0);
    return avatarColors[total % avatarColors.length];
}

function ClientAvatar({ client, size = "md" }: { client: Client; size?: "md" | "lg" }) {
    return (
        <div className={`client-avatar client-avatar--${avatarTone(client.name)} client-avatar--${size}`} aria-hidden="true">
            {initials(client.name)}
        </div>
    );
}

function statusInfo(client: Client) {
    return client.status
        ? { label: "Ativo", tone: "success" as const }
        : { label: "Inativo", tone: "muted" as const };
}

function cityState(client: Client) {
    return [client.city, client.state].filter(Boolean).join(" / ") || "-";
}

function clientTypeLabel(type: string) {
    return type === "PJ" ? "Pessoa juridica" : "Pessoa fisica";
}

function formatClientDocument(client: Client) {
    return formatCpfCnpj(client.cpfCnpj);
}

function formatZipCode(value?: string | null) {
    const digits = onlyDigits(value);
    if (digits.length === 8) {
        return digits.replace(/(\d{5})(\d{3})/, "$1-$2");
    }
    return displayValue(value);
}

function relativeDate(value: string | null) {
    if (!value) {
        return "Nunca comprou";
    }

    const now = Date.now();
    const date = new Date(value).getTime();
    const diffInDays = Math.max(0, Math.floor((now - date) / 86_400_000));

    if (diffInDays === 0) {
        return "Hoje";
    }

    if (diffInDays === 1) {
        return "Ha 1 dia";
    }

    if (diffInDays < 30) {
        return `Ha ${diffInDays} dias`;
    }

    const months = Math.floor(diffInDays / 30);
    if (months < 12) {
        return months === 1 ? "Ha 1 mes" : `Ha ${months} meses`;
    }

    const years = Math.floor(months / 12);
    return years === 1 ? "Ha 1 ano" : `Ha ${years} anos`;
}

function paymentSummary(sale: SaleResponse) {
    if (!sale.payments.length) {
        return "-";
    }

    return sale.payments.length === 1 ? "Pagamento unico" : `${sale.payments.length} pagamentos`;
}

function downloadFile(filename: string, content: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

function escapeCsv(value: string | number | boolean | null | undefined) {
    return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

const ClientTableRow = memo(function ClientTableRow({
    client,
    metrics,
    selected,
    canEdit,
    canDeactivate,
    canHardDelete,
    onView,
    onEdit,
    onDeactivate,
    onDelete,
}: ClientTableRowProps) {
    const status = statusInfo(client);

    return (
        <tr className={`client-row${selected ? " client-row--selected" : ""}`} onClick={() => onView(client)}>
            <td><ClientAvatar client={client} /></td>
            <td>
                <div className="client-name-cell">
                    <strong>{client.name}</strong>
                    <span>{clientTypeLabel(client.clientType)}</span>
                </div>
            </td>
            <td className="client-document">{formatClientDocument(client)}</td>
            <td>{formatPhone(client.phone)}</td>
            <td>{cityState(client)}</td>
            <td>{relativeDate(metrics.lastPurchaseAt)}</td>
            <td className="client-money">{formatCurrency(metrics.totalPurchased)}</td>
            <td><StatusBadge label={status.label} tone={status.tone} /></td>
            <td className="client-actions-cell">
                <div className="table-actions client-actions">
                    <button
                        type="button"
                        className="table-action-button tooltip-button"
                        aria-label={`Visualizar cliente ${client.name}`}
                        title="Visualizar cliente"
                        data-tooltip="Visualizar"
                        onClick={(event) => {
                            event.stopPropagation();
                            onView(client);
                        }}
                    >
                        <Eye size={22} strokeWidth={2.3} aria-hidden="true" />
                    </button>
                    {canEdit && (
                        <button
                            type="button"
                            className="table-action-button table-action-button--edit tooltip-button"
                            aria-label={`Editar cliente ${client.name}`}
                            title="Editar cliente"
                            data-tooltip="Editar"
                            onClick={(event) => {
                                event.stopPropagation();
                                onEdit(client);
                            }}
                        >
                            <Pencil size={22} strokeWidth={2.3} aria-hidden="true" />
                        </button>
                    )}
                    {canDeactivate && client.status && (
                        <button
                            type="button"
                            className="table-action-button tooltip-button"
                            aria-label={`Desativar cliente ${client.name}`}
                            title="Desativar cliente"
                            data-tooltip="Desativar"
                            onClick={(event) => {
                                event.stopPropagation();
                                onDeactivate(client);
                            }}
                        >
                            <Ban size={22} strokeWidth={2.3} aria-hidden="true" />
                        </button>
                    )}
                    {canHardDelete && (
                        <button
                            type="button"
                            className="table-action-button table-action-button--delete tooltip-button"
                            aria-label={`Excluir cliente ${client.name}`}
                            title="Excluir cliente"
                            data-tooltip="Excluir"
                            onClick={(event) => {
                                event.stopPropagation();
                                onDelete(client);
                            }}
                        >
                            <Trash2 size={22} strokeWidth={2.3} aria-hidden="true" />
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
});

export function ClientList() {
    const { user } = useAuth();
    const { clients, loading, error, setError, fetchAll, create, update, remove, forceDelete } = useClient();
    const [sales, setSales] = useState<SaleResponse[]>([]);
    const [clientSummary, setClientSummary] = useState<ClientSummary>({ activeCount: 0, inactiveCount: 0, totalCount: 0 });
    const [salesLoading, setSalesLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [showInactive, setShowInactive] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
    const [cityFilter, setCityFilter] = useState("");
    const [stateFilter, setStateFilter] = useState("");
    const [clientSinceFilter, setClientSinceFilter] = useState("");
    const [sortKey, setSortKey] = useState<ClientSortKey>("name");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
    const [deleteMode, setDeleteMode] = useState<DeleteMode>("deactivate");
    const [clientToView, setClientToView] = useState<Client | null>(null);
    const [clientDetailsLoading, setClientDetailsLoading] = useState(false);
    const [clientDetailsError, setClientDetailsError] = useState<string | null>(null);
    const [historyClient, setHistoryClient] = useState<Client | null>(null);
    const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [deletionReport, setDeletionReport] = useState<DeletionReport | null>(null);
    const [showForm, setShowForm] = useState(false);

    const canEditClient = canManage(user?.role, ["ADMIN", "MANAGER", "SALESPERSON"]);
    const canDeactivateClient = canDelete(user?.role, ["ADMIN", "MANAGER", "SALESPERSON"]);
    const canHardDeleteClient = normalizeRole(user?.role) === "ADMIN";

    const loadData = useCallback(async () => {
        setError(null);
        const [, summary] = await Promise.all([
            fetchAll(showInactive),
            clientService.summary(),
        ]);
        setClientSummary(summary);
        setSalesLoading(true);
        try {
            setSales(await saleService.list());
        } catch {
            setSales([]);
        } finally {
            setSalesLoading(false);
        }
    }, [fetchAll, setError, showInactive]);

    useEffect(() => {
        void loadData().catch(() => undefined);
    }, [loadData]);

    const clientMetrics = useMemo(() => {
        return clients.reduce<Record<number, ClientCommercialMetrics>>((accumulator, client) => {
            const clientSales = sales
                .filter((sale) => sale.clientId === client.id)
                .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
            const products = clientSales.flatMap((sale) => sale.items.map((item) => item.productId ? `Produto #${item.productId}` : "Produto sem cadastro"));

            accumulator[client.id] = {
                lastPurchaseAt: clientSales[0]?.createdAt ?? null,
                purchaseCount: clientSales.length,
                totalPurchased: clientSales.reduce((total, sale) => total + sale.total, 0),
                topProducts: Array.from(new Set(products)).slice(0, 4),
                sales: clientSales,
            };

            return accumulator;
        }, {});
    }, [clients, sales]);

    const filteredClients = useMemo(() => {
        const term = normalizeSearch(search);
        const numericTerm = onlyDigits(search);
        const sinceTime = clientSinceFilter ? new Date(`${clientSinceFilter}T00:00:00`).getTime() : null;

        return [...clients]
            .filter((client) => {
                const textFields = [client.name, client.email, client.phone, client.city, client.state, client.cpfCnpj].map(normalizeSearch);
                const digitFields = [client.cpfCnpj, client.phone].map(onlyDigits);

                if (term && !textFields.some((field) => field.includes(term)) && !(numericTerm && digitFields.some((field) => field.includes(numericTerm)))) {
                    return false;
                }

                if (statusFilter === "active" && !client.status) {
                    return false;
                }

                if (statusFilter === "inactive" && client.status) {
                    return false;
                }

                if (typeFilter !== "all" && client.clientType !== typeFilter) {
                    return false;
                }

                if (cityFilter && !normalizeSearch(client.city).includes(normalizeSearch(cityFilter))) {
                    return false;
                }

                if (stateFilter && normalizeSearch(client.state) !== normalizeSearch(stateFilter)) {
                    return false;
                }

                if (sinceTime !== null && new Date(client.createdAt).getTime() < sinceTime) {
                    return false;
                }

                return true;
            })
            .sort((left, right) => {
                let comparison: number;
                const leftMetrics = clientMetrics[left.id] ?? emptyMetrics;
                const rightMetrics = clientMetrics[right.id] ?? emptyMetrics;

                if (sortKey === "createdAt") {
                    comparison = new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
                } else if (sortKey === "lastPurchase") {
                    comparison = new Date(leftMetrics.lastPurchaseAt ?? 0).getTime() - new Date(rightMetrics.lastPurchaseAt ?? 0).getTime();
                } else if (sortKey === "totalPurchased") {
                    comparison = leftMetrics.totalPurchased - rightMetrics.totalPurchased;
                } else {
                    comparison = left.name.localeCompare(right.name, "pt-BR", { sensitivity: "base" });
                }

                return sortDirection === "asc" ? comparison : -comparison;
            });
    }, [cityFilter, clientMetrics, clientSinceFilter, clients, search, sortDirection, sortKey, stateFilter, statusFilter, typeFilter]);

    useEffect(() => {
        setPage(1);
    }, [cityFilter, clientSinceFilter, pageSize, search, showInactive, sortDirection, sortKey, stateFilter, statusFilter, typeFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredClients.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const pageStart = filteredClients.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const pageEnd = Math.min(currentPage * pageSize, filteredClients.length);
    const paginatedClients = useMemo(
        () => filteredClients.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [currentPage, filteredClients, pageSize],
    );
    const visiblePages = useMemo(() => {
        const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
        const end = Math.min(totalPages, start + 4);
        return Array.from({ length: end - start + 1 }, (_, index) => start + index);
    }, [currentPage, totalPages]);

    const viewedMetrics = clientToView ? clientMetrics[clientToView.id] ?? emptyMetrics : emptyMetrics;
    const historyMetrics = historyClient ? clientMetrics[historyClient.id] ?? emptyMetrics : emptyMetrics;

    function handleSort(nextSortKey: ClientSortKey) {
        if (sortKey === nextSortKey) {
            setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
            return;
        }

        setSortKey(nextSortKey);
        setSortDirection("asc");
    }

    function sortIndicator(targetSortKey: ClientSortKey) {
        if (sortKey !== targetSortKey) {
            return "";
        }

        return sortDirection === "asc" ? " ^" : " v";
    }

    function resetFilters() {
        setSearch("");
        setStatusFilter("all");
        setTypeFilter("all");
        setCityFilter("");
        setStateFilter("");
        setClientSinceFilter("");
        setShowInactive(false);
        setSortKey("name");
        setSortDirection("asc");
    }

    const handleViewClick = useCallback(async (client: Client) => {
        setSelectedClientId(client.id);
        setClientDetailsLoading(true);
        setClientDetailsError(null);
        setClientToView(null);
        try {
            setClientToView(await clientService.getById(client.id));
        } catch (detailsError) {
            const message = getApiErrorMessage(detailsError, "Nao foi possivel carregar os dados completos do cliente.");
            setClientDetailsError(message);
            toast.error(message);
        } finally {
            setClientDetailsLoading(false);
        }
    }, []);

    const handleEditClick = useCallback(async (client: Client) => {
        setSelectedClientId(client.id);
        setClientDetailsLoading(true);
        setClientDetailsError(null);
        setShowForm(false);
        setEditingClient(null);
        try {
            setEditingClient(await clientService.getById(client.id));
            setShowForm(true);
        } catch (detailsError) {
            const message = getApiErrorMessage(detailsError, "Nao foi possivel carregar os dados completos para edicao.");
            setClientDetailsError(message);
            toast.error(message);
        } finally {
            setClientDetailsLoading(false);
        }
    }, []);

    async function handleSubmit(data: ClientRequest) {
        setSubmitting(true);
        setFormError(null);
        try {
            if (editingClient) {
                await update(editingClient.id, data);
            } else {
                await create(data);
            }
            setShowForm(false);
            setEditingClient(null);
            await loadData();
        } catch (submitError) {
            setFormError(getApiErrorMessage(submitError, "Nao foi possivel salvar o cliente."));
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDeleteClick(client: Client, mode: DeleteMode = "deactivate") {
        setDeleteError(null);
        setError(null);
        setClientToDelete(client);
        setDeleteMode(mode);
        setDeletionReport(null);
        try {
            setDeletionReport(await clientService.getDeletionReport(client.id));
        } catch (reportError) {
            setDeleteError(getApiErrorMessage(reportError, "Nao foi possivel carregar os vinculos do cliente."));
        }
    }

    async function handleConfirmDelete() {
        if (!clientToDelete || isDeleting) {
            return;
        }

        setIsDeleting(true);
        setDeleteError(null);
        try {
            if (deleteMode === "force") {
                await forceDelete(clientToDelete.id);
            } else {
                await remove(clientToDelete.id);
            }
            await loadData();
            setClientToDelete(null);
            setDeletionReport(null);
        } catch (removeError) {
            setDeleteError(getApiErrorMessage(removeError, deleteMode === "force" ? "Nao foi possivel excluir definitivamente o cliente." : "Nao foi possivel desativar o cliente. Tente novamente."));
        } finally {
            setIsDeleting(false);
        }
    }

    async function handleForceDelete() {
        if (!clientToDelete || isDeleting) {
            return;
        }

        setIsDeleting(true);
        setDeleteError(null);
        try {
            await forceDelete(clientToDelete.id);
            await loadData();
            setClientToDelete(null);
            setDeletionReport(null);
        } catch (removeError) {
            setDeleteError(getApiErrorMessage(removeError, "Nao foi possivel excluir definitivamente o cliente."));
        } finally {
            setIsDeleting(false);
        }
    }

    function handleCancelDelete() {
        if (isDeleting) {
            return;
        }

        setClientToDelete(null);
        setDeleteMode("deactivate");
        setDeleteError(null);
        setDeletionReport(null);
    }

    function exportCsv() {
        const headers = ["Nome", "CPF/CNPJ", "Telefone", "Cidade", "Estado", "Status", "Ultima compra", "Total comprado"];
        const rows = filteredClients.map((client) => {
            const metrics = clientMetrics[client.id] ?? emptyMetrics;
            return [
                client.name,
                formatClientDocument(client),
                formatPhone(client.phone),
                client.city,
                client.state,
                statusInfo(client).label,
                metrics.lastPurchaseAt ? formatDateTime(metrics.lastPurchaseAt) : "Nunca comprou",
                metrics.totalPurchased,
            ].map(escapeCsv).join(",");
        });

        downloadFile("clientes.csv", [headers.map(escapeCsv).join(","), ...rows].join("\n"), "text/csv;charset=utf-8");
        toast.success("CSV de clientes exportado.");
    }

    function exportExcel() {
        const rows = filteredClients.map((client) => {
            const metrics = clientMetrics[client.id] ?? emptyMetrics;
            return `<tr><td>${client.name}</td><td>${formatClientDocument(client)}</td><td>${formatPhone(client.phone)}</td><td>${client.email}</td><td>${cityState(client)}</td><td>${statusInfo(client).label}</td><td>${metrics.lastPurchaseAt ? formatDateTime(metrics.lastPurchaseAt) : "Nunca comprou"}</td><td>${formatCurrency(metrics.totalPurchased)}</td></tr>`;
        }).join("");
        const table = `<table><thead><tr><th>Nome</th><th>CPF/CNPJ</th><th>Telefone</th><th>Email</th><th>Cidade</th><th>Status</th><th>Ultima compra</th><th>Total comprado</th></tr></thead><tbody>${rows}</tbody></table>`;

        downloadFile("clientes.xls", table, "application/vnd.ms-excel;charset=utf-8");
        toast.success("Excel de clientes exportado.");
    }

    return (
        <section className="page-section client-page">
            <div className="client-header-row">
                <PageHeader
                    title="Clientes"
                    description="Base de clientes utilizada em vendas, historico comercial e relacionamento."
                />
                <div className="client-header-metrics" aria-label="Indicadores de clientes">
                    <div className="metric-card supplier-metric-card client-metric-card success">
                        <UserCheck size={18} aria-hidden="true" />
                        <span>Clientes ativos</span>
                        <strong>{clientSummary.activeCount.toLocaleString("pt-BR")}</strong>
                    </div>
                    <div className="metric-card supplier-metric-card client-metric-card">
                        <UserRoundX size={18} aria-hidden="true" />
                        <span>Clientes inativos</span>
                        <strong>{clientSummary.inactiveCount.toLocaleString("pt-BR")}</strong>
                    </div>
                    <div className="metric-card supplier-metric-card client-metric-card">
                        <Users size={18} aria-hidden="true" />
                        <span>Total de clientes</span>
                        <strong>{clientSummary.totalCount.toLocaleString("pt-BR")}</strong>
                    </div>
                </div>
            </div>

            <div className="supplier-filter-panel client-search-panel">
                <div className="supplier-filter-panel__search client-search-panel__search">
                    <SearchInput value={search} onChange={setSearch} placeholder="Pesquisar por nome, CPF/CNPJ, telefone ou email..." />
                    <div className="client-search-hints" aria-label="Campos pesquisaveis">
                        <Search size={14} aria-hidden="true" />
                        <span>Pesquisar por: Nome, CPF/CNPJ, Telefone, Email</span>
                    </div>
                </div>
                <div className="supplier-filter-panel__actions client-search-panel__actions">
                    <button type="button" className="secondary-button" onClick={() => setFiltersOpen((current) => !current)} aria-expanded={filtersOpen}>
                        <ListFilter size={18} aria-hidden="true" />
                        Filtros
                        <ChevronDown className={filtersOpen ? "is-open" : undefined} size={16} aria-hidden="true" />
                    </button>
                    <button type="button" className="secondary-button" onClick={exportCsv}>
                        <Download size={18} aria-hidden="true" />
                        CSV
                    </button>
                    <button type="button" className="secondary-button" onClick={exportExcel}>
                        <FileSpreadsheet size={18} aria-hidden="true" />
                        Excel
                    </button>
                    {canEditClient && (
                        <button type="button" className="primary-button" onClick={() => { setClientDetailsError(null); setEditingClient(null); setShowForm(true); }}>
                            <Plus size={20} aria-hidden="true" />
                            Novo cliente
                        </button>
                    )}
                </div>
            </div>

            {filtersOpen && (
                <div className="product-filter-grid client-filter-grid">
                    <label>
                        Status
                        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
                            <option value="all">Todos</option>
                            <option value="active">Ativos</option>
                            <option value="inactive">Inativos</option>
                        </select>
                    </label>
                    <label>
                        Tipo
                        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}>
                            <option value="all">Todos</option>
                            <option value="PF">Pessoa Fisica</option>
                            <option value="PJ">Pessoa Juridica</option>
                        </select>
                    </label>
                    <label>
                        Cidade
                        <input value={cityFilter} onChange={(event) => setCityFilter(event.target.value)} placeholder="Todas" />
                    </label>
                    <label>
                        Estado
                        <select value={stateFilter} onChange={(event) => setStateFilter(event.target.value)}>
                            <option value="">Todos</option>
                            {brazilianStates.map((state) => (
                                <option key={state} value={state}>{state}</option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Cliente desde
                        <input type="date" value={clientSinceFilter} onChange={(event) => setClientSinceFilter(event.target.value)} />
                    </label>
                    <label>
                        Ordenacao
                        <select value={sortKey} onChange={(event) => setSortKey(event.target.value as ClientSortKey)}>
                            <option value="name">Nome</option>
                            <option value="createdAt">Data de cadastro</option>
                            <option value="lastPurchase">Ultima compra</option>
                            <option value="totalPurchased">Valor comprado</option>
                        </select>
                    </label>
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
                <ClientForm
                    client={editingClient}
                    clients={clients}
                    loading={submitting || clientDetailsLoading}
                    error={formError}
                    onCancel={() => {
                        setShowForm(false);
                        setEditingClient(null);
                        setClientDetailsError(null);
                    }}
                    onSubmit={handleSubmit}
                />
            )}
            {clientDetailsLoading && !showForm && (
                <div className="client-details-status" role="status">
                    <Loader2 size={18} className="loading-state__spinner" aria-hidden="true" />
                    Carregando dados completos do cliente...
                </div>
            )}
            {clientDetailsError && !showForm && <div className="form-error">{clientDetailsError}</div>}
            {error && <div className="form-error">{error}</div>}

            {loading ? (
                <ClientSkeleton />
            ) : filteredClients.length === 0 ? (
                <EmptyState
                    message="Nenhum cliente cadastrado."
                    description="Cadastre o primeiro cliente para iniciar suas vendas."
                    actionLabel={canEditClient ? "Cadastrar Cliente" : undefined}
                    onAction={canEditClient ? () => { setClientDetailsError(null); setEditingClient(null); setShowForm(true); } : undefined}
                />
            ) : (
                <>
                    <div className="table-wrap client-table-wrap">
                        <table className="data-table client-table">
                            <thead>
                                <tr>
                                    <th>Avatar</th>
                                    <th><button type="button" className="table-sort-button" onClick={() => handleSort("name")}>Nome{sortIndicator("name")}</button></th>
                                    <th>CPF/CNPJ</th>
                                    <th>Telefone</th>
                                    <th>Cidade</th>
                                    <th><button type="button" className="table-sort-button" onClick={() => handleSort("lastPurchase")}>Ultima compra{sortIndicator("lastPurchase")}</button></th>
                                    <th><button type="button" className="table-sort-button" onClick={() => handleSort("totalPurchased")}>Valor comprado{sortIndicator("totalPurchased")}</button></th>
                                    <th>Status</th>
                                    <th>Acoes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedClients.map((client) => (
                                    <ClientTableRow
                                        key={client.id}
                                        client={client}
                                        metrics={clientMetrics[client.id] ?? emptyMetrics}
                                        selected={selectedClientId === client.id}
                                        canEdit={canEditClient}
                                        canDeactivate={canDeactivateClient}
                                        canHardDelete={canHardDeleteClient}
                                        onView={handleViewClick}
                                        onEdit={handleEditClick}
                                        onDeactivate={(client) => handleDeleteClick(client, "deactivate")}
                                        onDelete={(client) => handleDeleteClick(client, "force")}
                                    />
                                ))}
                            </tbody>
                        </table>
                        <div className="supplier-pagination client-pagination">
                            <span>Mostrando {pageStart}-{pageEnd} de {filteredClients.length.toLocaleString("pt-BR")} clientes</span>
                            <label>
                                Registros por pagina
                                <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
                                    {[10, 20, 50, 100].map((size) => (
                                        <option key={size} value={size}>{size}</option>
                                    ))}
                                </select>
                            </label>
                            <div className="supplier-pagination__pages" aria-label="Paginacao de clientes">
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

                    <div className="client-card-list">
                        {paginatedClients.map((client) => {
                            const metrics = clientMetrics[client.id] ?? emptyMetrics;
                            const status = statusInfo(client);
                            return (
                                <article key={client.id} className="client-mobile-card">
                                    <div className="client-mobile-card__header">
                                        <ClientAvatar client={client} />
                                        <div>
                                            <strong>{client.name}</strong>
                                            <span>{formatClientDocument(client)}</span>
                                        </div>
                                        <StatusBadge label={status.label} tone={status.tone} />
                                    </div>
                                    <dl>
                                        <div><dt>Telefone</dt><dd>{formatPhone(client.phone)}</dd></div>
                                        <div><dt>Cidade</dt><dd>{cityState(client)}</dd></div>
                                        <div><dt>Ultima compra</dt><dd>{relativeDate(metrics.lastPurchaseAt)}</dd></div>
                                        <div><dt>Total comprado</dt><dd>{formatCurrency(metrics.totalPurchased)}</dd></div>
                                    </dl>
                                    <div className="table-actions client-actions">
                                        <button type="button" className="table-action-button tooltip-button" data-tooltip="Visualizar" aria-label={`Visualizar cliente ${client.name}`} onClick={() => handleViewClick(client)}><Eye size={22} aria-hidden="true" /></button>
                                        {canEditClient && <button type="button" className="table-action-button table-action-button--edit tooltip-button" data-tooltip="Editar" aria-label={`Editar cliente ${client.name}`} onClick={() => handleEditClick(client)}><Pencil size={22} aria-hidden="true" /></button>}
                                        {canDeactivateClient && client.status && <button type="button" className="table-action-button tooltip-button" data-tooltip="Desativar" aria-label={`Desativar cliente ${client.name}`} onClick={() => handleDeleteClick(client, "deactivate")}><Ban size={22} aria-hidden="true" /></button>}
                                        {canHardDeleteClient && <button type="button" className="table-action-button table-action-button--delete tooltip-button" data-tooltip="Excluir" aria-label={`Excluir cliente ${client.name}`} onClick={() => handleDeleteClick(client, "force")}><Trash2 size={22} aria-hidden="true" /></button>}
                                    </div>
                                </article>
                            );
                        })}
                        <div className="supplier-pagination client-card-pagination">
                            <span>Mostrando {pageStart}-{pageEnd} de {filteredClients.length.toLocaleString("pt-BR")} clientes</span>
                            <label>
                                Registros por pagina
                                <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
                                    {[10, 20, 50, 100].map((size) => (
                                        <option key={size} value={size}>{size}</option>
                                    ))}
                                </select>
                            </label>
                            <div className="supplier-pagination__pages" aria-label="Paginacao de clientes em cards">
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
                </>
            )}

            <ConfirmDeleteModal
                isOpen={clientToDelete !== null}
                title={deleteMode === "force" ? "Excluir cliente definitivamente" : "Desativar cliente"}
                itemName={clientToDelete?.name}
                prompt={deleteMode === "force" ? "Tem certeza que deseja excluir definitivamente este cliente?" : "Tem certeza que deseja desativar este cliente?"}
                description={deleteMode === "force" ? "Esta acao removera o cliente definitivamente quando permitido pelas regras de negocio." : "O cliente sera desativado por padrao para preservar o historico comercial."}
                dependencyDescription="Para preservar a integridade do historico, o registro sera apenas desativado."
                confirmLabel={deleteMode === "force" ? "Excluir definitivamente" : "Desativar cliente"}
                isLoading={isDeleting}
                error={deleteError}
                report={deleteMode === "force" ? null : deletionReport}
                userRole={user?.role}
                onConfirm={handleConfirmDelete}
                onForceConfirm={deleteMode === "deactivate" ? handleForceDelete : undefined}
                onCancel={handleCancelDelete}
            />

            {clientToView && (
                <div className="supplier-drawer-overlay" role="presentation" onMouseDown={(event) => {
                    if (event.target === event.currentTarget) {
                        setClientToView(null);
                    }
                }}>
                    <aside className="supplier-detail-drawer client-detail-drawer" role="dialog" aria-modal="true" aria-label="Visualizar cliente">
                        <div className="supplier-detail-modal__header">
                            <div className="client-detail-heading">
                                <ClientAvatar client={clientToView} size="lg" />
                                <div>
                                    <span>Visualizar cliente</span>
                                    <h2>{clientToView.name}</h2>
                                </div>
                            </div>
                            <button type="button" className="table-action-button tooltip-button" aria-label="Fechar detalhes" title="Fechar" data-tooltip="Fechar" onClick={() => setClientToView(null)}>
                                <X size={19} aria-hidden="true" />
                            </button>
                        </div>

                        <section className="supplier-detail-section">
                            <h3>Dados gerais</h3>
                            <dl className="supplier-detail-grid client-detail-grid">
                                <div><dt>Status</dt><dd><StatusBadge label={statusInfo(clientToView).label} tone={statusInfo(clientToView).tone} /></dd></div>
                                <div><dt>Tipo de pessoa</dt><dd>{clientTypeLabel(clientToView.clientType)}</dd></div>
                                <div className="span-2"><dt>{clientToView.clientType === "PJ" ? "Razao social" : "Nome completo"}</dt><dd>{displayValue(clientToView.name)}</dd></div>
                                <div><dt>Data de cadastro</dt><dd>{formatDateTime(clientToView.createdAt)}</dd></div>
                                <div><dt>Ultima atualizacao</dt><dd>{formatDateTime(clientToView.updatedAt)}</dd></div>
                            </dl>
                        </section>

                        <section className="supplier-detail-section">
                            <h3>Documentos</h3>
                            <dl className="supplier-detail-grid client-detail-grid">
                                <div><dt>{clientToView.clientType === "PJ" ? "CNPJ" : "CPF"}</dt><dd>{formatClientDocument(clientToView)}</dd></div>
                            </dl>
                        </section>

                        <section className="supplier-detail-section">
                            <h3>Contato</h3>
                            <dl className="supplier-detail-grid client-detail-grid">
                                <div><dt>Telefone principal</dt><dd>{formatPhone(clientToView.phone)}</dd></div>
                                <div><dt>Telefone secundario</dt><dd>{formatPhone(clientToView.secondaryPhone)}</dd></div>
                                <div className="span-2"><dt>Email</dt><dd>{displayValue(clientToView.email)}</dd></div>
                            </dl>
                        </section>

                        <section className="supplier-detail-section">
                            <h3>Endereco</h3>
                            <dl className="supplier-detail-grid client-detail-grid">
                                <div><dt>CEP</dt><dd>{formatZipCode(clientToView.zipCode)}</dd></div>
                                <div><dt>Estado</dt><dd>{displayValue(clientToView.state)}</dd></div>
                                <div className="span-2"><dt>Logradouro</dt><dd>{displayValue(clientToView.street || clientToView.address)}</dd></div>
                                <div><dt>Numero</dt><dd>{displayValue(clientToView.number)}</dd></div>
                                <div><dt>Complemento</dt><dd>{displayValue(clientToView.complement)}</dd></div>
                                <div><dt>Bairro</dt><dd>{displayValue(clientToView.district)}</dd></div>
                                <div><dt>Cidade</dt><dd>{displayValue(clientToView.city)}</dd></div>
                            </dl>
                        </section>

                        <section className="supplier-detail-section">
                            <h3>Informacoes adicionais</h3>
                            <dl className="supplier-detail-grid client-detail-grid">
                                <div><dt>Ultima compra</dt><dd>{relativeDate(viewedMetrics.lastPurchaseAt)}</dd></div>
                                <div><dt>Quantidade de compras</dt><dd>{viewedMetrics.purchaseCount.toLocaleString("pt-BR")}</dd></div>
                                <div><dt>Valor total comprado</dt><dd>{formatCurrency(viewedMetrics.totalPurchased)}</dd></div>
                                <div className="span-2"><dt>Observacoes</dt><dd>{displayValue(clientToView.notes)}</dd></div>
                            </dl>
                        </section>

                        <section className="supplier-detail-section">
                            <h3>Produtos mais comprados</h3>
                            <div className="client-product-list">
                                {viewedMetrics.topProducts.length > 0 ? viewedMetrics.topProducts.map((product) => <span key={product}>{product}</span>) : <span>Nenhum produto comprado</span>}
                            </div>
                        </section>

                        <button type="button" className="primary-button client-history-button" onClick={() => setHistoryClient(clientToView)}>
                            <History size={18} aria-hidden="true" />
                            Ver historico
                        </button>
                    </aside>
                </div>
            )}

            {historyClient && (
                <div className="modal-overlay" role="presentation" onMouseDown={(event) => {
                    if (event.target === event.currentTarget) {
                        setHistoryClient(null);
                    }
                }}>
                    <aside className="client-history-modal" role="dialog" aria-modal="true" aria-label="Historico de cliente">
                        <div className="supplier-detail-modal__header">
                            <div>
                                <span>Historico comercial</span>
                                <h2>{historyClient.name}</h2>
                            </div>
                            <button type="button" className="table-action-button tooltip-button" aria-label="Fechar historico" title="Fechar" data-tooltip="Fechar" onClick={() => setHistoryClient(null)}>
                                <X size={19} aria-hidden="true" />
                            </button>
                        </div>
                        {salesLoading ? <ClientSkeleton compact /> : historyMetrics.sales.length === 0 ? (
                            <EmptyState message="Nenhuma venda encontrada." description="As vendas deste cliente aparecerao aqui quando forem registradas." />
                        ) : (
                            <div className="table-wrap client-history-table-wrap">
                                <table className="data-table client-history-table">
                                    <thead>
                                        <tr>
                                            <th>Data</th>
                                            <th>Valor</th>
                                            <th>Forma de pagamento</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {historyMetrics.sales.map((sale) => (
                                            <tr key={sale.id}>
                                                <td>{formatDateTime(sale.createdAt)}</td>
                                                <td className="client-money">{formatCurrency(sale.total)}</td>
                                                <td>{paymentSummary(sale)}</td>
                                                <td><StatusBadge label={sale.status} tone={sale.status === "CANCELADA" ? "danger" : sale.status === "PENDENTE" ? "warning" : "success"} /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </aside>
                </div>
            )}
        </section>
    );
}

function ClientSkeleton({ compact = false }: { compact?: boolean }) {
    return (
        <div className={`table-wrap client-skeleton${compact ? " compact" : ""}`} aria-label="Carregando clientes">
            {Array.from({ length: compact ? 4 : 8 }, (_, index) => (
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

const emptyMetrics: ClientCommercialMetrics = {
    lastPurchaseAt: null,
    purchaseCount: 0,
    totalPurchased: 0,
    topProducts: [],
    sales: [],
};

export default ClientList;
