import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "../../components/common/DataTable";
import LoadingState from "../../components/common/LoadingState";
import PageHeader from "../../components/common/PageHeader";
import SearchInput from "../../components/common/SearchInput";
import { useAuth } from "../../context/auth.context";
import { getApiErrorMessage } from "../../services/api";
import useCategory from "../../hooks/useCategory";
import type { Category, CategoryRequest } from "../../types/category.types";
import { canDelete, canManage } from "../../utils/permissions";
import CategoryForm from "./CategoryForm";

export function CategoryList() {
    const { user } = useAuth();
    const { categories, loading, error, setError, loadCategories, createCategory, updateCategory, removeCategory } = useCategory();
    const [search, setSearch] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        void loadCategories().catch(() => undefined);
    }, [loadCategories]);

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
            await loadCategories();
        } catch (submitError) {
            setFormError(getApiErrorMessage(submitError, "Nao foi possivel salvar a categoria."));
        } finally {
            setSubmitting(false);
        }
    }

    async function handleRemove(category: Category) {
        if (!window.confirm(`Excluir categoria ${category.name}?`)) {
            return;
        }

        try {
            await removeCategory(category.id);
            await loadCategories();
        } catch (removeError) {
            setError(getApiErrorMessage(removeError, "Nao foi possivel excluir a categoria."));
        }
    }

    return (
        <section className="page-section">
            <PageHeader
                eyebrow="Cadastros"
                title="Categorias"
                description="Organize os grupos de autopecas do catalogo."
                action={
                    canManage(user?.role, ["admin", "gerente", "estoquista"]) && (
                        <button type="button" className="primary-button" onClick={() => setShowForm(true)}>
                            <Plus size={18} aria-hidden="true" />
                            Nova categoria
                        </button>
                    )
                }
            />
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar categoria..." />
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
                            {canManage(user?.role, ["admin", "gerente", "estoquista"]) && (
                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() => {
                                        setEditingCategory(category);
                                        setShowForm(true);
                                    }}
                                >
                                    <Pencil size={16} aria-hidden="true" />
                                    Editar
                                </button>
                            )}
                            {canDelete(user?.role) && (
                                <button type="button" className="danger-button" onClick={() => void handleRemove(category)}>
                                    <Trash2 size={16} aria-hidden="true" />
                                    Excluir
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
