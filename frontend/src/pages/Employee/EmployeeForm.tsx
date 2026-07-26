import { useEffect, useState, type FormEvent } from "react";
import type { Employee, EmployeeRequest } from "../../types/employee.types";
import { normalizeRole } from "../../utils/permissions";

interface EmployeeFormProps {
    employee?: Employee | null;
    loading?: boolean;
    error?: string | null;
    onCancel: () => void;
    onSubmit: (employee: EmployeeRequest) => Promise<void>;
}

const initialForm: EmployeeRequest = {
    name: "",
    cpf: "",
    email: "",
    password: "",
    roleName: "SALESPERSON",
    phone: "",
    status: true,
};

export function EmployeeForm({ employee, loading = false, error, onCancel, onSubmit }: EmployeeFormProps) {
    const [form, setForm] = useState<EmployeeRequest>(initialForm);
    const [validationError, setValidationError] = useState<string | null>(null);

    useEffect(() => {
        setForm(
            employee
                ? {
                      name: employee.name,
                      cpf: employee.cpf,
                      email: employee.email,
                      password: "",
                      roleName: normalizeRole(employee.roleName) ?? "SALESPERSON",
                      phone: employee.phone,
                      status: employee.status,
                  }
                : initialForm,
        );
        setValidationError(null);
    }, [employee]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!form.name.trim() || !form.cpf.trim() || !form.email.trim()) {
            setValidationError("Informe nome, CPF e e-mail.");
            return;
        }
        if (!employee && !form.password.trim()) {
            setValidationError("Informe a senha do funcionario.");
            return;
        }
        setValidationError(null);
        await onSubmit(form);
    }

    return (
        <form className="entity-form" onSubmit={handleSubmit} noValidate>
            <h3>{employee ? "Editar funcionario" : "Novo funcionario"}</h3>
            <div className="form-grid">
                <label className="form-field">
                    <span>Nome</span>
                    <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                </label>
                <label className="form-field">
                    <span>CPF</span>
                    <input value={form.cpf} onChange={(event) => setForm({ ...form, cpf: event.target.value })} />
                </label>
                <label className="form-field">
                    <span>E-mail</span>
                    <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
                </label>
                <label className="form-field">
                    <span>Senha</span>
                    <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={employee ? "Manter senha atual" : ""} />
                </label>
                <label className="form-field">
                    <span>Perfil</span>
                    <select value={form.roleName} onChange={(event) => setForm({ ...form, roleName: event.target.value })}>
                        <option value="ADMIN">Admin</option>
                        <option value="MANAGER">Gerente</option>
                        <option value="SALESPERSON">Vendedor</option>
                        <option value="STOCK">Estoquista</option>
                    </select>
                </label>
                <label className="form-field">
                    <span>Telefone</span>
                    <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
                </label>
                <label className="checkbox-field">
                    <input type="checkbox" checked={form.status} onChange={(event) => setForm({ ...form, status: event.target.checked })} />
                    Ativo
                </label>
            </div>
            {(validationError || error) && <div className="form-error">{validationError ?? error}</div>}
            <div className="form-actions">
                <button type="button" className="secondary-button" onClick={onCancel}>Cancelar</button>
                <button type="submit" className="primary-button" disabled={loading}>{loading ? "Salvando..." : "Salvar"}</button>
            </div>
        </form>
    );
}

export default EmployeeForm;
