import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import type { Client, ClientRequest } from "../../types/client.types";
import { brazilianStates, isBrazilianState } from "../../utils/brazilian-states";
import { formatPhone, formatZipCode, isValidEmail, onlyDigits } from "../../utils/supplier-formatters";

interface ClientFormProps {
    client?: Client | null;
    clients?: Client[];
    loading?: boolean;
    error?: string | null;
    onCancel: () => void;
    onSubmit: (client: ClientRequest) => Promise<void>;
}

type ClientDraft = ClientRequest & {
    mobile: string;
    zipCode: string;
    street: string;
    number: string;
    complement: string;
    district: string;
    notes: string;
};

type FieldErrors = Partial<Record<keyof ClientDraft, string>>;

const initialForm: ClientDraft = {
    name: "",
    cpfCnpj: "",
    clientType: "PF",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    status: true,
    mobile: "",
    zipCode: "",
    street: "",
    number: "",
    complement: "",
    district: "",
    notes: "",
};

function formatCpf(value?: string | null) {
    return onlyDigits(value)
        .slice(0, 11)
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatCnpj(value?: string | null) {
    return onlyDigits(value)
        .slice(0, 14)
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2");
}

function formatDocument(value: string, type: string) {
    return type === "PJ" ? formatCnpj(value) : formatCpf(value);
}

function isValidCpf(value: string) {
    const cpf = onlyDigits(value);
    return cpf.length === 11 && !/^(\d)\1+$/.test(cpf);
}

function isValidCnpj(value: string) {
    const cnpj = onlyDigits(value);
    return cnpj.length === 14 && !/^(\d)\1+$/.test(cnpj);
}

function toForm(client?: Client | null): ClientDraft {
    if (!client) {
        return initialForm;
    }

    return {
        ...initialForm,
        name: client.name,
        cpfCnpj: formatDocument(client.cpfCnpj, client.clientType || "PF"),
        clientType: client.clientType || "PF",
        email: client.email ?? "",
        phone: formatPhone(client.phone),
        address: client.address ?? "",
        city: client.city ?? "",
        state: client.state ?? "",
        status: client.status,
    };
}

function buildAddress(form: ClientDraft) {
    const detailedAddress = [form.street, form.number, form.complement, form.district].filter(Boolean).join(", ");
    return detailedAddress || form.address;
}

function RequiredAsterisk() {
    return <span className="client-required-asterisk" aria-hidden="true">*</span>;
}

export function ClientForm({ client, clients = [], loading = false, error, onCancel, onSubmit }: ClientFormProps) {
    const formRef = useRef<HTMLFormElement | null>(null);
    const [form, setForm] = useState<ClientDraft>(initialForm);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [cepLoading, setCepLoading] = useState(false);

    useEffect(() => {
        setForm(toForm(client));
        setFieldErrors({});
    }, [client]);

    useEffect(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, []);

    const documentLabel = form.clientType === "PJ" ? "CNPJ" : "CPF";
    const nameLabel = form.clientType === "PJ" ? "Razao social" : "Nome completo";

    const duplicateDocument = useMemo(() => {
        const document = onlyDigits(form.cpfCnpj);
        if (!document) {
            return false;
        }

        return clients.some((currentClient) => currentClient.id !== client?.id && onlyDigits(currentClient.cpfCnpj) === document);
    }, [client?.id, clients, form.cpfCnpj]);

    function updateField<K extends keyof ClientDraft>(field: K, value: ClientDraft[K]) {
        setForm((current) => ({ ...current, [field]: value }));
        setFieldErrors((current) => ({ ...current, [field]: undefined }));
    }

    function updateType(type: string) {
        setForm((current) => ({
            ...current,
            clientType: type,
            cpfCnpj: formatDocument(current.cpfCnpj, type),
        }));
        setFieldErrors((current) => ({ ...current, clientType: undefined, cpfCnpj: undefined }));
    }

    function validate() {
        const nextErrors: FieldErrors = {};
        const document = onlyDigits(form.cpfCnpj);
        const phone = onlyDigits(form.phone);
        const zipCode = onlyDigits(form.zipCode);

        if (!form.name.trim()) {
            nextErrors.name = form.clientType === "PJ" ? "Informe a razao social." : "Informe o nome completo.";
        }

        if (!form.clientType) {
            nextErrors.clientType = "Informe o tipo de pessoa.";
        }

        if (!document) {
            nextErrors.cpfCnpj = `Informe o ${documentLabel}.`;
        } else if (form.clientType === "PJ" ? !isValidCnpj(document) : !isValidCpf(document)) {
            nextErrors.cpfCnpj = `Informe um ${documentLabel} valido.`;
        } else if (duplicateDocument) {
            nextErrors.cpfCnpj = `${documentLabel} ja cadastrado.`;
        }

        if (!phone) {
            nextErrors.phone = "Informe o telefone.";
        } else if (![10, 11].includes(phone.length)) {
            nextErrors.phone = "Informe um telefone com DDD.";
        }

        if (form.email.trim() && !isValidEmail(form.email)) {
            nextErrors.email = "Informe um e-mail valido.";
        }

        if (form.zipCode.trim() && zipCode.length !== 8) {
            nextErrors.zipCode = "Informe um CEP com 8 digitos.";
        }

        if (form.state && !isBrazilianState(form.state)) {
            nextErrors.state = "Selecione uma UF valida.";
        }

        setFieldErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    }

    async function handleZipSearch() {
        const zip = onlyDigits(form.zipCode);
        if (zip.length !== 8) {
            setFieldErrors((current) => ({ ...current, zipCode: "Informe um CEP com 8 digitos." }));
            return;
        }

        setCepLoading(true);
        setFieldErrors((current) => ({ ...current, zipCode: undefined }));
        try {
            const response = await fetch(`https://viacep.com.br/ws/${zip}/json/`);
            const data = await response.json();
            if (data.erro) {
                setFieldErrors((current) => ({ ...current, zipCode: "CEP nao encontrado." }));
                return;
            }

            setForm((current) => ({
                ...current,
                street: data.logradouro ?? current.street,
                district: data.bairro ?? current.district,
                city: data.localidade ?? current.city,
                state: isBrazilianState(data.uf) ? data.uf : current.state,
                address: [data.logradouro, data.bairro].filter(Boolean).join(", "),
            }));
            toast.success("Endereco preenchido pelo CEP.");
        } catch {
            setFieldErrors((current) => ({ ...current, zipCode: "Nao foi possivel buscar o CEP agora." }));
        } finally {
            setCepLoading(false);
        }
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (loading || !validate()) {
            return;
        }

        await onSubmit({
            name: form.name.trim(),
            cpfCnpj: onlyDigits(form.cpfCnpj),
            clientType: form.clientType,
            email: form.email.trim(),
            phone: onlyDigits(form.mobile) || onlyDigits(form.phone),
            address: buildAddress(form).trim(),
            city: form.city.trim(),
            state: form.state.trim().toUpperCase(),
            status: form.status,
        });
    }

    return (
        <form ref={formRef} className="entity-form supplier-form client-inline-form" onSubmit={handleSubmit} noValidate>
            <div className="entity-form__header">
                <div>
                    <h3>{client ? "Editar cliente" : "Novo cliente"}</h3>
                    <p>Dados pessoais, contato e endereco.</p>
                </div>
            </div>

            <div className="client-inline-section">
                <h4>Dados principais</h4>
                <div className="form-grid client-inline-grid">
                    <label className="form-field">
                        <span>{nameLabel} <RequiredAsterisk /></span>
                        <input value={form.name} onChange={(event) => updateField("name", event.target.value)} aria-invalid={Boolean(fieldErrors.name)} autoFocus />
                        {fieldErrors.name && <small>{fieldErrors.name}</small>}
                    </label>
                    <label className="form-field">
                        <span>Tipo de pessoa <RequiredAsterisk /></span>
                        <select value={form.clientType} onChange={(event) => updateType(event.target.value)}>
                            <option value="PF">Pessoa Fisica</option>
                            <option value="PJ">Pessoa Juridica</option>
                        </select>
                        {fieldErrors.clientType && <small>{fieldErrors.clientType}</small>}
                    </label>
                    <label className="form-field">
                        <span>{documentLabel} <RequiredAsterisk /></span>
                        <input inputMode="numeric" value={form.cpfCnpj} onChange={(event) => updateField("cpfCnpj", formatDocument(event.target.value, form.clientType))} aria-invalid={Boolean(fieldErrors.cpfCnpj)} />
                        {fieldErrors.cpfCnpj && <small>{fieldErrors.cpfCnpj}</small>}
                    </label>
                    <label className="form-field">
                        <span>Telefone <RequiredAsterisk /></span>
                        <input inputMode="tel" value={form.phone} onChange={(event) => updateField("phone", formatPhone(event.target.value))} aria-invalid={Boolean(fieldErrors.phone)} />
                        {fieldErrors.phone && <small>{fieldErrors.phone}</small>}
                    </label>
                    <label className="form-field">
                        <span>Celular</span>
                        <input inputMode="tel" value={form.mobile} onChange={(event) => updateField("mobile", formatPhone(event.target.value))} />
                    </label>
                    <label className="form-field">
                        <span>E-mail</span>
                        <input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} aria-invalid={Boolean(fieldErrors.email)} />
                        {fieldErrors.email && <small>{fieldErrors.email}</small>}
                    </label>
                    <label className="checkbox-field supplier-status-field client-status-field">
                        <input type="checkbox" checked={form.status} onChange={(event) => updateField("status", event.target.checked)} />
                        Status ativo <RequiredAsterisk />
                    </label>
                </div>
            </div>

            <div className="client-inline-section">
                <h4>Endereco</h4>
                <div className="form-grid client-inline-grid">
                    <label className="form-field client-cep-field">
                        <span>CEP</span>
                        <div className="client-cep-control">
                            <input inputMode="numeric" value={form.zipCode} onChange={(event) => updateField("zipCode", formatZipCode(event.target.value))} aria-invalid={Boolean(fieldErrors.zipCode)} />
                            <button type="button" className="secondary-button" onClick={handleZipSearch} disabled={cepLoading || loading}>
                                {cepLoading ? <Loader2 size={16} className="loading-state__spinner" aria-hidden="true" /> : <MapPin size={16} aria-hidden="true" />}
                                Buscar CEP
                            </button>
                        </div>
                        {fieldErrors.zipCode && <small>{fieldErrors.zipCode}</small>}
                    </label>
                    <label className="form-field">
                        <span>Numero</span>
                        <input value={form.number} onChange={(event) => updateField("number", event.target.value)} />
                    </label>
                    <label className="form-field">
                        <span>Rua</span>
                        <input value={form.street} onChange={(event) => updateField("street", event.target.value)} />
                    </label>
                    <label className="form-field">
                        <span>Complemento</span>
                        <input value={form.complement} onChange={(event) => updateField("complement", event.target.value)} />
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
                        <select value={form.state} onChange={(event) => updateField("state", event.target.value)} aria-invalid={Boolean(fieldErrors.state)}>
                            <option value="">Selecione o estado</option>
                            {brazilianStates.map((state) => (
                                <option key={state} value={state}>{state}</option>
                            ))}
                        </select>
                        {fieldErrors.state && <small>{fieldErrors.state}</small>}
                    </label>
                </div>
            </div>

            <div className="client-inline-section">
                <h4>Observacoes</h4>
                <label className="form-field">
                    <span>Observacoes</span>
                    <textarea value={form.notes} onChange={(event) => updateField("notes", event.target.value)} />
                </label>
            </div>

            {error && <div className="form-error">{error}</div>}
            <div className="form-actions client-inline-actions">
                <button type="button" className="secondary-button" onClick={onCancel} disabled={loading}>
                    Cancelar
                </button>
                <button type="submit" className="primary-button" disabled={loading}>
                    {loading && <Loader2 size={16} className="loading-state__spinner" aria-hidden="true" />}
                    {loading ? "Salvando..." : client ? "Salvar cliente" : "Cadastrar cliente"}
                </button>
            </div>
        </form>
    );
}

export default ClientForm;
