import { Camera, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import type { Employee, EmployeeRequest } from "../../types/employee.types";
import { normalizeRole } from "../../utils/permissions";

export interface EmployeeFormPayload extends EmployeeRequest {
    photoPreview?: string | null;
    notes?: string;
    permissions: string[];
}

interface EmployeeFormProps {
    employee?: Employee | null;
    loading?: boolean;
    error?: string | null;
    onCancel: () => void;
    onSubmit: (employee: EmployeeFormPayload) => Promise<void>;
}

const permissionOptions = [
    "Produtos",
    "Estoque",
    "Compras",
    "Vendas",
    "Clientes",
    "Fornecedores",
    "Funcionarios",
    "Home",
    "Relatorios",
];

const initialForm: EmployeeFormPayload = {
    name: "",
    cpf: "",
    email: "",
    password: "",
    roleName: "SALESPERSON",
    phone: "",
    status: true,
    photoPreview: null,
    notes: "",
    permissions: ["Home"],
};

export function roleLabel(roleName: string) {
    const role = normalizeRole(roleName) ?? roleName.toUpperCase();
    const labels: Record<string, string> = {
        ADMIN: "Administrador",
        MANAGER: "Gerente",
        SALESPERSON: "Vendedor",
        STOCK: "Estoquista",
        BUYER: "Comprador",
        FINANCE: "Financeiro",
    };
    return labels[role] ?? roleName;
}

function initials(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? "U";
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : parts[0]?.[1] ?? "";
    return `${first}${last}`.toUpperCase();
}

function avatarTone(name: string) {
    const colors = ["blue", "green", "orange", "purple", "red"];
    const total = Array.from(name).reduce((sum, character) => sum + character.charCodeAt(0), 0);
    return colors[total % colors.length];
}

export function EmployeeForm({ employee, loading = false, error, onCancel, onSubmit }: EmployeeFormProps) {
    const [form, setForm] = useState<EmployeeFormPayload>(initialForm);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [validationError, setValidationError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

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
                      photoPreview: null,
                      notes: "",
                      permissions: ["Home"],
                  }
                : initialForm,
        );
        setConfirmPassword("");
        setValidationError(null);
    }, [employee]);

    const selectedPermissions = useMemo(() => new Set(form.permissions), [form.permissions]);

    function updateField<K extends keyof EmployeeFormPayload>(field: K, value: EmployeeFormPayload[K]) {
        setForm((current) => ({ ...current, [field]: value }));
    }

    function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
            setValidationError("Envie uma imagem PNG, JPG ou WEBP.");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            updateField("photoPreview", String(reader.result));
            setValidationError(null);
        };
        reader.readAsDataURL(file);
    }

    function removePhoto() {
        updateField("photoPreview", null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    function togglePermission(permission: string) {
        setForm((current) => {
            const nextPermissions = new Set(current.permissions);
            if (nextPermissions.has(permission)) {
                nextPermissions.delete(permission);
            } else {
                nextPermissions.add(permission);
            }

            return { ...current, permissions: Array.from(nextPermissions) };
        });
    }

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
        if (form.password && form.password !== confirmPassword) {
            setValidationError("A confirmacao de senha nao confere.");
            return;
        }

        setValidationError(null);
        await onSubmit({
            ...form,
            name: form.name.trim(),
            cpf: form.cpf.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            notes: form.notes?.trim(),
        });
    }

    return (
        <form className="entity-form employee-form" onSubmit={handleSubmit} noValidate>
            <div className="entity-form__header employee-form__header">
                <div>
                    <h3>{employee ? "Editar funcionario" : "Novo funcionario"}</h3>
                    <p>Dados pessoais, acesso ao sistema e permissoes operacionais.</p>
                </div>
            </div>

            <section className="employee-form-section employee-photo-section">
                <div className="employee-photo-upload">
                    <button type="button" className="employee-photo-button" onClick={() => fileInputRef.current?.click()}>
                        {form.photoPreview ? (
                            <img src={form.photoPreview} alt="" />
                        ) : (
                            <span className={`employee-avatar employee-avatar--${avatarTone(form.name)} employee-avatar--lg`}>
                                {initials(form.name)}
                            </span>
                        )}
                        <span className="employee-photo-button__icon" aria-hidden="true"><Camera size={18} /></span>
                    </button>
                    <div>
                        <strong>Foto do funcionario</strong>
                        <span>PNG, JPG ou WEBP. A foto substitui automaticamente o avatar por iniciais.</span>
                        <div className="employee-photo-actions">
                            <button type="button" className="secondary-button" onClick={() => fileInputRef.current?.click()}>Selecionar imagem</button>
                            {form.photoPreview && (
                                <button type="button" className="secondary-button" onClick={removePhoto}>
                                    <X size={17} aria-hidden="true" />
                                    Remover
                                </button>
                            )}
                        </div>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handlePhotoChange} hidden />
                </div>
            </section>

            <section className="employee-form-section">
                <h4>Dados pessoais</h4>
                <div className="form-grid">
                    <label className="form-field span-2">
                        <span>Nome completo</span>
                        <input value={form.name} onChange={(event) => updateField("name", event.target.value)} />
                    </label>
                    <label className="form-field">
                        <span>CPF</span>
                        <input inputMode="numeric" value={form.cpf} onChange={(event) => updateField("cpf", event.target.value)} />
                    </label>
                    <label className="form-field">
                        <span>Telefone</span>
                        <input inputMode="tel" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} />
                    </label>
                    <label className="form-field span-2">
                        <span>Email</span>
                        <input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} />
                    </label>
                    <label className="form-field span-2">
                        <span>Observacoes</span>
                        <textarea value={form.notes ?? ""} onChange={(event) => updateField("notes", event.target.value)} />
                    </label>
                </div>
            </section>

            <section className="employee-form-section">
                <h4>Dados de acesso</h4>
                <div className="form-grid">
                    <label className="form-field">
                        <span>Perfil</span>
                        <select value={form.roleName} onChange={(event) => updateField("roleName", event.target.value)}>
                            <option value="ADMIN">Administrador</option>
                            <option value="MANAGER">Gerente</option>
                            <option value="SALESPERSON">Vendedor</option>
                            <option value="BUYER">Comprador</option>
                            <option value="STOCK">Estoquista</option>
                            <option value="FINANCE">Financeiro</option>
                        </select>
                    </label>
                    <label className="form-field">
                        <span>{employee ? "Alterar senha" : "Senha"}</span>
                        <input type="password" value={form.password} onChange={(event) => updateField("password", event.target.value)} placeholder={employee ? "Manter senha atual" : ""} />
                    </label>
                    <label className="form-field">
                        <span>Confirmar senha</span>
                        <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder={employee ? "Confirmar nova senha" : ""} />
                    </label>
                    <label className="checkbox-field supplier-status-field">
                        <input type="checkbox" checked={form.status} onChange={(event) => updateField("status", event.target.checked)} />
                        Ativo
                    </label>
                </div>
            </section>

            <section className="employee-form-section">
                <h4>Permissoes</h4>
                <div className="employee-permission-grid">
                    {permissionOptions.map((permission) => (
                        <label key={permission} className="checkbox-field employee-permission-item">
                            <input type="checkbox" checked={selectedPermissions.has(permission)} onChange={() => togglePermission(permission)} />
                            {permission}
                        </label>
                    ))}
                </div>
            </section>

            {(validationError || error) && <div className="form-error">{validationError ?? error}</div>}
            <div className="form-actions">
                <button type="button" className="secondary-button" onClick={onCancel} disabled={loading}>Cancelar</button>
                <button type="submit" className="primary-button" disabled={loading}>{loading ? "Salvando..." : "Salvar funcionario"}</button>
            </div>
        </form>
    );
}

export default EmployeeForm;
