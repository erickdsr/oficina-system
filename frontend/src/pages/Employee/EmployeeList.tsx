import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Plus, ShieldCheck, Trash2, UserCheck, UserRoundX, Users, X } from "lucide-react";
import EmptyState from "../../components/common/EmptyState";
import ConfirmDeleteModal from "../../components/common/ConfirmDeleteModal";
import { ActiveFilterChips, FilterPanel, FilterResultSummary, FilterSegmentedControl, FilterSelect } from "../../components/common/FilterPanel";
import LoadingState from "../../components/common/LoadingState";
import PageHeader from "../../components/common/PageHeader";
import StatusBadge from "../../components/common/StatusBadge";
import { useAuth } from "../../context/auth.context";
import { getApiErrorMessage } from "../../services/api";
import employeeService from "../../services/employee.service";
import useEmployee from "../../hooks/useEmployee";
import type { DeletionReport } from "../../types/api.types";
import type { Employee, EmployeeRequest } from "../../types/employee.types";
import { canDelete, canManage, normalizeRole } from "../../utils/permissions";
import { displayValue, formatCpf, formatDateTime, formatPhone } from "../../utils/formatters";
import { normalizeSearch } from "../../utils/text";
import EmployeeForm, { roleLabel, type EmployeeFormPayload } from "./EmployeeForm";

type EmployeeSortKey = "name" | "role" | "status";
type SortDirection = "asc" | "desc";
type EmployeeStatusFilter = "all" | "active" | "inactive";

interface EmployeeFilters {
    search: string;
    roleFilter: string;
    statusFilter: EmployeeStatusFilter;
    sortKey: EmployeeSortKey;
    sortDirection: SortDirection;
}

const defaultEmployeeFilters: EmployeeFilters = {
    search: "",
    roleFilter: "all",
    statusFilter: "all",
    sortKey: "name",
    sortDirection: "asc",
};

interface EmployeeTableRowProps {
    employee: Employee;
    selected: boolean;
    canEdit: boolean;
    canRemove: boolean;
    onView: (employee: Employee) => void;
    onEdit: (employee: Employee) => void;
    onDelete: (employee: Employee) => void;
}

const avatarColors = [
    "blue",
    "green",
    "orange",
    "purple",
    "red",
] as const;

function employeeInitials(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? "U";
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : parts[0]?.[1] ?? "";
    return `${first}${last}`.toUpperCase();
}

function avatarTone(name: string) {
    const total = Array.from(name).reduce((sum, character) => sum + character.charCodeAt(0), 0);
    return avatarColors[total % avatarColors.length];
}

function roleTone(roleName: string) {
    const role = normalizeRole(roleName) ?? roleName.toUpperCase();
    if (role === "ADMIN") {
        return "admin";
    }
    if (role === "MANAGER") {
        return "manager";
    }
    if (role === "SALESPERSON") {
        return "sales";
    }
    if (role === "STOCK") {
        return "stock";
    }
    if (role === "BUYER") {
        return "buyer";
    }
    return "stock";
}

function employeeStatus(employee: Employee) {
    return employee.status
        ? { label: "Ativo", tone: "success" as const }
        : { label: "Inativo", tone: "muted" as const };
}

function lastAccessLabel() {
    return "Preparado para auditoria";
}

function EmployeeAvatar({ employee, size = "md" }: { employee: Employee; size?: "md" | "lg" }) {
    return (
        <div className={`employee-avatar employee-avatar--${avatarTone(employee.name)} employee-avatar--${size}`} aria-hidden="true">
            {employeeInitials(employee.name)}
        </div>
    );
}

const EmployeeTableRow = memo(function EmployeeTableRow({
    employee,
    selected,
    canEdit,
    canRemove,
    onView,
    onEdit,
    onDelete,
}: EmployeeTableRowProps) {
    const status = employeeStatus(employee);

    return (
        <tr className={`employee-row${selected ? " employee-row--selected" : ""}`} onClick={() => onView(employee)}>
            <td>
                <div className="employee-name-cell">
                    <EmployeeAvatar employee={employee} />
                    <div>
                        <strong>{employee.name}</strong>
                        <span>{employee.email}</span>
                    </div>
                </div>
            </td>
            <td><span className={`employee-role-badge ${roleTone(employee.roleName)}`}>{roleLabel(employee.roleName)}</span></td>
            <td>
                <div className="employee-contact-cell">
                    <strong>{formatPhone(employee.phone)}</strong>
                </div>
            </td>
            <td><span className="employee-last-access">{lastAccessLabel()}</span></td>
            <td><StatusBadge label={status.label} tone={status.tone} /></td>
            <td className="employee-actions-cell">
                <div className="table-actions employee-actions">
                    <button
                        type="button"
                        className="table-action-button tooltip-button"
                        aria-label={`Visualizar funcionario ${employee.name}`}
                        title="Visualizar funcionario"
                        data-tooltip="Visualizar funcionario"
                        onClick={(event) => {
                            event.stopPropagation();
                            onView(employee);
                        }}
                    >
                        <Eye size={22} strokeWidth={2.3} aria-hidden="true" />
                    </button>
                    {canEdit && (
                        <button
                            type="button"
                            className="table-action-button table-action-button--edit tooltip-button"
                            aria-label={`Editar funcionario ${employee.name}`}
                            title="Editar funcionario"
                            data-tooltip="Editar funcionario"
                            onClick={(event) => {
                                event.stopPropagation();
                                onEdit(employee);
                            }}
                        >
                            <Pencil size={22} strokeWidth={2.3} aria-hidden="true" />
                        </button>
                    )}
                    {canRemove && (
                        <button
                            type="button"
                            className="table-action-button table-action-button--delete tooltip-button"
                            aria-label={`Excluir funcionario ${employee.name}`}
                            title="Excluir funcionario"
                            data-tooltip="Excluir funcionario"
                            onClick={(event) => {
                                event.stopPropagation();
                                onDelete(employee);
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

export function EmployeeList() {
    const { user } = useAuth();
    const { employees, loading, error, setError, fetchAll, create, update, remove, forceDelete } = useEmployee();
    const [appliedFilters, setAppliedFilters] = useState<EmployeeFilters>(defaultEmployeeFilters);
    const [draftFilters, setDraftFilters] = useState<EmployeeFilters>(defaultEmployeeFilters);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [isApplyingFilters, setIsApplyingFilters] = useState(false);
    const sortKey = appliedFilters.sortKey;
    const sortDirection = appliedFilters.sortDirection;
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
    const [employeeToView, setEmployeeToView] = useState<Employee | null>(null);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [deletionReport, setDeletionReport] = useState<DeletionReport | null>(null);
    const [showForm, setShowForm] = useState(false);

    const canEditEmployee = canManage(user?.role, ["ADMIN"]);
    const canDeleteEmployee = canDelete(user?.role, ["ADMIN"]);

    useEffect(() => {
        void fetchAll(appliedFilters.statusFilter !== "active").catch(() => undefined);
    }, [appliedFilters.statusFilter, fetchAll]);

    const employeeStats = useMemo(() => {
        const activeCount = employees.filter((employee) => employee.status).length;
        const inactiveCount = employees.length - activeCount;
        const roleCount = new Set(employees.map((employee) => normalizeRole(employee.roleName) ?? employee.roleName)).size;

        return {
            activeCount,
            inactiveCount,
            roleCount,
            lastAccess: "Preparado para auditoria",
        };
    }, [employees]);

    const filteredEmployees = useMemo(() => {
        const term = normalizeSearch(appliedFilters.search);

        return [...employees]
            .filter((employee) => {
                const normalizedRole = normalizeRole(employee.roleName) ?? employee.roleName;
                const fields = [
                    employee.name,
                    employee.email,
                    employee.phone,
                    employee.cpf,
                    roleLabel(employee.roleName),
                    normalizedRole,
                ].map(normalizeSearch);

                if (term && !fields.some((field) => field.includes(term))) {
                    return false;
                }

                if (appliedFilters.roleFilter !== "all" && normalizedRole !== appliedFilters.roleFilter) {
                    return false;
                }

                if (appliedFilters.statusFilter === "active" && !employee.status) {
                    return false;
                }

                if (appliedFilters.statusFilter === "inactive" && employee.status) {
                    return false;
                }

                return true;
            })
            .sort((left, right) => {
                let comparison: number;
                if (sortKey === "role") {
                    comparison = roleLabel(left.roleName).localeCompare(roleLabel(right.roleName), "pt-BR", { sensitivity: "base" });
                } else if (sortKey === "status") {
                    comparison = Number(left.status) - Number(right.status);
                } else {
                    comparison = left.name.localeCompare(right.name, "pt-BR", { sensitivity: "base" });
                }

                return sortDirection === "asc" ? comparison : -comparison;
            });
    }, [appliedFilters.roleFilter, appliedFilters.search, appliedFilters.statusFilter, employees, sortDirection, sortKey]);

    useEffect(() => {
        setPage(1);
    }, [appliedFilters, pageSize]);

    const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const pageStart = filteredEmployees.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const pageEnd = Math.min(currentPage * pageSize, filteredEmployees.length);
    const paginatedEmployees = useMemo(
        () => filteredEmployees.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [currentPage, filteredEmployees, pageSize],
    );
    const visiblePages = useMemo(() => {
        const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
        const end = Math.min(totalPages, start + 4);
        return Array.from({ length: end - start + 1 }, (_, index) => start + index);
    }, [currentPage, totalPages]);

    async function handleSubmit(data: EmployeeFormPayload) {
        setSubmitting(true);
        setFormError(null);
        try {
            const employeePayload: EmployeeRequest = {
                name: data.name,
                cpf: data.cpf,
                email: data.email,
                password: data.password,
                roleName: data.roleName,
                phone: data.phone,
                status: data.status,
            };

            if (editingEmployee) {
                await update(editingEmployee.id, employeePayload);
            } else {
                await create(employeePayload);
            }
            setShowForm(false);
            setEditingEmployee(null);
            await fetchAll(appliedFilters.statusFilter !== "active");
        } catch (submitError) {
            setFormError(getApiErrorMessage(submitError, "Nao foi possivel salvar o funcionario."));
        } finally {
            setSubmitting(false);
        }
    }

    const handleViewClick = useCallback((employee: Employee) => {
        setSelectedEmployeeId(employee.id);
        setEmployeeToView(employee);
    }, []);

    const handleEditClick = useCallback((employee: Employee) => {
        setEditingEmployee(employee);
        setShowForm(true);
    }, []);

    async function handleDeleteClick(employee: Employee) {
        setDeleteError(null);
        setError(null);
        setEmployeeToDelete(employee);
        setDeletionReport(null);
        try {
            setDeletionReport(await employeeService.getDeletionReport(employee.id));
        } catch (reportError) {
            setDeleteError(getApiErrorMessage(reportError, "Nao foi possivel carregar os vinculos do funcionario."));
        }
    }

    async function handleConfirmDelete() {
        if (!employeeToDelete || isDeleting) {
            return;
        }

        setIsDeleting(true);
        setDeleteError(null);
        try {
            await remove(employeeToDelete.id);
            await fetchAll(appliedFilters.statusFilter !== "active");
            setEmployeeToDelete(null);
            setDeletionReport(null);
        } catch (removeError) {
            setDeleteError(getApiErrorMessage(removeError, "Nao foi possivel excluir o funcionario. Tente novamente."));
        } finally {
            setIsDeleting(false);
        }
    }

    async function handleForceDelete() {
        if (!employeeToDelete || isDeleting) {
            return;
        }

        setIsDeleting(true);
        setDeleteError(null);
        try {
            await forceDelete(employeeToDelete.id);
            await fetchAll(appliedFilters.statusFilter !== "active");
            setEmployeeToDelete(null);
            setDeletionReport(null);
        } catch (removeError) {
            setDeleteError(getApiErrorMessage(removeError, "Nao foi possivel excluir definitivamente o funcionario."));
        } finally {
            setIsDeleting(false);
        }
    }

    function handleCancelDelete() {
        if (isDeleting) {
            return;
        }

        setEmployeeToDelete(null);
        setDeleteError(null);
        setDeletionReport(null);
    }

    function handleSort(nextSortKey: EmployeeSortKey) {
        if (sortKey === nextSortKey) {
            const nextDirection = sortDirection === "asc" ? "desc" : "asc";
            setAppliedFilters((current) => ({ ...current, sortDirection: nextDirection }));
            setDraftFilters((current) => ({ ...current, sortDirection: nextDirection }));
            return;
        }

        setAppliedFilters((current) => ({ ...current, sortKey: nextSortKey, sortDirection: "asc" }));
        setDraftFilters((current) => ({ ...current, sortKey: nextSortKey, sortDirection: "asc" }));
    }

    function sortIndicator(targetSortKey: EmployeeSortKey) {
        if (sortKey !== targetSortKey) {
            return "";
        }

        return sortDirection === "asc" ? " ^" : " v";
    }

    function resetFilters() {
        setDraftFilters(defaultEmployeeFilters);
        setAppliedFilters(defaultEmployeeFilters);
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
            appliedFilters.roleFilter !== defaultEmployeeFilters.roleFilter,
            appliedFilters.statusFilter !== defaultEmployeeFilters.statusFilter,
            appliedFilters.sortKey !== defaultEmployeeFilters.sortKey || appliedFilters.sortDirection !== defaultEmployeeFilters.sortDirection,
        ].filter(Boolean).length;
    }, [appliedFilters]);

    const draftActiveFilterCount = useMemo(() => {
        return [
            draftFilters.search.trim() !== "",
            draftFilters.roleFilter !== defaultEmployeeFilters.roleFilter,
            draftFilters.statusFilter !== defaultEmployeeFilters.statusFilter,
            draftFilters.sortKey !== defaultEmployeeFilters.sortKey || draftFilters.sortDirection !== defaultEmployeeFilters.sortDirection,
        ].filter(Boolean).length;
    }, [draftFilters]);

    const hasActiveFilters = activeFilterCount > 0;

    return (
        <section className="page-section employee-page">
            <PageHeader
                eyebrow="Equipe"
                title="Funcionarios"
                description="Gerencie colaboradores, perfis de acesso e permissoes do sistema."
            />

            <div className="supplier-stats-row employee-stats-row">
                <div className="metric-card supplier-metric-card employee-metric-card success">
                    <UserCheck size={18} aria-hidden="true" />
                    <span>Funcionarios Ativos</span>
                    <strong>{employeeStats.activeCount.toLocaleString("pt-BR")}</strong>
                    <small>Usuarios com acesso ao sistema</small>
                </div>
                <div className="metric-card supplier-metric-card employee-metric-card">
                    <UserRoundX size={18} aria-hidden="true" />
                    <span>Funcionarios Inativos</span>
                    <strong>{employeeStats.inactiveCount.toLocaleString("pt-BR")}</strong>
                    <small>Sem acesso ativo</small>
                </div>
                <div className="metric-card supplier-metric-card employee-metric-card">
                    <ShieldCheck size={18} aria-hidden="true" />
                    <span>Perfis de Acesso</span>
                    <strong>{employeeStats.roleCount.toLocaleString("pt-BR")}</strong>
                    <small>Administrador, Vendedor, Estoquista...</small>
                </div>
                <div className="metric-card supplier-metric-card employee-metric-card">
                    <Users size={18} aria-hidden="true" />
                    <span>Ultimo acesso</span>
                    <strong className="is-muted">{employeeStats.lastAccess}</strong>
                    <small>Aguardando auditoria de login</small>
                </div>
            </div>

            <FilterPanel
                search={draftFilters.search}
                searchPlaceholder="Pesquisar por nome, CPF, email ou funcao..."
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
                        {draftFilters.statusFilter !== "all" && <button type="button" onClick={() => setDraftFilters((current) => ({ ...current, statusFilter: "all" }))}>{draftFilters.statusFilter === "active" ? "Ativos" : "Inativos"} <X size={13} aria-hidden="true" /></button>}
                        {draftFilters.roleFilter !== "all" && <button type="button" onClick={() => setDraftFilters((current) => ({ ...current, roleFilter: "all" }))}>{roleLabel(draftFilters.roleFilter)} <X size={13} aria-hidden="true" /></button>}
                    </ActiveFilterChips>
                )}
                primaryAction={canEditEmployee && (
                        <button type="button" className="primary-button" onClick={() => { setEditingEmployee(null); setShowForm(true); }}>
                            <Plus size={20} aria-hidden="true" />
                            Novo funcionario
                        </button>
                )}
            >
                <FilterSelect
                    label="Ordenacao"
                    value={draftFilters.sortKey}
                    onChange={(sortKey) => setDraftFilters((current) => ({ ...current, sortKey }))}
                    options={[
                        { value: "name", label: "Nome" },
                        { value: "role", label: "Perfil" },
                        { value: "status", label: "Status" },
                    ]}
                />
                <FilterSegmentedControl
                    label="Status"
                    value={draftFilters.statusFilter}
                    onChange={(statusFilter) => setDraftFilters((current) => ({ ...current, statusFilter }))}
                    options={[
                        { value: "all", label: "Todos" },
                        { value: "active", label: "Ativos" },
                        { value: "inactive", label: "Inativos" },
                    ]}
                />
                <FilterSelect
                    label="Perfil"
                    value={draftFilters.roleFilter}
                    onChange={(roleFilter) => setDraftFilters((current) => ({ ...current, roleFilter }))}
                    options={[
                        { value: "all", label: "Todos" },
                        { value: "ADMIN", label: "Administrador" },
                        { value: "MANAGER", label: "Gerente" },
                        { value: "SALESPERSON", label: "Vendedor" },
                        { value: "BUYER", label: "Comprador" },
                        { value: "STOCK", label: "Estoquista" },
                    ]}
                />
            </FilterPanel>

            {showForm && (
                <EmployeeForm
                    employee={editingEmployee}
                    loading={submitting}
                    error={formError}
                    onCancel={() => {
                        setShowForm(false);
                        setEditingEmployee(null);
                    }}
                    onSubmit={handleSubmit}
                />
            )}
            {error && <div className="form-error">{error}</div>}
            {loading ? <LoadingState /> : filteredEmployees.length === 0 ? (
                <EmptyState
                    message={hasActiveFilters ? "Nenhum funcionario encontrado com os filtros atuais." : "Nenhum funcionario cadastrado."}
                    description={hasActiveFilters ? "Ajuste a pesquisa ou os filtros para localizar um colaborador." : 'Clique em "Novo Funcionario" para adicionar o primeiro colaborador.'}
                    actionLabel={hasActiveFilters ? "Limpar filtros" : canEditEmployee ? "Novo Funcionario" : undefined}
                    onAction={hasActiveFilters ? resetFilters : canEditEmployee ? () => setShowForm(true) : undefined}
                />
            ) : (
                <>
                <FilterResultSummary total={filteredEmployees.length} noun="funcionarios" hasActiveFilters={hasActiveFilters} />
                <div className="table-wrap employee-table-wrap">
                    <table className="data-table employee-table">
                        <thead>
                            <tr>
                                <th><button type="button" className="table-sort-button" onClick={() => handleSort("name")}>Funcionario{sortIndicator("name")}</button></th>
                                <th><button type="button" className="table-sort-button" onClick={() => handleSort("role")}>Perfil{sortIndicator("role")}</button></th>
                                <th>Contato</th>
                                <th>Ultimo acesso</th>
                                <th><button type="button" className="table-sort-button" onClick={() => handleSort("status")}>Status{sortIndicator("status")}</button></th>
                                <th>Acoes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedEmployees.map((employee) => (
                                <EmployeeTableRow
                                    key={employee.id}
                                    employee={employee}
                                    selected={selectedEmployeeId === employee.id}
                                    canEdit={canEditEmployee}
                                    canRemove={canDeleteEmployee}
                                    onView={handleViewClick}
                                    onEdit={handleEditClick}
                                    onDelete={handleDeleteClick}
                                />
                            ))}
                        </tbody>
                    </table>
                    <div className="supplier-pagination employee-pagination">
                        <span>Mostrando {pageStart}-{pageEnd} de {filteredEmployees.length.toLocaleString("pt-BR")} funcionarios</span>
                        <label>
                            <select aria-label="Registros por pagina" value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
                                {[10, 20, 50, 100].map((size) => (
                                    <option key={size} value={size}>{size}</option>
                                ))}
                            </select>
                        </label>
                        <div className="supplier-pagination__pages" aria-label="Paginacao de funcionarios">
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
                isOpen={employeeToDelete !== null}
                title="Excluir funcionario"
                itemName={employeeToDelete?.name}
                description="Esta acao nao podera ser desfeita."
                confirmLabel="Excluir funcionario"
                isLoading={isDeleting}
                error={deleteError}
                report={deletionReport}
                userRole={user?.role}
                onConfirm={handleConfirmDelete}
                onForceConfirm={handleForceDelete}
                onCancel={handleCancelDelete}
            />

            {employeeToView && (
                <div className="modal-overlay" role="presentation" onMouseDown={(event) => {
                    if (event.target === event.currentTarget) {
                        setEmployeeToView(null);
                    }
                }}>
                    <aside className="employee-detail-modal" role="dialog" aria-modal="true" aria-label="Visualizar funcionario">
                        <div className="supplier-detail-modal__header">
                            <div className="employee-detail-heading">
                                <EmployeeAvatar employee={employeeToView} size="lg" />
                                <div>
                                    <span>Visualizar funcionario</span>
                                    <h2>{employeeToView.name}</h2>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="table-action-button tooltip-button"
                                aria-label="Fechar detalhes"
                                title="Fechar"
                                data-tooltip="Fechar"
                                onClick={() => setEmployeeToView(null)}
                            >
                                <X size={19} aria-hidden="true" />
                            </button>
                        </div>
                        <section className="supplier-detail-section">
                            <h3>Dados pessoais</h3>
                            <dl className="supplier-detail-grid employee-detail-grid">
                                <div className="span-2"><dt>Nome</dt><dd>{displayValue(employeeToView.name)}</dd></div>
                                <div><dt>CPF</dt><dd>{formatCpf(employeeToView.cpf)}</dd></div>
                                <div><dt>Telefone</dt><dd>{formatPhone(employeeToView.phone)}</dd></div>
                                <div className="span-2"><dt>Email</dt><dd>{displayValue(employeeToView.email)}</dd></div>
                            </dl>
                        </section>

                        <section className="supplier-detail-section">
                            <h3>Acesso</h3>
                            <dl className="supplier-detail-grid employee-detail-grid">
                                <div><dt>Perfil</dt><dd><span className={`employee-role-badge ${roleTone(employeeToView.roleName)}`}>{roleLabel(employeeToView.roleName)}</span></dd></div>
                                <div><dt>Status</dt><dd><StatusBadge label={employeeStatus(employeeToView).label} tone={employeeStatus(employeeToView).tone} /></dd></div>
                                <div><dt>Ultimo acesso</dt><dd>Nao disponivel</dd></div>
                                <div><dt>Data de criacao</dt><dd>{formatDateTime(employeeToView.createdAt)}</dd></div>
                                <div><dt>Ultima alteracao</dt><dd>{formatDateTime(employeeToView.updatedAt)}</dd></div>
                                <div className="span-2"><dt>Acessos</dt><dd>Definidos automaticamente pelo perfil {roleLabel(employeeToView.roleName)}.</dd></div>
                            </dl>
                        </section>
                    </aside>
                </div>
            )}
        </section>
    );
}

export default EmployeeList;
