import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "../../components/common/DataTable";
import ConfirmDeleteModal from "../../components/common/ConfirmDeleteModal";
import LoadingState from "../../components/common/LoadingState";
import PageHeader from "../../components/common/PageHeader";
import SearchInput from "../../components/common/SearchInput";
import { useAuth } from "../../context/auth.context";
import { getApiErrorMessage } from "../../services/api";
import categoryService from "../../services/category.service";
import useCategory from "../../hooks/useCategory";
import type { DeletionReport } from "../../types/api.types";
import type { Category, CategoryRequest } from "../../types/category.types";
import { canDelete, canManage } from "../../utils/permissions";
import CategoryForm from "./CategoryForm";

export function CategoryList() {
    const { user } = useAuth();
    const { categories, loading, error, setError, loadCategories, createCategory, updateCategory } = useCategory();
    const [search, setSearch] = useState("");
    const [showInactive, setShowInactive] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [deletionReport, setDeletionReport] = useState<DeletionReport | null>(null);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        void loadCategories(showInactive).catch(() => undefined);
    }, [loadCategories, showInactive]);

    const filteredCategories = useMemo(() => {
        const term = search.toLowerCase();
        return categories.filter((category) =>
            [category.name, category.description].some((value) => value.toLowerCase().includes(term)),
        );
    }, [categories, search]);

    async function handleSubmit(data: CategoryRequest) {
        setSubmitting(true);
        setFormError(null);
        try {
            if (editingCategory) {
                await updateCategory(editingCategory.id, data);
            } else {
                await createCategory(data);
            }
            setShowForm(false);
            setEditingCategory(null);
            await loadCategories(showInactive);
        } catch (submitError) {
            setFormError(getApiErrorMessage(submitError, "Nao foi possivel salvar a categoria."));
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDeleteClick(category: Category) {
        setDeleteError(null);
        setError(null);
        setDeletionReport(null);
        setCategoryToDelete(category);
        try {
            setDeletionReport(await categoryService.getDeletionReport(category.id));
        } catch (reportError) {
            setDeleteError(getApiErrorMessage(reportError, "Nao foi possivel carregar os vinculos da categoria."));
        }
    }

    async function handleConfirmDelete() {
        if (!categoryToDelete || isDeleting) {
            return;
        }

        setIsDeleting(true);
        setDeleteError(null);
        try {
            await categoryService.delete(categoryToDelete.id);
            await loadCategories(showInactive);
            closeDeleteModal();
        } catch (removeError) {
            console.error("[DELETE CATEGORY]", removeError);
            setDeleteError(getApiErrorMessage(removeError, "Nao foi possivel excluir a categoria."));
        } finally {
            setIsDeleting(false);
        }
    }

    async function handleForceDelete() {
        if (!categoryToDelete || isDeleting) {
            return;
        }

        setIsDeleting(true);
        setDeleteError(null);
        try {
            await categoryService.forceDelete(categoryToDelete.id);
            await loadCategories(showInactive);
            closeDeleteModal();
        } catch (removeError) {
            console.error("[FORCE DELETE CATEGORY]", removeError);
            setDeleteError(getApiErrorMessage(removeError, "Nao foi possivel executar a exclusao forcada."));
        } finally {
            setIsDeleting(false);
        }
    }

    function closeDeleteModal() {
        setCategoryToDelete(null);
        setDeleteError(null);
        setDeletionReport(null);
    }

    function handleCancelDelete() {
        if (isDeleting) {
            return;
        }

        closeDeleteModal();
    }

    return (
        <section className="page-section">
            <PageHeader
                eyebrow="Cadastros"
                title="Categorias"
                description="Organize os grupos de autopecas do catalogo."
                action={
                    canManage(user?.role, ["ADMIN", "MANAGER"]) && (
                        <button type="button" className="primary-button" onClick={() => setShowForm(true)}>
                            <Plus size={20} aria-hidden="true" />
                            Nova categoria
                        </button>
                    )
                }
            />
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar categoria..." />
            <label className="checkbox-field">
                <input type="checkbox" checked={showInactive} onChange={(event) => setShowInactive(event.target.checked)} />
                Mostrar registros desativados
            </label>
            {showForm && (
                <CategoryForm
                    category={editingCategory}
                    loading={submitting}
                    error={formError}
                    onCancel={() => {
                        setShowForm(false);
                        setEditingCategory(null);
                    }}
                    onSubmit={handleSubmit}
                />
            )}
            {error && <div className="form-error">{error}</div>}
            {loading ? (
                <LoadingState />
            ) : (
                <DataTable data={filteredCategories} columns={categoryColumns()} />
            )}
            <ConfirmDeleteModal
                isOpen={categoryToDelete !== null}
                title="Excluir categoria"
                itemName={categoryToDelete?.name}
                description="Esta acao nao podera ser desfeita."
                confirmLabel="Excluir categoria"
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

    function categoryColumns(): ColumnDef<Category>[] {
        return [
            {
                accessorKey: "id",
                header: "ID",
            },
            {
                accessorKey: "name",
                header: "Nome",
            },
            {
                accessorKey: "description",
                header: "Descricao",
            },
            {
                id: "actions",
                header: "Acoes",
                cell: ({ row }) => {
                    const category = row.original;

                    return (
                        <div className="table-actions">
                            {canManage(user?.role, ["ADMIN", "MANAGER"]) && (
                                <button
                                    type="button"
                                    className="table-action-button table-action-button--edit"
                                    aria-label={`Editar categoria ${category.name}`}
                                    title="Editar"
                                    onClick={() => {
                                        setEditingCategory(category);
                                        setShowForm(true);
                                    }}
                                >
                                    <Pencil size={20} aria-hidden="true" />
                                </button>
                            )}
                            {canDelete(user?.role) && (
                                <button
                                    type="button"
                                    className="table-action-button table-action-button--delete"
                                    aria-label={`Excluir categoria ${category.name}`}
                                    title="Excluir"
                                    onClick={() => handleDeleteClick(category)}
                                >
                                    <Trash2 size={20} aria-hidden="true" />
                                </button>
                            )}
                        </div>
                    );
                },
            },
        ];
    }
}

export default CategoryList;
