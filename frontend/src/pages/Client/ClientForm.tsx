import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Loader2, MapPin, X } from "lucide-react";
import { toast } from "sonner";
import type { Client, ClientRequest } from "../../types/client.types";

interface ClientFormProps {
    client?: Client | null;
    loading?: boolean;
    error?: string | null;
    onCancel: () => void;
    onSubmit: (client: ClientRequest) => Promise<void>;
}

type ClientDraft = ClientRequest & {
    birthDate: string;
    mobile: string;
    zipCode: string;
    street: string;
    number: string;
    complement: string;
    district: string;
    notes: string;
};

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
    birthDate: "",
    mobile: "",
    zipCode: "",
    street: "",
    number: "",
    complement: "",
    district: "",
    notes: "",
};

function onlyDigits(value: string) {
    return value.replace(/\D/g, "");
}

function maskCpf(value: string) {
    return onlyDigits(value)
        .slice(0, 11)
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function maskCnpj(value: string) {
    return onlyDigits(value)
        .slice(0, 14)
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2");
}

function maskDocument(value: string, type: string) {
    return type === "PJ" ? maskCnpj(value) : maskCpf(value);
}

function maskPhone(value: string) {
    const digits = onlyDigits(value).slice(0, 11);
    if (digits.length <= 10) {
        return digits
            .replace(/^(\d{2})(\d)/, "($1) $2")
            .replace(/(\d{4})(\d)/, "$1-$2");
    }

    return digits
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");
}

function maskZipCode(value: string) {
    return onlyDigits(value).slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
}

function clientToDraft(client?: Client | null): ClientDraft {
    if (!client) {
        return initialForm;
    }

    return {
        ...initialForm,
        name: client.name,
        cpfCnpj: maskDocument(client.cpfCnpj, client.clientType || "PF"),
        clientType: client.clientType || "PF",
        email: client.email,
        phone: maskPhone(client.phone),
        address: client.address,
        city: client.city,
        state: client.state,
        status: client.status,
    };
}

function buildAddress(form: ClientDraft) {
    const detailedAddress = [form.street, form.number, form.complement, form.district].filter(Boolean).join(", ");
    return detailedAddress || form.address;
}

function RequiredMark() {
    return <small className="client-required-mark">Obrigatorio</small>;
}

export function ClientForm({ client, loading = false, error, onCancel, onSubmit }: ClientFormProps) {
    const [form, setForm] = useState<ClientDraft>(initialForm);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [cepLoading, setCepLoading] = useState(false);

    useEffect(() => {
        setForm(clientToDraft(client));
        setValidationError(null);
    }, [client]);

    const isValid = useMemo(() => {
        const documentLength = form.clientType === "PJ" ? 14 : 11;
        return Boolean(
            form.name.trim()
            && onlyDigits(form.cpfCnpj).length === documentLength
            && onlyDigits(form.phone).length >= 10
            && typeof form.status === "boolean",
        );
    }, [form.clientType, form.cpfCnpj, form.name, form.phone, form.status]);
    const documentLength = form.clientType === "PJ" ? 14 : 11;
    const documentValid = onlyDigits(form.cpfCnpj).length === documentLength;
    const phoneValid = onlyDigits(form.phone).length >= 10;

    const submitLabel = useMemo(() => {
        if (loading) {
            return client ? "Salvando..." : "Cadastrando...";
        }

        return client ? "Salvar alteracoes" : "Cadastrar Cliente";
    }, [client, loading]);

    function updateType(type: string) {
        setForm((current) => ({
            ...current,
            clientType: type,
            cpfCnpj: maskDocument(current.cpfCnpj, type),
        }));
    }

    async function handleZipSearch() {
        const zip = onlyDigits(form.zipCode);
        if (zip.length !== 8 || cepLoading) {
            toast.warning("Informe um CEP com 8 digitos.");
            return;
        }

        setCepLoading(true);
        try {
            const response = await fetch(`https://viacep.com.br/ws/${zip}/json/`);
            const data = await response.json();
            if (data.erro) {
                toast.error("CEP nao encontrado.");
                return;
            }

            setForm((current) => ({
                ...current,
                street: data.logradouro ?? current.street,
                district: data.bairro ?? current.district,
                city: data.localidade ?? current.city,
                state: data.uf ?? current.state,
                address: [data.logradouro, data.bairro].filter(Boolean).join(", "),
            }));
            toast.success("Endereco preenchido pelo CEP.");
        } catch {
            toast.error("Nao foi possivel buscar o CEP agora.");
        } finally {
            setCepLoading(false);
        }
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!isValid) {
            setValidationError("Preencha os campos obrigatorios: nome, CPF/CNPJ, telefone e status.");
            return;
        }

        setValidationError(null);
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
        <div className="modal-overlay client-form-overlay" role="presentation" onMouseDown={(event) => {
            if (event.target === event.currentTarget && !loading) {
                onCancel();
            }
        }}>
            <form className="client-form-modal" onSubmit={handleSubmit} noValidate>
                <div className="client-form-header">
                    <div>
                        <h3>{client ? "Editar Cliente" : "Cadastrar Cliente"}</h3>
                        <p>Preencha as informacoes para cadastrar um novo cliente.</p>
                    </div>
                    <button type="button" className="table-action-button tooltip-button" data-tooltip="Fechar" aria-label="Fechar cadastro" onClick={onCancel} disabled={loading}>
                        <X size={19} aria-hidden="true" />
                    </button>
                </div>

                <div className="client-form-body">
                    <div className="form-grid client-form-grid">
                        <label className="form-field span-2">
                            <span>Nome <RequiredMark /></span>
                            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} aria-invalid={!form.name.trim()} autoFocus />
                        </label>
                        <label className="form-field">
                            <span>CPF/CNPJ <RequiredMark /></span>
                            <input inputMode="numeric" value={form.cpfCnpj} onChange={(event) => setForm({ ...form, cpfCnpj: maskDocument(event.target.value, form.clientType) })} aria-invalid={Boolean(form.cpfCnpj && !documentValid)} />
                        </label>
                        <label className="form-field">
                            <span>Tipo</span>
                            <select value={form.clientType} onChange={(event) => updateType(event.target.value)}>
                                <option value="PF">Pessoa Fisica</option>
                                <option value="PJ">Pessoa Juridica</option>
                            </select>
                        </label>
                        <label className="form-field">
                            <span>Telefone <RequiredMark /></span>
                            <input inputMode="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: maskPhone(event.target.value) })} aria-invalid={Boolean(form.phone && !phoneValid)} />
                        </label>
                        <label className="form-field">
                            <span>Celular</span>
                            <input inputMode="tel" value={form.mobile} onChange={(event) => setForm({ ...form, mobile: maskPhone(event.target.value) })} />
                        </label>
                        <label className="form-field span-2">
                            <span>Email</span>
                            <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
                        </label>
                        <label className="form-field">
                            <span>Data de nascimento</span>
                            <input type="date" value={form.birthDate} onChange={(event) => setForm({ ...form, birthDate: event.target.value })} />
                        </label>
                        <label className="form-field">
                            <span>Status <RequiredMark /></span>
                            <select value={form.status ? "active" : "inactive"} onChange={(event) => setForm({ ...form, status: event.target.value === "active" })}>
                                <option value="active">Ativo</option>
                                <option value="inactive">Inativo</option>
                            </select>
                        </label>
                        <label className="form-field client-zip-field">
                            <span>CEP</span>
                            <div>
                                <input inputMode="numeric" value={form.zipCode} onChange={(event) => setForm({ ...form, zipCode: maskZipCode(event.target.value) })} />
                                <button type="button" className="secondary-button" onClick={handleZipSearch} disabled={cepLoading}>
                                    {cepLoading ? <Loader2 size={16} className="loading-state__spinner" aria-hidden="true" /> : <MapPin size={16} aria-hidden="true" />}
                                    Buscar CEP
                                </button>
                            </div>
                        </label>
                        <label className="form-field">
                            <span>Numero</span>
                            <input value={form.number} onChange={(event) => setForm({ ...form, number: event.target.value })} />
                        </label>
                        <label className="form-field">
                            <span>Rua</span>
                            <input value={form.street} onChange={(event) => setForm({ ...form, street: event.target.value })} />
                        </label>
                        <label className="form-field">
                            <span>Complemento</span>
                            <input value={form.complement} onChange={(event) => setForm({ ...form, complement: event.target.value })} />
                        </label>
                        <label className="form-field">
                            <span>Bairro</span>
                            <input value={form.district} onChange={(event) => setForm({ ...form, district: event.target.value })} />
                        </label>
                        <label className="form-field">
                            <span>Cidade</span>
                            <input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
                        </label>
                        <label className="form-field">
                            <span>Estado</span>
                            <input maxLength={2} value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value.toUpperCase() })} />
                        </label>
                        <label className="form-field span-2">
                            <span>Observacoes</span>
                            <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
                        </label>
                    </div>

                    {(validationError || error) && <div className="form-error">{validationError ?? error}</div>}
                </div>

                <div className="form-actions client-form-actions">
                    <button type="button" className="secondary-button" onClick={onCancel} disabled={loading}>Cancelar</button>
                    <button type="submit" className="primary-button" disabled={loading || !isValid}>
                        {loading && <Loader2 size={16} className="loading-state__spinner" aria-hidden="true" />}
                        {submitLabel}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default ClientForm;
