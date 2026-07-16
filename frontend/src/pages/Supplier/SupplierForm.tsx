import { useEffect, useState, type FormEvent } from "react";
import type { Supplier, SupplierRequest } from "../../types/supplier.types";

interface SupplierFormProps {
    supplier?: Supplier | null;
    loading?: boolean;
    error?: string | null;
    onCancel: () => void;
    onSubmit: (supplier: SupplierRequest) => Promise<void>;
}

const initialForm: SupplierRequest = {
    name: "",
    cnpj: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    status: true,
};

export function SupplierForm({ supplier, loading = false, error, onCancel, onSubmit }: SupplierFormProps) {
    const [form, setForm] = useState<SupplierRequest>(initialForm);
    const [validationError, setValidationError] = useState<string | null>(null);

    useEffect(() => {
        setForm(supplier ? { ...supplier } : initialForm);
        setValidationError(null);
    }, [supplier]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!form.name.trim() || !form.cnpj.trim()) {
            setValidationError("Informe nome e CNPJ.");
            return;
        }
        setValidationError(null);
        await onSubmit(form);
    }

    return (
        <form className="entity-form" onSubmit={handleSubmit} noValidate>
            <h3>{supplier ? "Editar fornecedor" : "Novo fornecedor"}</h3>
            <div className="form-grid">
                <label className="form-field">
                    <span>Nome</span>
                    <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                </label>
                <label className="form-field">
                    <span>CNPJ</span>
                    <input value={form.cnpj} onChange={(event) => setForm({ ...form, cnpj: event.target.value })} />
                </label>
                <label className="form-field">
                    <span>E-mail</span>
                    <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
                </label>
                <label className="form-field">
                    <span>Telefone</span>
                    <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
                </label>
                <label className="form-field">
                    <span>Cidade</span>
                    <input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
                </label>
                <label className="form-field">
                    <span>Estado</span>
                    <input value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value })} />
                </label>
                <label className="form-field span-2">
                    <span>Endereco</span>
                    <input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
                </label>
                <label className="checkbox-field">
                    <input type="checkbox" checked={form.status} onChange={(event) => setForm({ ...form, status: event.target.checked })} />
                    Ativo
                </label>
            </div>
            {(validationError || error) && <div className="form-error">{validationError ?? error}</div>}
            <div className="form-actions">
                <button type="button" className="secondary-button" onClick={onCancel}>
                    Cancelar
                </button>
                <button type="submit" className="primary-button" disabled={loading}>
                    {loading ? "Salvando..." : "Salvar"}
                </button>
            </div>
        </form>
    );
}

export default SupplierForm;
