import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import EmptyState from "../../components/common/EmptyState";
import ConfirmDeleteModal from "../../components/common/ConfirmDeleteModal";
import LoadingState from "../../components/common/LoadingState";
import PageHeader from "../../components/common/PageHeader";
import SearchInput from "../../components/common/SearchInput";
import StatusBadge from "../../components/common/StatusBadge";
import { useAuth } from "../../context/auth.context";
import { getApiErrorMessage } from "../../services/api";
import clientService from "../../services/client.service";
import useClient from "../../hooks/useClient";
import type { DeletionReport } from "../../types/api.types";
import type { Client, ClientRequest } from "../../types/client.types";
import { canDelete, canManage } from "../../utils/permissions";
import ClientForm from "./ClientForm";

export function ClientList() {
    const { user } = useAuth();
    const { clients, loading, error, setError, fetchAll, create, update, remove, forceDelete } = useClient();
    const [search, setSearch] = useState("");
    const [showInactive, setShowInactive] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [deletionReport, setDeletionReport] = useState<DeletionReport | null>(null);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        void fetchAll(showInactive).catch(() => undefined);
    }, [fetchAll, showInactive]);

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
            await fetchAll(showInactive);
        } catch (submitError) {
            setFormError(getApiErrorMessage(submitError, "Nao foi possivel salvar o cliente."));
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDeleteClick(client: Client) {
        setDeleteError(null);
        setError(null);
        setClientToDelete(client);
        setDeletionReport(null);
        try {
            setDeletionReport(await clientService.getDeletionReport(client.id));
        } catch (reportError) {
            setDeleteError(getApiErrorMessage(reportError, "Nao foi possivel carregar os vinculos do cliente."));
        }
    }

    async function handleConfirmDelete() {
        if (!clientToDelete || isDeleting) {
            return;
        }

        setIsDeleting(true);
        setDeleteError(null);
        try {
            await remove(clientToDelete.id);
            await fetchAll(showInactive);
            setClientToDelete(null);
            setDeletionReport(null);
        } catch (removeError) {
            setDeleteError(getApiErrorMessage(removeError, "Nao foi possivel excluir o cliente. Tente novamente."));
        } finally {
            setIsDeleting(false);
        }
    }

    async function handleForceDelete() {
        if (!clientToDelete || isDeleting) {
            return;
        }

        setIsDeleting(true);
        setDeleteError(null);
        try {
            await forceDelete(clientToDelete.id);
            await fetchAll(showInactive);
            setClientToDelete(null);
            setDeletionReport(null);
        } catch (removeError) {
            setDeleteError(getApiErrorMessage(removeError, "Nao foi possivel excluir definitivamente o cliente."));
        } finally {
            setIsDeleting(false);
        }
    }

    function handleCancelDelete() {
        if (isDeleting) {
            return;
        }

        setClientToDelete(null);
        setDeleteError(null);
        setDeletionReport(null);
    }

    return (
        <section className="page-section">
            <PageHeader
                eyebrow="Comercial"
                title="Clientes"
                description="Base de clientes para vendas."
                action={canManage(user?.role, ["ADMIN", "MANAGER", "SALESPERSON"]) && <button type="button" className="primary-button" onClick={() => setShowForm(true)}>Novo cliente</button>}
            />
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar cliente..." />
            <label className="checkbox-field">
                <input type="checkbox" checked={showInactive} onChange={(event) => setShowInactive(event.target.checked)} />
                Mostrar registros desativados
            </label>
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
                                        {canManage(user?.role, ["ADMIN", "MANAGER", "SALESPERSON"]) && (
                                            <button
                                                type="button"
                                                className="table-action-button table-action-button--edit"
                                                aria-label={`Editar cliente ${client.name}`}
                                                title="Editar"
                                                onClick={() => { setEditingClient(client); setShowForm(true); }}
                                            >
                                                <Pencil size={20} aria-hidden="true" />
                                            </button>
                                        )}
                                        {canDelete(user?.role, ["ADMIN", "MANAGER", "SALESPERSON"]) && (
                                            <button
                                                type="button"
                                                className="table-action-button table-action-button--delete"
                                                aria-label={`Excluir cliente ${client.name}`}
                                                title="Excluir"
                                                onClick={() => handleDeleteClick(client)}
                                            >
                                                <Trash2 size={20} aria-hidden="true" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <ConfirmDeleteModal
                isOpen={clientToDelete !== null}
                title="Excluir cliente"
                itemName={clientToDelete?.name}
                description="Esta acao nao podera ser desfeita."
                confirmLabel="Excluir cliente"
                isLoading={isDeleting}
                error={deleteError}
                report={deletionReport}
                userRole={user?.role}
                onConfirm={handleConfirmDelete}
                onForceConfirm={handleForceDelete}
                onCancel={handleCancelDelete}
            />
        </section>
    );
}

export default ClientList;
