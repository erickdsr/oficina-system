import { useEffect, useMemo, useState } from "react";
import EmptyState from "../../components/common/EmptyState";
import LoadingState from "../../components/common/LoadingState";
import PageHeader from "../../components/common/PageHeader";
import SearchInput from "../../components/common/SearchInput";
import StatusBadge from "../../components/common/StatusBadge";
import { useAuth } from "../../context/auth.context";
import { getApiErrorMessage } from "../../services/api";
import useEmployee from "../../hooks/useEmployee";
import type { Employee, EmployeeRequest } from "../../types/employee.types";
import { canDelete, canManage } from "../../utils/permissions";
import EmployeeForm from "./EmployeeForm";

export function EmployeeList() {
    const { user } = useAuth();
    const { employees, loading, error, setError, fetchAll, create, update, remove } = useEmployee();
    const [search, setSearch] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        void fetchAll().catch(() => undefined);
    }, [fetchAll]);

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
            await fetchAll();
        } catch (submitError) {
            setFormError(getApiErrorMessage(submitError, "Nao foi possivel salvar o funcionario."));
        } finally {
            setSubmitting(false);
        }
    }

    async function handleRemove(employee: Employee) {
        if (!window.confirm(`Excluir funcionario ${employee.name}?`)) {
            return;
        }
        try {
            await remove(employee.id);
            await fetchAll();
        } catch (removeError) {
            setError(getApiErrorMessage(removeError, "Nao foi possivel excluir o funcionario."));
        }
    }

    return (
        <section className="page-section">
            <PageHeader
                eyebrow="Equipe"
                title="Funcionarios"
                description="Gerencie usuarios e perfis de acesso."
                action={canManage(user?.role, ["admin", "gerente"]) && <button type="button" className="primary-button" onClick={() => setShowForm(true)}>Novo funcionario</button>}
            />
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar funcionario..." />
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
                                        {canManage(user?.role, ["admin", "gerente"]) && <button type="button" className="secondary-button" onClick={() => { setEditingEmployee(employee); setShowForm(true); }}>Editar</button>}
                                        {canDelete(user?.role) && <button type="button" className="danger-button" onClick={() => void handleRemove(employee)}>Excluir</button>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}

export default EmployeeList;
