import { Camera, X } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import type { Employee, EmployeeRequest } from "../../types/employee.types";
import { normalizeRole } from "../../utils/permissions";
import { formatPhone, onlyDigits } from "../../utils/supplier-formatters";

export interface EmployeeFormPayload extends EmployeeRequest {
    photoPreview?: string | null;
    notes?: string;
}

interface EmployeeFormProps {
    employee?: Employee | null;
    loading?: boolean;
    error?: string | null;
    onCancel: () => void;
    onSubmit: (employee: EmployeeFormPayload) => Promise<void>;
}

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
};

const roleOptions = [
    {
        value: "ADMIN",
        label: "Administrador",
        description: "Acesso completo aos cadastros, movimentacoes, vendas, compras, relatorios e configuracoes administrativas.",
    },
    {
        value: "MANAGER",
        label: "Gerente",
        description: "Acesso operacional amplo a cadastros, estoque, compras, vendas, movimentacoes e relatorios.",
    },
    {
        value: "SALESPERSON",
        label: "Vendedor",
        description: "Pode acessar clientes, produtos e vendas. Possui estoque somente para consulta.",
    },
    {
        value: "STOCK",
        label: "Estoquista",
        description: "Pode consultar produtos, acompanhar estoque e registrar movimentacoes autorizadas.",
    },
    {
        value: "BUYER",
        label: "Comprador",
        description: "Pode gerenciar fornecedores, criar compras e acompanhar necessidades de reposicao.",
    },
] as const;

export function roleLabel(roleName: string) {
    const role = normalizeRole(roleName) ?? roleName.toUpperCase();
    const labels: Record<string, string> = {
        ADMIN: "Administrador",
        MANAGER: "Gerente",
        SALESPERSON: "Vendedor",
        STOCK: "Estoquista",
        BUYER: "Comprador",
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

function formatCpfInput(value?: string | null) {
    return onlyDigits(value)
        .slice(0, 11)
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function EmployeeForm({ employee, loading = false, error, onCancel, onSubmit }: EmployeeFormProps) {
    const [form, setForm] = useState<EmployeeFormPayload>(initialForm);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [changePassword, setChangePassword] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        setForm(
            employee
                ? {
                      name: employee.name,
                      cpf: formatCpfInput(employee.cpf),
                      email: employee.email,
                      password: "",
                      roleName: normalizeRole(employee.roleName) ?? "SALESPERSON",
                      phone: formatPhone(employee.phone),
                      status: employee.status,
                      photoPreview: null,
                      notes: "",
                  }
                : initialForm,
        );
        setConfirmPassword("");
        setChangePassword(false);
        setValidationError(null);
    }, [employee]);

    const selectedRole = roleOptions.find((role) => role.value === form.roleName);

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

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!form.name.trim() || !form.cpf.trim() || !form.email.trim()) {
            setValidationError("Informe nome, CPF e e-mail.");
            return;
        }
        if (!form.roleName) {
            setValidationError("Selecione um perfil.");
            return;
        }
        if (!employee && !form.password.trim()) {
            setValidationError("Informe a senha do funcionario.");
            return;
        }
        if (employee && changePassword && !form.password.trim()) {
            setValidationError("Informe a nova senha.");
            return;
        }
        if ((form.password || changePassword) && form.password !== confirmPassword) {
            setValidationError("A confirmacao de senha nao confere.");
            return;
        }

        setValidationError(null);
        await onSubmit({
            ...form,
            name: form.name.trim(),
            cpf: onlyDigits(form.cpf),
            email: form.email.trim(),
            phone: onlyDigits(form.phone),
            notes: form.notes?.trim(),
        });
    }

    return (
        <form className="entity-form employee-form" onSubmit={handleSubmit} noValidate>
            <div className="entity-form__header employee-form__header">
                <div>
                    <h3>{employee ? "Editar funcionario" : "Novo funcionario"}</h3>
                    <p>Dados pessoais e perfil de acesso aplicado automaticamente pela role.</p>
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
                        <input inputMode="numeric" value={form.cpf} onChange={(event) => updateField("cpf", formatCpfInput(event.target.value))} />
                    </label>
                    <label className="form-field">
                        <span>Telefone</span>
                        <input inputMode="tel" value={form.phone} onChange={(event) => updateField("phone", formatPhone(event.target.value))} />
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
                        <span>Perfil *</span>
                        <select value={form.roleName} onChange={(event) => updateField("roleName", event.target.value)}>
                            <option value="">Selecione um perfil</option>
                            {roleOptions.map((role) => (
                                <option key={role.value} value={role.value}>{role.label}</option>
                            ))}
                        </select>
                    </label>
                    <label className="checkbox-field supplier-status-field">
                        <input type="checkbox" checked={form.status} onChange={(event) => updateField("status", event.target.checked)} />
                        Ativo
                    </label>
                    {selectedRole && (
                        <div className="employee-role-description span-2">
                            <strong>{selectedRole.label}</strong>
                            <span>{selectedRole.description}</span>
                        </div>
                    )}
                    {employee && (
                        <label className="checkbox-field supplier-status-field span-2">
                            <input
                                type="checkbox"
                                checked={changePassword}
                                onChange={(event) => {
                                    setChangePassword(event.target.checked);
                                    updateField("password", "");
                                    setConfirmPassword("");
                                }}
                            />
                            Alterar senha
                        </label>
                    )}
                    {(!employee || changePassword) && (
                        <>
                            <label className="form-field">
                                <span>{employee ? "Nova senha" : "Senha *"}</span>
                                <input type="password" value={form.password} onChange={(event) => updateField("password", event.target.value)} />
                            </label>
                            <label className="form-field">
                                <span>{employee ? "Confirmar nova senha" : "Confirmar senha *"}</span>
                                <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
                            </label>
                        </>
                    )}
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
