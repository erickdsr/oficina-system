import { useEffect, useMemo, useState } from "react";
import EmptyState from "../../components/common/EmptyState";
import LoadingState from "../../components/common/LoadingState";
import PageHeader from "../../components/common/PageHeader";
import SearchInput from "../../components/common/SearchInput";
import StatusBadge from "../../components/common/StatusBadge";
import { useAuth } from "../../context/auth.context";
import { getApiErrorMessage } from "../../services/api";
import clientService from "../../services/client.service";
import type { Client, ClientRequest } from "../../types/client.types";
import { canDelete, canManage } from "../../utils/permissions";
import ClientForm from "./ClientForm";

export function ClientList() {
    const { user } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [showForm, setShowForm] = useState(false);

    async function loadClients() {
        setLoading(true);
        setError(null);
        try {
            setClients(await clientService.list());
        } catch (loadError) {
            setError(getApiErrorMessage(loadError, "Nao foi possivel carregar clientes."));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadClients();
    }, []);

    const filteredClients = useMemo(() => {
        const term = search.toLowerCase();
        return clients.filter((client) =>
            [client.name, client.cpfCnpj, client.email, client.phone].some((value) => value.toLowerCase().includes(term)),
        );
    }, [clients, search]);

    async function handleSubmit(data: ClientRequest) {
        setSubmitting(true);
        setFormError(null);
        try {
            if (editingClient) {
                await clientService.update(editingClient.id, data);
            } else {
                await clientService.create(data);
            }
            setShowForm(false);
            setEditingClient(null);
            await loadClients();
        } catch (submitError) {
            setFormError(getApiErrorMessage(submitError, "Nao foi possivel salvar o cliente."));
        } finally {
            setSubmitting(false);
        }
    }

    async function handleRemove(client: Client) {
        if (!window.confirm(`Excluir cliente ${client.name}?`)) {
            return;
        }
        try {
            await clientService.remove(client.id);
            await loadClients();
        } catch (removeError) {
            setError(getApiErrorMessage(removeError, "Nao foi possivel excluir o cliente."));
        }
    }

    return (
        <section className="page-section">
            <PageHeader
                eyebrow="Comercial"
                title="Clientes"
                description="Base de clientes para vendas."
                action={canManage(user?.role, ["admin", "gerente", "vendedor"]) && <button type="button" className="primary-button" onClick={() => setShowForm(true)}>Novo cliente</button>}
            />
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar cliente..." />
            {showForm && <ClientForm client={editingClient} loading={submitting} error={formError} onCancel={() => { setShowForm(false); setEditingClient(null); }} onSubmit={handleSubmit} />}
            {error && <div className="form-error">{error}</div>}
            {loading ? <LoadingState /> : filteredClients.length === 0 ? <EmptyState /> : (
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Documento</th>
                                <th>Contato</th>
                                <th>Cidade</th>
                                <th>Status</th>
                                <th>Acoes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClients.map((client) => (
                                <tr key={client.id}>
                                    <td>{client.name}</td>
                                    <td>{client.cpfCnpj}</td>
                                    <td>{client.email || client.phone}</td>
                                    <td>{client.city} / {client.state}</td>
                                    <td><StatusBadge active={client.status} /></td>
                                    <td className="table-actions">
                                        {canManage(user?.role, ["admin", "gerente", "vendedor"]) && <button type="button" className="secondary-button" onClick={() => { setEditingClient(client); setShowForm(true); }}>Editar</button>}
                                        {canDelete(user?.role) && <button type="button" className="danger-button" onClick={() => void handleRemove(client)}>Excluir</button>}
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

export default ClientList;
