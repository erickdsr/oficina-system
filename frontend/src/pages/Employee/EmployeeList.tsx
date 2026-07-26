import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import EmptyState from "../../components/common/EmptyState";
import ConfirmDeleteModal from "../../components/common/ConfirmDeleteModal";
import LoadingState from "../../components/common/LoadingState";
import PageHeader from "../../components/common/PageHeader";
import SearchInput from "../../components/common/SearchInput";
import StatusBadge from "../../components/common/StatusBadge";
import { useAuth } from "../../context/auth.context";
import { getApiErrorMessage } from "../../services/api";
import employeeService from "../../services/employee.service";
import useEmployee from "../../hooks/useEmployee";
import type { DeletionReport } from "../../types/api.types";
import type { Employee, EmployeeRequest } from "../../types/employee.types";
import { canDelete, canManage } from "../../utils/permissions";
import EmployeeForm from "./EmployeeForm";

export function EmployeeList() {
    const { user } = useAuth();
    const { employees, loading, error, setError, fetchAll, create, update, remove, forceDelete } = useEmployee();
    const [search, setSearch] = useState("");
    const [showInactive, setShowInactive] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [deletionReport, setDeletionReport] = useState<DeletionReport | null>(null);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        void fetchAll(showInactive).catch(() => undefined);
    }, [fetchAll, showInactive]);

    const filteredEmployees = useMemo(() => {
        const term = search.toLowerCase();
        return employees.filter((employee) =>
            [employee.name, employee.email, employee.cpf, employee.roleName].some((value) => value.toLowerCase().includes(term)),
        );
    }, [employees, search]);

    async function handleSubmit(data: EmployeeRequest) {
        setSubmitting(true);
        setFormError(null);
        try {
            if (editingEmployee) {
                await update(editingEmployee.id, data);
            } else {
                await create(data);
            }
            setShowForm(false);
            setEditingEmployee(null);
            await fetchAll(showInactive);
        } catch (submitError) {
            setFormError(getApiErrorMessage(submitError, "Nao foi possivel salvar o funcionario."));
        } finally {
            setSubmitting(false);
        }
    }

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
            await fetchAll(showInactive);
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
            await fetchAll(showInactive);
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

    return (
        <section className="page-section">
            <PageHeader
                eyebrow="Equipe"
                title="Funcionarios"
                description="Gerencie usuarios e perfis de acesso."
                action={canManage(user?.role, ["ADMIN"]) && <button type="button" className="primary-button" onClick={() => setShowForm(true)}>Novo funcionario</button>}
            />
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar funcionario..." />
            <label className="checkbox-field">
                <input type="checkbox" checked={showInactive} onChange={(event) => setShowInactive(event.target.checked)} />
                Mostrar registros desativados
            </label>
            {showForm && <EmployeeForm employee={editingEmployee} loading={submitting} error={formError} onCancel={() => { setShowForm(false); setEditingEmployee(null); }} onSubmit={handleSubmit} />}
            {error && <div className="form-error">{error}</div>}
            {loading ? <LoadingState /> : filteredEmployees.length === 0 ? <EmptyState /> : (
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>E-mail</th>
                                <th>Perfil</th>
                                <th>Telefone</th>
                                <th>Status</th>
                                <th>Acoes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEmployees.map((employee) => (
                                <tr key={employee.id}>
                                    <td>{employee.name}</td>
                                    <td>{employee.email}</td>
                                    <td>{employee.roleName}</td>
                                    <td>{employee.phone}</td>
                                    <td><StatusBadge active={employee.status} /></td>
                                    <td className="table-actions">
                                        {canManage(user?.role, ["ADMIN"]) && (
                                            <button
                                                type="button"
                                                className="table-action-button table-action-button--edit"
                                                aria-label={`Editar funcionario ${employee.name}`}
                                                title="Editar"
                                                onClick={() => { setEditingEmployee(employee); setShowForm(true); }}
                                            >
                                                <Pencil size={20} aria-hidden="true" />
                                            </button>
                                        )}
                                        {canDelete(user?.role, ["ADMIN"]) && (
                                            <button
                                                type="button"
                                                className="table-action-button table-action-button--delete"
                                                aria-label={`Excluir funcionario ${employee.name}`}
                                                title="Excluir"
                                                onClick={() => handleDeleteClick(employee)}
                                            >
                                                <Trash2 size={20} aria-hidden="true" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
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
        </section>
    );
}

export default EmployeeList;
