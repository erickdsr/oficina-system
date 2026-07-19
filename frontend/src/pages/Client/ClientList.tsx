import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import EmptyState from "../../components/common/EmptyState";
import LoadingState from "../../components/common/LoadingState";
import PageHeader from "../../components/common/PageHeader";
import SearchInput from "../../components/common/SearchInput";
import StatusBadge from "../../components/common/StatusBadge";
import { useAuth } from "../../context/auth.context";
import { getApiErrorMessage } from "../../services/api";
import useClient from "../../hooks/useClient";
import type { Client, ClientRequest } from "../../types/client.types";
import { canDelete, canManage } from "../../utils/permissions";
import ClientForm from "./ClientForm";

export function ClientList() {
    const { user } = useAuth();
    const { clients, loading, error, setError, fetchAll, create, update, remove } = useClient();
    const [search, setSearch] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        void fetchAll().catch(() => undefined);
    }, [fetchAll]);

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
                await update(editingClient.id, data);
            } else {
                await create(data);
            }
            setShowForm(false);
            setEditingClient(null);
            await fetchAll();
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
            await remove(client.id);
            await fetchAll();
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
                                        {canManage(user?.role, ["admin", "gerente", "vendedor"]) && (
                                            <button
                                                type="button"
                                                className="table-action-button table-action-button--edit"
                                                aria-label={`Editar cliente ${client.name}`}
                                                title="Editar"
                                                onClick={() => { setEditingClient(client); setShowForm(true); }}
                                            >
                                                <Pencil size={16} aria-hidden="true" />
                                            </button>
                                        )}
                                        {canDelete(user?.role) && (
                                            <button
                                                type="button"
                                                className="table-action-button table-action-button--delete"
                                                aria-label={`Excluir cliente ${client.name}`}
                                                title="Excluir"
                                                onClick={() => void handleRemove(client)}
                                            >
                                                <Trash2 size={16} aria-hidden="true" />
                                            </button>
                                        )}
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
