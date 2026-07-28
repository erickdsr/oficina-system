import { useEffect, useState, type FormEvent } from "react";
import type { Supplier, SupplierRequest } from "../../types/supplier.types";
import { brazilianStates, isBrazilianState } from "../../utils/brazilian-states";
import { formatCnpj, formatPhone, formatZipCode, isValidEmail, isValidState, onlyDigits } from "../../utils/supplier-formatters";

interface SupplierFormProps {
    supplier?: Supplier | null;
    loading?: boolean;
    error?: string | null;
    onCancel: () => void;
    onSubmit: (supplier: SupplierRequest) => Promise<void>;
}

const initialForm: SupplierRequest = {
    name: "",
    legalName: "",
    tradeName: "",
    cnpj: "",
    stateRegistration: "",
    contactName: "",
    email: "",
    phone: "",
    address: "",
    zipCode: "",
    street: "",
    number: "",
    district: "",
    complement: "",
    city: "",
    state: "",
    status: true,
};

function toForm(supplier?: Supplier | null): SupplierRequest {
    if (!supplier) {
        return initialForm;
    }

    return {
        name: supplier.name ?? "",
        legalName: supplier.legalName ?? supplier.name ?? "",
        tradeName: supplier.tradeName ?? supplier.name ?? "",
        cnpj: formatCnpj(supplier.cnpj),
        stateRegistration: supplier.stateRegistration ?? "",
        contactName: supplier.contactName ?? "",
        email: supplier.email ?? "",
        phone: formatPhone(supplier.phone),
        address: supplier.address ?? "",
        zipCode: formatZipCode(supplier.zipCode),
        street: supplier.street ?? "",
        number: supplier.number ?? "",
        district: supplier.district ?? "",
        complement: supplier.complement ?? "",
        city: supplier.city ?? "",
        state: supplier.state ?? "",
        status: supplier.status,
    };
}

function validate(form: SupplierRequest) {
    const requiredFields: Array<[keyof SupplierRequest, string]> = [
        ["legalName", "Informe a razao social."],
        ["tradeName", "Informe o nome fantasia."],
        ["cnpj", "Informe o CNPJ."],
        ["contactName", "Informe o responsavel."],
        ["phone", "Informe o telefone."],
        ["email", "Informe o e-mail."],
        ["zipCode", "Informe o CEP."],
        ["street", "Informe a rua."],
        ["number", "Informe o numero."],
        ["district", "Informe o bairro."],
        ["city", "Informe a cidade."],
        ["state", "Informe a UF."],
    ];

    for (const [field, message] of requiredFields) {
        if (!String(form[field] ?? "").trim()) {
            return message;
        }
    }

    if (onlyDigits(form.cnpj).length !== 14) {
        return "Informe um CNPJ com 14 digitos.";
    }

    if (![10, 11].includes(onlyDigits(form.phone).length)) {
        return "Informe um telefone com DDD.";
    }

    if (onlyDigits(form.zipCode).length !== 8) {
        return "Informe um CEP com 8 digitos.";
    }

    if (!isValidEmail(form.email)) {
        return "Informe um e-mail valido.";
    }

    if (!isValidState(form.state) || !isBrazilianState(form.state)) {
        return "Selecione uma UF valida.";
    }

    return null;
}

export function SupplierForm({ supplier, loading = false, error, onCancel, onSubmit }: SupplierFormProps) {
    const [form, setForm] = useState<SupplierRequest>(initialForm);
    const [validationError, setValidationError] = useState<string | null>(null);

    useEffect(() => {
        setForm(toForm(supplier));
        setValidationError(null);
    }, [supplier]);

    function updateField<K extends keyof SupplierRequest>(field: K, value: SupplierRequest[K]) {
        setForm((current) => ({ ...current, [field]: value }));
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const nextError = validate(form);
        if (nextError) {
            setValidationError(nextError);
            return;
        }

        setValidationError(null);
        const tradeName = form.tradeName.trim();
        await onSubmit({
            ...form,
            name: tradeName,
            legalName: form.legalName.trim(),
            tradeName,
            cnpj: onlyDigits(form.cnpj),
            phone: onlyDigits(form.phone),
            zipCode: onlyDigits(form.zipCode),
            state: form.state.trim().toUpperCase(),
        });
    }

    return (
        <form className="entity-form supplier-form" onSubmit={handleSubmit} noValidate>
            <div className="entity-form__header">
                <div>
                    <h3>{supplier ? "Editar fornecedor" : "Novo fornecedor"}</h3>
                    <p>Dados cadastrais, contato comercial e endereco fiscal.</p>
                </div>
            </div>

            <div className="form-grid">
                <label className="form-field">
                    <span>Razao Social</span>
                    <input value={form.legalName} onChange={(event) => updateField("legalName", event.target.value)} />
                </label>
                <label className="form-field">
                    <span>Nome Fantasia</span>
                    <input value={form.tradeName} onChange={(event) => updateField("tradeName", event.target.value)} />
                </label>
                <label className="form-field">
                    <span>CNPJ</span>
                    <input inputMode="numeric" value={form.cnpj} onChange={(event) => updateField("cnpj", formatCnpj(event.target.value))} />
                </label>
                <label className="form-field">
                    <span>Inscricao Estadual</span>
                    <input value={form.stateRegistration} onChange={(event) => updateField("stateRegistration", event.target.value)} />
                </label>
                <label className="form-field">
                    <span>Responsavel</span>
                    <input value={form.contactName} onChange={(event) => updateField("contactName", event.target.value)} />
                </label>
                <label className="form-field">
                    <span>Telefone</span>
                    <input inputMode="tel" value={form.phone} onChange={(event) => updateField("phone", formatPhone(event.target.value))} />
                </label>
                <label className="form-field">
                    <span>Email</span>
                    <input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} />
                </label>
                <label className="form-field">
                    <span>CEP</span>
                    <input inputMode="numeric" value={form.zipCode} onChange={(event) => updateField("zipCode", formatZipCode(event.target.value))} />
                </label>
                <label className="form-field">
                    <span>Rua</span>
                    <input value={form.street} onChange={(event) => updateField("street", event.target.value)} />
                </label>
                <label className="form-field">
                    <span>Numero</span>
                    <input value={form.number} onChange={(event) => updateField("number", event.target.value)} />
                </label>
                <label className="form-field">
                    <span>Bairro</span>
                    <input value={form.district} onChange={(event) => updateField("district", event.target.value)} />
                </label>
                <label className="form-field">
                    <span>Cidade</span>
                    <input value={form.city} onChange={(event) => updateField("city", event.target.value)} />
                </label>
                <label className="form-field">
                    <span>Estado</span>
                    <select value={form.state} onChange={(event) => updateField("state", event.target.value)}>
                        <option value="">Selecione o estado</option>
                        {brazilianStates.map((state) => (
                            <option key={state} value={state}>{state}</option>
                        ))}
                    </select>
                </label>
                <label className="form-field">
                    <span>Complemento</span>
                    <input value={form.complement} onChange={(event) => updateField("complement", event.target.value)} />
                </label>
                <label className="checkbox-field supplier-status-field">
                    <input type="checkbox" checked={form.status} onChange={(event) => updateField("status", event.target.checked)} />
                    Ativo
                </label>
            </div>

            {(validationError || error) && <div className="form-error">{validationError ?? error}</div>}
            <div className="form-actions">
                <button type="button" className="secondary-button" onClick={onCancel} disabled={loading}>
                    Cancelar
                </button>
                <button type="submit" className="primary-button" disabled={loading}>
                    {loading ? "Salvando..." : "Salvar fornecedor"}
                </button>
            </div>
        </form>
    );
}

export default SupplierForm;
