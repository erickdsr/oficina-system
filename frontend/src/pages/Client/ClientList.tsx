import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { autoUpdate, flip, FloatingPortal, offset, shift, size, useFloating } from "@floating-ui/react";
import { createPortal } from "react-dom";
import {
    Ban,
    ChevronDown,
    Eye,
    History,
    ListFilter,
    Loader2,
    Pencil,
    Plus,
    RotateCcw,
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
import StatusBadge from "../../components/common/StatusBadge";
import { useAuth } from "../../context/auth.context";
import { getApiErrorMessage } from "../../services/api";
import clientService from "../../services/client.service";
import saleService from "../../services/sale.service";
import useClient from "../../hooks/useClient";
import type { DeletionReport } from "../../types/api.types";
import type { Client, ClientCityFilterOption, ClientRequest, ClientSummary } from "../../types/client.types";
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
type OrderPreset = "default" | "name" | "recent" | "oldest" | "custom";
type DeleteMode = "deactivate" | "force";
type PopoverPosition = { top: number; left: number; width: number; maxHeight: number };

interface ClientFilters {
    search: string;
    statusFilter: StatusFilter;
    typeFilter: TypeFilter;
    cityFilters: string[];
    stateFilters: string[];
    orderPreset: OrderPreset;
    sortKey: ClientSortKey;
    sortDirection: SortDirection;
}

const CLIENT_FILTERS_STORAGE_KEY = "system_oficina.client.filters";

const stateNames: Record<string, string> = {
    AC: "Acre",
    AL: "Alagoas",
    AP: "Amapa",
    AM: "Amazonas",
    BA: "Bahia",
    CE: "Ceara",
    DF: "Distrito Federal",
    ES: "Espirito Santo",
    GO: "Goias",
    MA: "Maranhao",
    MT: "Mato Grosso",
    MS: "Mato Grosso do Sul",
    MG: "Minas Gerais",
    PA: "Para",
    PB: "Paraiba",
    PR: "Parana",
    PE: "Pernambuco",
    PI: "Piaui",
    RJ: "Rio de Janeiro",
    RN: "Rio Grande do Norte",
    RS: "Rio Grande do Sul",
    RO: "Rondonia",
    RR: "Roraima",
    SC: "Santa Catarina",
    SP: "Sao Paulo",
    SE: "Sergipe",
    TO: "Tocantins",
};

const defaultClientFilters: ClientFilters = {
    search: "",
    statusFilter: "all",
    typeFilter: "all",
    cityFilters: [],
    stateFilters: [],
    orderPreset: "default",
    sortKey: "name",
    sortDirection: "asc",
};

function loadStoredClientFilters(): ClientFilters {
    if (typeof window === "undefined") {
        return defaultClientFilters;
    }

    try {
        const stored = window.localStorage.getItem(CLIENT_FILTERS_STORAGE_KEY);
        if (!stored) {
            return defaultClientFilters;
        }
        const parsed = JSON.parse(stored) as Partial<ClientFilters> & { cityFilter?: string; stateFilter?: string };
        const availableStates = new Set<string>(brazilianStates);
        const storedStates = Array.isArray(parsed.stateFilters)
            ? parsed.stateFilters
            : parsed.stateFilter
                ? [parsed.stateFilter]
                : [];
        const storedCities = Array.isArray(parsed.cityFilters)
            ? parsed.cityFilters
            : parsed.cityFilter
                ? [parsed.cityFilter]
                : [];
        const orderPreset = parsed.orderPreset
            ?? (parsed.sortKey === "createdAt" && parsed.sortDirection === "desc"
                ? "recent"
                : parsed.sortKey === "createdAt" && parsed.sortDirection === "asc"
                    ? "oldest"
                    : parsed.sortKey === "name"
                        ? "name"
                        : "default");
        return {
            ...defaultClientFilters,
            ...parsed,
            orderPreset,
            cityFilters: storedCities.filter(Boolean),
            stateFilters: storedStates.filter((state) => availableStates.has(state)),
        };
    } catch {
        return defaultClientFilters;
    }
}

function saveClientFilters(filters: ClientFilters) {
    if (typeof window !== "undefined") {
        window.localStorage.setItem(CLIENT_FILTERS_STORAGE_KEY, JSON.stringify(filters));
    }
}

function countActiveClientFilters(filters: ClientFilters) {
    return [
        filters.search.trim(),
        filters.statusFilter !== defaultClientFilters.statusFilter,
        filters.typeFilter !== defaultClientFilters.typeFilter,
        filters.cityFilters.length > 0,
        filters.stateFilters.length > 0,
        filters.orderPreset !== defaultClientFilters.orderPreset || filters.sortKey !== defaultClientFilters.sortKey || filters.sortDirection !== defaultClientFilters.sortDirection,
    ].filter(Boolean).length;
}

function areStringListsEqual(left: string[], right: string[]) {
    return left.length === right.length && left.every((value, index) => value === right[index]);
}

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
    const [cityFilterOptions, setCityFilterOptions] = useState<ClientCityFilterOption[]>([]);
    const [cityOptionsLoading, setCityOptionsLoading] = useState(false);
    const [cityOptionsError, setCityOptionsError] = useState<string | null>(null);
    const [appliedFilters, setAppliedFilters] = useState<ClientFilters>(() => loadStoredClientFilters());
    const [draftFilters, setDraftFilters] = useState<ClientFilters>(() => loadStoredClientFilters());
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [stateSearch, setStateSearch] = useState("");
    const [citySearch, setCitySearch] = useState("");
    const [orderDropdownOpen, setOrderDropdownOpen] = useState(false);
    const [statesDropdownOpen, setStatesDropdownOpen] = useState(false);
    const [citiesDropdownOpen, setCitiesDropdownOpen] = useState(false);
    const [orderPopoverPosition, setOrderPopoverPosition] = useState<PopoverPosition | null>(null);
    const [citiesPopoverPosition, setCitiesPopoverPosition] = useState<PopoverPosition | null>(null);
    const [isApplyingFilters, setIsApplyingFilters] = useState(false);
    const [page, setPage] = useState(1);
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
    const orderDropdownRef = useRef<HTMLDivElement | null>(null);
    const statesDropdownRef = useRef<HTMLDivElement | null>(null);
    const citiesDropdownRef = useRef<HTMLDivElement | null>(null);
    const stateTriggerRef = useRef<HTMLButtonElement | null>(null);
    const orderPopoverRef = useRef<HTMLDivElement | null>(null);
    const statesPopoverRef = useRef<HTMLDivElement | null>(null);
    const citiesPopoverRef = useRef<HTMLDivElement | null>(null);
    const statesPopoverSnapshotRef = useRef<Pick<ClientFilters, "stateFilters" | "cityFilters">>({ stateFilters: [], cityFilters: [] });
    const citiesPopoverSnapshotRef = useRef<string[]>([]);
    const statesDropdownOpenRef = useRef(false);

    const stateFloating = useFloating({
        open: statesDropdownOpen,
        placement: "bottom-start",
        strategy: "fixed",
        whileElementsMounted: autoUpdate,
        middleware: [
            offset(6),
            flip({ padding: 12 }),
            shift({ padding: 12 }),
            size({
                padding: 12,
                apply({ availableHeight, elements }) {
                    elements.floating.style.maxHeight = `${Math.min(420, Math.max(180, availableHeight))}px`;
                },
            }),
        ],
    });

    const canEditClient = canManage(user?.role, ["ADMIN", "MANAGER", "SALESPERSON"]);
    const canDeactivateClient = canDelete(user?.role, ["ADMIN", "MANAGER", "SALESPERSON"]);
    const canHardDeleteClient = normalizeRole(user?.role) === "ADMIN";
    const activeFilterCount = useMemo(() => countActiveClientFilters(appliedFilters), [appliedFilters]);
    const hasActiveFilters = activeFilterCount > 0;
    const pageSize = 10;
    const allStatesSelected = draftFilters.stateFilters.length === brazilianStates.length;
    const someStatesSelected = draftFilters.stateFilters.length > 0 && !allStatesSelected;

    const loadData = useCallback(async () => {
        setError(null);
        const [, summary] = await Promise.all([
            fetchAll(appliedFilters.statusFilter !== "active"),
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
    }, [appliedFilters.statusFilter, fetchAll, setError]);

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

    const visibleStateOptions = useMemo(() => {
        const term = normalizeSearch(stateSearch);
        return brazilianStates.filter((state) => {
            if (!term) {
                return true;
            }
            return normalizeSearch(state).includes(term) || normalizeSearch(stateNames[state]).includes(term);
        });
    }, [stateSearch]);

    const visibleCityGroups = useMemo(() => {
        const term = normalizeSearch(citySearch);
        const groups = new Map<string, ClientCityFilterOption[]>();
        cityFilterOptions
            .filter((option) => !term || normalizeSearch(option.cidade).includes(term) || normalizeSearch(option.estado).includes(term))
            .forEach((option) => {
                const state = option.estado || "UF";
                groups.set(state, [...(groups.get(state) ?? []), option]);
            });
        return Array.from(groups.entries()).map(([state, cities]) => ({ state, cities }));
    }, [cityFilterOptions, citySearch]);

    const filteredClients = useMemo(() => {
        const term = normalizeSearch(appliedFilters.search);
        const numericTerm = onlyDigits(appliedFilters.search);

        return [...clients]
            .filter((client) => {
                const textFields = [client.name, client.email, client.phone, client.city, client.state, client.cpfCnpj].map(normalizeSearch);
                const digitFields = [client.cpfCnpj, client.phone].map(onlyDigits);

                if (term && !textFields.some((field) => field.includes(term)) && !(numericTerm && digitFields.some((field) => field.includes(numericTerm)))) {
                    return false;
                }

                if (appliedFilters.statusFilter === "active" && !client.status) {
                    return false;
                }

                if (appliedFilters.statusFilter === "inactive" && client.status) {
                    return false;
                }

                if (appliedFilters.typeFilter !== "all" && client.clientType !== appliedFilters.typeFilter) {
                    return false;
                }

                if (appliedFilters.stateFilters.length > 0 && !appliedFilters.stateFilters.some((state) => normalizeSearch(client.state) === normalizeSearch(state))) {
                    return false;
                }

                if (appliedFilters.cityFilters.length > 0 && !appliedFilters.cityFilters.some((city) => normalizeSearch(client.city) === normalizeSearch(city))) {
                    return false;
                }

                return true;
            })
            .sort((left, right) => {
                let comparison: number;
                const leftMetrics = clientMetrics[left.id] ?? emptyMetrics;
                const rightMetrics = clientMetrics[right.id] ?? emptyMetrics;

                if (appliedFilters.sortKey === "createdAt") {
                    comparison = new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
                } else if (appliedFilters.sortKey === "lastPurchase") {
                    comparison = new Date(leftMetrics.lastPurchaseAt ?? 0).getTime() - new Date(rightMetrics.lastPurchaseAt ?? 0).getTime();
                } else if (appliedFilters.sortKey === "totalPurchased") {
                    comparison = leftMetrics.totalPurchased - rightMetrics.totalPurchased;
                } else {
                    comparison = left.name.localeCompare(right.name, "pt-BR", { sensitivity: "base" });
                }

                return appliedFilters.sortDirection === "asc" ? comparison : -comparison;
            });
    }, [appliedFilters, clientMetrics, clients]);

    useEffect(() => {
        setPage(1);
    }, [appliedFilters]);

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

    const calculatePopoverPosition = useCallback((anchor: HTMLElement | null, options: { width?: number; estimatedHeight?: number } = {}): PopoverPosition | null => {
        if (!anchor || typeof window === "undefined") {
            return null;
        }
        const rect = anchor.getBoundingClientRect();
        const width = Math.min(options.width ?? 420, window.innerWidth - 32);
        const left = Math.min(Math.max(16, rect.left), Math.max(16, window.innerWidth - width - 16));
        const estimatedHeight = options.estimatedHeight ?? 330;
        const spaceBelow = window.innerHeight - rect.bottom - 16;
        const spaceAbove = rect.top - 16;
        const opensAbove = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;
        const maxHeight = Math.max(160, Math.min(estimatedHeight, opensAbove ? spaceAbove - 8 : spaceBelow - 8));
        return {
            top: opensAbove ? Math.max(16, rect.top - maxHeight - 8) : rect.bottom + 8,
            left,
            width,
            maxHeight,
        };
    }, []);

    const updatePopoverPositions = useCallback(() => {
        if (orderDropdownOpen) {
            const width = orderDropdownRef.current?.getBoundingClientRect().width;
            setOrderPopoverPosition(calculatePopoverPosition(orderDropdownRef.current, { width, estimatedHeight: 188 }));
        }
        if (citiesDropdownOpen) {
            setCitiesPopoverPosition(calculatePopoverPosition(citiesDropdownRef.current, { estimatedHeight: 300 }));
        }
    }, [calculatePopoverPosition, citiesDropdownOpen, orderDropdownOpen]);

    useEffect(() => {
        statesDropdownOpenRef.current = statesDropdownOpen;
    }, [statesDropdownOpen]);

    useEffect(() => {
        function handlePointerDown(event: MouseEvent) {
            const target = event.target as Node;
            if (
                orderDropdownRef.current
                && !orderDropdownRef.current.contains(target)
                && !orderPopoverRef.current?.contains(target)
            ) {
                setOrderDropdownOpen(false);
            }
            if (
                statesDropdownOpenRef.current
                && statesDropdownRef.current
                && !statesDropdownRef.current.contains(target)
                && !statesPopoverRef.current?.contains(target)
            ) {
                cancelStatesPopover();
                return;
            }
            if (
                statesDropdownRef.current
                && !statesDropdownRef.current.contains(target)
                && !statesPopoverRef.current?.contains(target)
            ) {
                setStatesDropdownOpen(false);
            }
            if (
                citiesDropdownRef.current
                && !citiesDropdownRef.current.contains(target)
                && !citiesPopoverRef.current?.contains(target)
            ) {
                setCitiesDropdownOpen(false);
            }
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setOrderDropdownOpen(false);
                if (statesDropdownOpenRef.current) {
                    cancelStatesPopover();
                }
                setCitiesDropdownOpen(false);
            }
        }

        document.addEventListener("mousedown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    useEffect(() => {
        updatePopoverPositions();
        if (!orderDropdownOpen && !statesDropdownOpen && !citiesDropdownOpen) {
            return undefined;
        }

        window.addEventListener("resize", updatePopoverPositions);
        window.addEventListener("scroll", updatePopoverPositions, true);
        return () => {
            window.removeEventListener("resize", updatePopoverPositions);
            window.removeEventListener("scroll", updatePopoverPositions, true);
        };
    }, [citiesDropdownOpen, orderDropdownOpen, statesDropdownOpen, updatePopoverPositions]);

    const stateSummary = useMemo(() => {
        if (draftFilters.stateFilters.length === 0) {
            return { text: "Selecionar estados", count: "" };
        }
        const [first, second, ...rest] = draftFilters.stateFilters;
        return {
            text: [first, second].filter(Boolean).join(", ") + (rest.length > 0 ? ` +${rest.length}` : ""),
            count: `${draftFilters.stateFilters.length} selecionados`,
        };
    }, [draftFilters.stateFilters]);

    const citySummary = useMemo(() => {
        if (draftFilters.cityFilters.length === 0) {
            return "Selecionar cidades";
        }
        const [first, second, ...rest] = draftFilters.cityFilters;
        return [first, second].filter(Boolean).join(", ") + (rest.length > 0 ? ` +${rest.length}` : "");
    }, [draftFilters.cityFilters]);

    const loadCityFilterOptions = useCallback(async () => {
        setCityOptionsLoading(true);
        setCityOptionsError(null);
        try {
            setCityFilterOptions(await clientService.cityFilterOptions({
                states: draftFilters.stateFilters,
                status: draftFilters.statusFilter,
            }));
        } catch (cityLoadError) {
            setCityFilterOptions([]);
            setCityOptionsError(getApiErrorMessage(cityLoadError, "Nao foi possivel carregar cidades."));
        } finally {
            setCityOptionsLoading(false);
        }
    }, [draftFilters.stateFilters, draftFilters.statusFilter]);

    function updateDraftFilter<K extends keyof ClientFilters>(key: K, value: ClientFilters[K]) {
        setDraftFilters((current) => ({ ...current, [key]: value }));
    }

    function applyFilters(nextFilters = draftFilters) {
        const selectedStates = new Set(nextFilters.stateFilters.map((state) => normalizeSearch(state)));
        const validCities = nextFilters.stateFilters.length === 0
            ? nextFilters.cityFilters
            : nextFilters.cityFilters.filter((city) => clients.some((client) => normalizeSearch(client.city) === normalizeSearch(city) && selectedStates.has(normalizeSearch(client.state))));
        const normalizedFilters = { ...nextFilters, cityFilters: validCities };
        setIsApplyingFilters(true);
        setAppliedFilters(normalizedFilters);
        setDraftFilters(normalizedFilters);
        saveClientFilters(normalizedFilters);
        setPage(1);
        window.setTimeout(() => setIsApplyingFilters(false), 180);
    }

    function handleSort(nextSortKey: ClientSortKey) {
        const nextFilters: ClientFilters = {
            ...appliedFilters,
            orderPreset: "custom",
            sortKey: nextSortKey,
            sortDirection: appliedFilters.sortKey === nextSortKey && appliedFilters.sortDirection === "asc" ? "desc" : "asc",
        };
        setDraftFilters(nextFilters);
        applyFilters(nextFilters);
    }

    function sortIndicator(targetSortKey: ClientSortKey) {
        if (appliedFilters.sortKey !== targetSortKey) {
            return "";
        }

        return appliedFilters.sortDirection === "asc" ? " ^" : " v";
    }

    function resetFilters() {
        setDraftFilters(defaultClientFilters);
        applyFilters(defaultClientFilters);
    }

    function clearDraftFilter<K extends keyof ClientFilters>(key: K) {
        updateDraftFilter(key, defaultClientFilters[key]);
    }

    function updateDraftOrderPreset(orderPreset: OrderPreset) {
        setDraftFilters((current) => {
            if (orderPreset === "recent") {
                return { ...current, orderPreset, sortKey: "createdAt", sortDirection: "desc" };
            }
            if (orderPreset === "oldest") {
                return { ...current, orderPreset, sortKey: "createdAt", sortDirection: "asc" };
            }
            return { ...current, orderPreset, sortKey: "name", sortDirection: "asc" };
        });
    }

    function toggleDraftStateFilter(state: string) {
        setDraftFilters((current) => {
            const selected = current.stateFilters.includes(state);
            const nextStates = selected
                ? current.stateFilters.filter((currentState) => currentState !== state)
                : [...current.stateFilters, state];
            return {
                ...current,
                stateFilters: nextStates,
                cityFilters: nextStates.length === 0
                    ? current.cityFilters
                    : current.cityFilters.filter((city) => clients.some((client) => normalizeSearch(client.city) === normalizeSearch(city) && nextStates.some((selectedState) => normalizeSearch(client.state) === normalizeSearch(selectedState)))),
            };
        });
    }

    function toggleAllDraftStates() {
        setDraftFilters((current) => ({
            ...current,
            stateFilters: current.stateFilters.length === brazilianStates.length ? [] : [...brazilianStates],
            cityFilters: current.cityFilters,
        }));
    }

    function toggleDraftCityFilter(city: string) {
        setDraftFilters((current) => {
            const selected = current.cityFilters.includes(city);
            return {
                ...current,
                cityFilters: selected
                    ? current.cityFilters.filter((currentCity) => currentCity !== city)
                    : [...current.cityFilters, city],
            };
        });
    }

    function toggleOrderPopover() {
        setOrderDropdownOpen((current) => {
            const nextOpen = !current;
            if (nextOpen) {
                const width = orderDropdownRef.current?.getBoundingClientRect().width;
                setOrderPopoverPosition(calculatePopoverPosition(orderDropdownRef.current, { width, estimatedHeight: 188 }));
                setStatesDropdownOpen(false);
                setCitiesDropdownOpen(false);
            }
            return nextOpen;
        });
    }

    function selectOrderPreset(orderPreset: OrderPreset) {
        updateDraftOrderPreset(orderPreset);
        setOrderDropdownOpen(false);
    }

    function toggleStatesPopover() {
        if (statesDropdownOpen) {
            cancelStatesPopover();
            return;
        }
        statesPopoverSnapshotRef.current = {
            stateFilters: [...draftFilters.stateFilters],
            cityFilters: [...draftFilters.cityFilters],
        };
        setOrderDropdownOpen(false);
        setCitiesDropdownOpen(false);
        setStatesDropdownOpen(true);
    }

    function toggleCitiesPopover() {
        setCitiesDropdownOpen((current) => {
            const nextOpen = !current;
            if (nextOpen) {
                citiesPopoverSnapshotRef.current = [...draftFilters.cityFilters];
                setCitiesPopoverPosition(calculatePopoverPosition(citiesDropdownRef.current, { estimatedHeight: 300 }));
                setOrderDropdownOpen(false);
                setStatesDropdownOpen(false);
                void loadCityFilterOptions();
            }
            return nextOpen;
        });
    }

    function cancelStatesPopover() {
        setDraftFilters((current) => ({
            ...current,
            stateFilters: [...statesPopoverSnapshotRef.current.stateFilters],
            cityFilters: [...statesPopoverSnapshotRef.current.cityFilters],
        }));
        setStatesDropdownOpen(false);
        stateTriggerRef.current?.focus();
    }

    function applyStatesPopover() {
        setStatesDropdownOpen(false);
        stateTriggerRef.current?.focus();
    }

    function cancelCitiesPopover() {
        setDraftFilters((current) => ({ ...current, cityFilters: [...citiesPopoverSnapshotRef.current] }));
        setCitiesDropdownOpen(false);
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

    const activeFilterChips: Array<{ key: string; label: string; onClear: () => void }> = [];
    draftFilters.stateFilters.forEach((state) => {
        activeFilterChips.push({
            key: `state-${state}`,
            label: state,
            onClear: () => toggleDraftStateFilter(state),
        });
    });
    draftFilters.cityFilters.forEach((city) => {
        activeFilterChips.push({
            key: `city-${city}`,
            label: city,
            onClear: () => toggleDraftCityFilter(city),
        });
    });
    if (draftFilters.orderPreset !== defaultClientFilters.orderPreset || draftFilters.sortKey !== defaultClientFilters.sortKey || draftFilters.sortDirection !== defaultClientFilters.sortDirection) {
        const orderLabels: Record<OrderPreset, string> = {
            default: "Padrao",
            name: "Nome",
            recent: "Mais recentes",
            oldest: "Mais antigos",
            custom: "Ordenacao",
        };
        activeFilterChips.push({
            key: "order",
            label: orderLabels[draftFilters.orderPreset],
            onClear: () => updateDraftOrderPreset("default"),
        });
    }
    if (draftFilters.statusFilter !== "all") {
        activeFilterChips.push({
            key: "status",
            label: draftFilters.statusFilter === "active" ? "Ativos" : "Inativos",
            onClear: () => updateDraftFilter("statusFilter", "all"),
        });
    }
    if (draftFilters.typeFilter !== "all") {
        activeFilterChips.push({
            key: "type",
            label: draftFilters.typeFilter === "PF" ? "Pessoa fisica" : "Pessoa juridica",
            onClear: () => updateDraftFilter("typeFilter", "all"),
        });
    }
    if (draftFilters.search) {
        activeFilterChips.push({
            key: "search",
            label: "Busca",
            onClear: () => clearDraftFilter("search"),
        });
    }
    const visibleFilterChips = activeFilterChips.slice(0, 3);
    const hiddenFilterChipCount = Math.max(0, activeFilterChips.length - visibleFilterChips.length);
    const orderOptions: Array<{ value: OrderPreset; label: string }> = [
        { value: "default", label: "Padrao" },
        { value: "name", label: "Nome" },
        { value: "recent", label: "Mais recentes" },
        { value: "oldest", label: "Mais antigos" },
    ];
    const selectedOrderLabel = orderOptions.find((option) => option.value === draftFilters.orderPreset)?.label ?? "Padrao";
    const hasPendingStateChanges = statesDropdownOpen && (
        !areStringListsEqual(draftFilters.stateFilters, statesPopoverSnapshotRef.current.stateFilters)
        || !areStringListsEqual(draftFilters.cityFilters, statesPopoverSnapshotRef.current.cityFilters)
    );
    const canRenderPortal = typeof document !== "undefined";
    const orderPopover = orderDropdownOpen && orderPopoverPosition && canRenderPortal
        ? createPortal(
            <div
                ref={orderPopoverRef}
                className="client-filter-popover client-order-popover"
                style={{ top: orderPopoverPosition.top, left: orderPopoverPosition.left, width: orderPopoverPosition.width, maxHeight: orderPopoverPosition.maxHeight }}
            >
                {orderOptions.map((option) => (
                    <button
                        type="button"
                        key={option.value}
                        className={draftFilters.orderPreset === option.value ? "active" : undefined}
                        onClick={() => selectOrderPreset(option.value)}
                    >
                        {option.label}
                    </button>
                ))}
            </div>,
            document.body,
        )
        : null;
    const statesPopover = statesDropdownOpen
        ? (
            <FloatingPortal>
            <div
                ref={(node) => {
                    statesPopoverRef.current = node;
                    stateFloating.refs.setFloating(node);
                }}
                className="client-filter-popover client-state-popover"
                style={stateFloating.floatingStyles}
            >
                <div className="client-state-popover__header">
                    <span className="client-input-wrap client-state-search">
                        <Search size={15} aria-hidden="true" />
                        <input value={stateSearch} onChange={(event) => setStateSearch(event.target.value)} placeholder="Buscar estado ou UF..." />
                        {stateSearch && <button type="button" aria-label="Limpar busca de estados" onClick={() => setStateSearch("")}><X size={14} /></button>}
                    </span>
                </div>
                <div className="client-state-popover__body">
                    <label className={`client-state-checkbox client-state-checkbox--all${allStatesSelected ? " active" : ""}${someStatesSelected ? " indeterminate" : ""}`}>
                        <input
                            type="checkbox"
                            checked={allStatesSelected}
                            ref={(input) => {
                                if (input) {
                                    input.indeterminate = someStatesSelected;
                                }
                            }}
                            onChange={toggleAllDraftStates}
                        />
                        <span title="Todos os estados">Todos os estados</span>
                    </label>
                    <div className="client-state-checkbox-grid">
                        {visibleStateOptions.map((state) => (
                            <label key={state} className={`client-state-checkbox${draftFilters.stateFilters.includes(state) ? " active" : ""}`}>
                                <input type="checkbox" checked={draftFilters.stateFilters.includes(state)} onChange={() => toggleDraftStateFilter(state)} />
                                <strong title={stateNames[state]}>{state}</strong>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="client-popover-footer">
                    <span>{draftFilters.stateFilters.length.toLocaleString("pt-BR")} selecionados</span>
                    <button type="button" className="ghost-button" onClick={cancelStatesPopover}>Cancelar</button>
                    <button type="button" className="primary-button" onClick={applyStatesPopover} disabled={!hasPendingStateChanges}>Aplicar</button>
                </div>
            </div>
            </FloatingPortal>
        )
        : null;
    const citiesPopover = citiesDropdownOpen && citiesPopoverPosition && canRenderPortal
        ? createPortal(
            <div
                ref={citiesPopoverRef}
                className="client-filter-popover client-city-popover"
                style={{ top: citiesPopoverPosition.top, left: citiesPopoverPosition.left, width: citiesPopoverPosition.width, maxHeight: citiesPopoverPosition.maxHeight }}
            >
                <span className="client-input-wrap client-state-search">
                    <Search size={15} aria-hidden="true" />
                    <input value={citySearch} onChange={(event) => setCitySearch(event.target.value)} placeholder="Buscar cidade..." />
                    {citySearch && <button type="button" aria-label="Limpar busca de cidades" onClick={() => setCitySearch("")}><X size={14} /></button>}
                </span>
                <div className="client-city-checkbox-list">
                    {cityOptionsLoading ? (
                        <span className="client-city-empty">Carregando cidades...</span>
                    ) : cityOptionsError ? (
                        <span className="client-city-empty">{cityOptionsError}</span>
                    ) : visibleCityGroups.length === 0 ? (
                        <span className="client-city-empty">
                            {draftFilters.stateFilters.length > 0 ? "Nenhuma cidade cadastrada para os estados selecionados." : "Nenhuma cidade encontrada."}
                        </span>
                    ) : (
                        visibleCityGroups.map((group) => (
                            <div key={group.state} className="client-city-group">
                                <strong>{group.state}</strong>
                                {group.cities.map((option) => (
                                    <label key={`${option.estado}-${option.cidade}`} className={`client-state-checkbox${draftFilters.cityFilters.includes(option.cidade) ? " active" : ""}`}>
                                        <input type="checkbox" checked={draftFilters.cityFilters.includes(option.cidade)} onChange={() => toggleDraftCityFilter(option.cidade)} />
                                        <span>{option.cidade}</span>
                                        <small>{option.quantidadeClientes.toLocaleString("pt-BR")} {option.quantidadeClientes === 1 ? "cliente" : "clientes"}</small>
                                    </label>
                                ))}
                            </div>
                        ))
                    )}
                </div>
                <div className="client-popover-footer">
                    <span>{draftFilters.cityFilters.length.toLocaleString("pt-BR")} selecionadas</span>
                    <button type="button" className="ghost-button" onClick={cancelCitiesPopover}>Cancelar</button>
                    <button type="button" className="primary-button" onClick={() => setCitiesDropdownOpen(false)}>Aplicar</button>
                </div>
            </div>,
            document.body,
        )
        : null;

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

            <div className={`client-filter-shell${hasActiveFilters ? " has-active-filters" : ""}`}>
            <div className="client-filter-topbar">
                <div className="client-search-control">
                    <Search size={18} aria-hidden="true" />
                    <input
                        type="search"
                        value={draftFilters.search}
                        onChange={(event) => updateDraftFilter("search", event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                applyFilters();
                            }
                        }}
                        placeholder="Pesquisar por nome, CPF/CNPJ, telefone ou email..."
                        aria-label="Pesquisar clientes"
                    />
                    {draftFilters.search && (
                        <button type="button" aria-label="Limpar pesquisa" onClick={() => clearDraftFilter("search")}>
                            <X size={15} aria-hidden="true" />
                        </button>
                    )}
                </div>
                <div className="client-filter-topbar__actions">
                    <button type="button" className="secondary-button client-filter-toggle" onClick={() => setFiltersOpen((current) => !current)} aria-expanded={filtersOpen}>
                        <ListFilter size={18} aria-hidden="true" />
                        <span>Filtros</span>
                        {activeFilterCount > 0 && <strong>{activeFilterCount}</strong>}
                        <ChevronDown className={filtersOpen ? "is-open" : undefined} size={16} aria-hidden="true" />
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
                <div className="client-filter-panel">
                    <div className="client-filter-grid client-filter-grid--clean">
                    <section className="client-filter-group client-filter-group--order">
                        <h3>Ordenacao</h3>
                        <div className="client-popover-field client-popover-field--order" ref={orderDropdownRef}>
                            <button type="button" className={`client-select-trigger${orderDropdownOpen ? " active" : ""}`} onClick={toggleOrderPopover} aria-expanded={orderDropdownOpen}>
                                <span>{selectedOrderLabel}</span>
                                <ChevronDown size={16} aria-hidden="true" />
                            </button>
                        </div>
                    </section>
                    <section className="client-filter-group client-filter-group--status">
                        <h3>Status</h3>
                        <div className="client-segmented-control" role="radiogroup" aria-label="Status dos clientes">
                            {[
                                { value: "all", label: "Todos" },
                                { value: "active", label: "Ativos" },
                                { value: "inactive", label: "Inativos" },
                            ].map((option) => (
                                <button
                                    type="button"
                                    key={option.value}
                                    className={draftFilters.statusFilter === option.value ? "active" : undefined}
                                    aria-pressed={draftFilters.statusFilter === option.value}
                                    onClick={() => updateDraftFilter("statusFilter", option.value as StatusFilter)}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </section>
                    <section className="client-filter-group client-filter-group--type">
                        <h3>Tipo de cliente</h3>
                        <div className="client-segmented-control client-segmented-control--type" role="radiogroup" aria-label="Tipo de cliente">
                            {[
                                { value: "all", label: "Todos" },
                                { value: "PF", label: "Pessoa fisica" },
                                { value: "PJ", label: "Pessoa juridica" },
                            ].map((option) => (
                                <button
                                    type="button"
                                    key={option.value}
                                    className={draftFilters.typeFilter === option.value ? "active" : undefined}
                                    aria-pressed={draftFilters.typeFilter === option.value}
                                    onClick={() => updateDraftFilter("typeFilter", option.value as TypeFilter)}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </section>
                    <section className="client-filter-group client-filter-group--state">
                            <div className="client-popover-field client-popover-field--state" ref={statesDropdownRef}>
                                <h3>Estado</h3>
                                <button
                                    type="button"
                                    ref={(node) => {
                                        stateTriggerRef.current = node;
                                        stateFloating.refs.setReference(node);
                                    }}
                                    className={`client-multiselect-trigger${statesDropdownOpen ? " active" : ""}`}
                                    onClick={toggleStatesPopover}
                                    aria-expanded={statesDropdownOpen}
                                >
                                    <span>{stateSummary.text}</span>
                                    {draftFilters.stateFilters.length > 0 && (
                                        <span className="client-trigger-clear" aria-label="Limpar estados" onClick={(event) => { event.stopPropagation(); updateDraftFilter("stateFilters", []); }}>
                                            <X size={14} aria-hidden="true" />
                                        </span>
                                    )}
                                    <ChevronDown size={16} aria-hidden="true" />
                                </button>
                            </div>
                    </section>
                    <section className="client-filter-group client-filter-group--city">
                            <div className="client-popover-field client-popover-field--city" ref={citiesDropdownRef}>
                                <h3>Cidade</h3>
                                <button type="button" className={`client-multiselect-trigger${citiesDropdownOpen ? " active" : ""}`} onClick={toggleCitiesPopover}>
                                    <span>{citySummary}</span>
                                    {draftFilters.cityFilters.length > 0 && (
                                        <span className="client-trigger-clear" aria-label="Limpar cidades" onClick={(event) => { event.stopPropagation(); updateDraftFilter("cityFilters", []); }}>
                                            <X size={14} aria-hidden="true" />
                                        </span>
                                    )}
                                    <ChevronDown size={16} aria-hidden="true" />
                                </button>
                            </div>
                    </section>
                    </div>
                    <div className="client-filter-footer">
                        {visibleFilterChips.length > 0 && (
                            <div className="client-active-filter-chips" aria-label="Filtros selecionados">
                                {visibleFilterChips.map((chip) => (
                                    <button type="button" key={chip.key} onClick={chip.onClear}>
                                        {chip.label}
                                        <X size={13} aria-hidden="true" />
                                    </button>
                                ))}
                                {hiddenFilterChipCount > 0 && <span>+{hiddenFilterChipCount}</span>}
                            </div>
                        )}
                        <div className="client-filter-actions">
                            <button type="button" className="secondary-button client-filter-clear-button" onClick={resetFilters} disabled={countActiveClientFilters(draftFilters) === 0 && activeFilterCount === 0}>
                                <RotateCcw size={17} aria-hidden="true" />
                                Limpar filtros
                            </button>
                            <button type="button" className="primary-button" onClick={() => applyFilters()} disabled={isApplyingFilters}>
                                <Search size={17} aria-hidden="true" />
                                {isApplyingFilters ? "Aplicando..." : "Aplicar filtros"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </div>
            {orderPopover}
            {statesPopover}
            {citiesPopover}

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
                hasActiveFilters ? (
                <div className="empty-state client-filter-empty-state">
                    <div className="empty-state__icon" aria-hidden="true">
                        <Search size={24} />
                    </div>
                    <strong>Nenhum cliente encontrado com os filtros atuais.</strong>
                    <span>Ajuste os campos ou limpe os filtros para ampliar a busca.</span>
                    <button type="button" className="secondary-button" onClick={resetFilters}>
                        <RotateCcw size={18} aria-hidden="true" />
                        Limpar filtros
                    </button>
                </div>
                ) : (
                <EmptyState
                    message="Nenhum cliente cadastrado."
                    description="Cadastre o primeiro cliente para iniciar suas vendas."
                    actionLabel={canEditClient ? "Cadastrar Cliente" : undefined}
                    onAction={canEditClient ? () => { setClientDetailsError(null); setEditingClient(null); setShowForm(true); } : undefined}
                />
                )
            ) : (
                <>
                    {hasActiveFilters && (
                        <div className="client-filter-result-note">
                            Exibindo {filteredClients.length.toLocaleString("pt-BR")} clientes com os filtros aplicados.
                        </div>
                    )}
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
