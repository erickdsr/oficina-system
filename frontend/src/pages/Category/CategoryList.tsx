import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { CircleCheck, Eye, Layers3, PackageCheck, PackageX, Pencil, Plus, Trash2, X } from "lucide-react";
import ConfirmDeleteModal from "../../components/common/ConfirmDeleteModal";
import EmptyState from "../../components/common/EmptyState";
import LoadingState from "../../components/common/LoadingState";
import PageHeader from "../../components/common/PageHeader";
import SearchInput from "../../components/common/SearchInput";
import StatusBadge from "../../components/common/StatusBadge";
import { useAuth } from "../../context/auth.context";
import useCategory from "../../hooks/useCategory";
import { getApiErrorMessage } from "../../services/api";
import categoryService from "../../services/category.service";
import productService from "../../services/product.service";
import type { DeletionReport } from "../../types/api.types";
import type { Category, CategoryRequest } from "../../types/category.types";
import type { ProductResponse } from "../../types/product.types";
import { canDelete, canManage } from "../../utils/permissions";
import { formatDateTime } from "../../utils/formatters";
import { normalizeSearch } from "../../utils/text";
import CategoryForm from "./CategoryForm";

type CategorySortKey = "name" | "products" | "status";
type SortDirection = "asc" | "desc";

interface CategoryTableRowProps {
    category: Category;
    productCount: number;
    selected: boolean;
    canEdit: boolean;
    canRemove: boolean;
    onView: (category: Category) => void;
    onEdit: (category: Category) => void;
    onDelete: (category: Category) => void;
}

function categoryStatus(category: Category) {
    return category.status
        ? { label: "Ativa", tone: "success" as const }
        : { label: "Desativada", tone: "danger" as const };
}

function productCountLabel(count: number) {
    return `${count} ${count === 1 ? "produto" : "produtos"}`;
}

function productSummaryText(count: number) {
    return count > 0 ? `${productCountLabel(count)} cadastrados` : "Nenhum produto cadastrado";
}

function categoryCountLabel(count: number) {
    return `${count} ${count === 1 ? "categoria" : "categorias"}`;
}

function productBadgeTone(count: number) {
    if (count === 0) {
        return "empty";
    }

    if (count === 1) {
        return "single";
    }

    return "busy";
}

const CategoryTableRow = memo(function CategoryTableRow({
    category,
    productCount,
    selected,
    canEdit,
    canRemove,
    onView,
    onEdit,
    onDelete,
}: CategoryTableRowProps) {
    const status = categoryStatus(category);
    const description = category.description || "-";

    return (
        <tr className={`category-row${selected ? " category-row--selected" : ""}`} onClick={() => onView(category)}>
            <td>
                <div className="category-name-cell">
                    <strong>{category.name}</strong>
                </div>
            </td>
            <td>{description}</td>
            <td className="category-products-count">
                <span className={`category-products-badge ${productBadgeTone(productCount)}`}>
                    {productCount} {productCount === 1 ? "Produto" : "Produtos"}
                </span>
            </td>
            <td><StatusBadge label={status.label} tone={status.tone} /></td>
            <td className="category-actions-cell">
                <div className="table-actions category-actions">
                    <button
                        type="button"
                        className="table-action-button tooltip-button"
                        aria-label={`Visualizar categoria ${category.name}`}
                        title="Visualizar categoria"
                        data-tooltip="Visualizar categoria"
                        onClick={(event) => {
                            event.stopPropagation();
                            onView(category);
                        }}
                    >
                        <Eye size={22} strokeWidth={2.3} aria-hidden="true" />
                    </button>
                    {canEdit && (
                        <button
                            type="button"
                            className="table-action-button table-action-button--edit tooltip-button"
                            aria-label={`Editar categoria ${category.name}`}
                            title="Editar categoria"
                            data-tooltip="Editar categoria"
                            onClick={(event) => {
                                event.stopPropagation();
                                onEdit(category);
                            }}
                        >
                            <Pencil size={22} strokeWidth={2.3} aria-hidden="true" />
                        </button>
                    )}
                    {canRemove && (
                        <button
                            type="button"
                            className="table-action-button table-action-button--delete tooltip-button"
                            aria-label={`Excluir categoria ${category.name}`}
                            title="Excluir categoria"
                            data-tooltip="Excluir categoria"
                            onClick={(event) => {
                                event.stopPropagation();
                                onDelete(category);
                            }}
                        >
                            <Trash2 size={22} strokeWidth={2.3} aria-hidden="true" />
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
});

export function CategoryList() {
    const { user } = useAuth();
    const { categories, loading, error, setError, loadCategories, createCategory, updateCategory } = useCategory();
    const [products, setProducts] = useState<ProductResponse[]>([]);
    const [search, setSearch] = useState("");
    const [showInactive, setShowInactive] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
    const [categoryToView, setCategoryToView] = useState<Category | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [deletionReport, setDeletionReport] = useState<DeletionReport | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [sortKey, setSortKey] = useState<CategorySortKey>("name");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [showAllDrawerProducts, setShowAllDrawerProducts] = useState(false);

    const canEditCategory = canManage(user?.role, ["ADMIN", "MANAGER"]);
    const canDeleteCategory = canDelete(user?.role);

    useEffect(() => {
        void loadCategories(showInactive).catch(() => undefined);
    }, [loadCategories, showInactive]);

    useEffect(() => {
        let active = true;

        void productService.list(true).then((data) => {
            if (active) {
                setProducts(data);
            }
        }).catch(() => {
            if (active) {
                setProducts([]);
            }
        });

        return () => {
            active = false;
        };
    }, []);

    const refreshCategoryData = useCallback(async () => {
        const [productData] = await Promise.all([
            productService.list(true),
            loadCategories(showInactive),
        ]);
        setProducts(productData);
    }, [loadCategories, showInactive]);

    const productsByCategory = useMemo(() => {
        return products.reduce<Record<number, ProductResponse[]>>((accumulator, product) => {
            const list = accumulator[product.categoryId] ?? [];
            list.push(product);
            accumulator[product.categoryId] = list;
            return accumulator;
        }, {});
    }, [products]);

    const filteredCategories = useMemo(() => {
        const term = normalizeSearch(search);

        return [...categories]
            .filter((category) => {
                if (!term) {
                    return true;
                }

                return [category.name, category.description]
                    .map(normalizeSearch)
                    .some((value) => value.includes(term));
            })
            .sort((left, right) => {
                let comparison: number;

                if (sortKey === "products") {
                    comparison = (productsByCategory[left.id]?.length ?? 0) - (productsByCategory[right.id]?.length ?? 0);
                } else if (sortKey === "status") {
                    comparison = Number(left.status) - Number(right.status);
                } else {
                    comparison = left.name.localeCompare(right.name, "pt-BR", { sensitivity: "base" });
                }

                return sortDirection === "asc" ? comparison : -comparison;
            });
    }, [categories, productsByCategory, search, sortDirection, sortKey]);

    useEffect(() => {
        setPage(1);
    }, [pageSize, search, showInactive, sortDirection, sortKey]);

    const categoryStats = useMemo(() => {
        const activeCount = categories.filter((category) => category.status).length;
        const disabledCount = categories.length - activeCount;
        const emptyCount = categories.filter((category) => (productsByCategory[category.id]?.length ?? 0) === 0).length;

        return {
            activeCount,
            productCount: products.length,
            emptyCount,
            disabledCount,
        };
    }, [categories, products.length, productsByCategory]);

    const totalPages = Math.max(1, Math.ceil(filteredCategories.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const pageStart = filteredCategories.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const pageEnd = Math.min(currentPage * pageSize, filteredCategories.length);
    const paginatedCategories = useMemo(
        () => filteredCategories.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [currentPage, filteredCategories, pageSize],
    );
    const visiblePages = useMemo(() => {
        const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
        const end = Math.min(totalPages, start + 4);
        return Array.from({ length: end - start + 1 }, (_, index) => start + index);
    }, [currentPage, totalPages]);

    const viewedCategoryProducts = categoryToView ? productsByCategory[categoryToView.id] ?? [] : [];
    const categoryProductsToDelete = categoryToDelete ? productsByCategory[categoryToDelete.id] ?? [] : [];
    const hasCategoryProductsToDelete = categoryProductsToDelete.length > 0;
    const visibleDrawerProducts = showAllDrawerProducts ? viewedCategoryProducts : viewedCategoryProducts.slice(0, 10);

    const handleViewClick = useCallback((category: Category) => {
        setSelectedCategoryId(category.id);
        setCategoryToView(category);
        setShowAllDrawerProducts(false);
    }, []);

    const handleEditClick = useCallback((category: Category) => {
        setEditingCategory(category);
        setShowForm(true);
    }, []);

    const handleDeleteClick = useCallback(async (category: Category) => {
        setDeleteError(null);
        setError(null);
        setDeletionReport(null);
        setCategoryToDelete(category);
        try {
            setDeletionReport(await categoryService.getDeletionReport(category.id));
        } catch (reportError) {
            setDeleteError(getApiErrorMessage(reportError, "Nao foi possivel carregar os vinculos da categoria."));
        }
    }, [setError]);

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
            await refreshCategoryData();
        } catch (submitError) {
            setFormError(getApiErrorMessage(submitError, "Nao foi possivel salvar a categoria."));
        } finally {
            setSubmitting(false);
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
            await refreshCategoryData();
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
            await refreshCategoryData();
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

    function handleSort(nextSortKey: CategorySortKey) {
        if (sortKey === nextSortKey) {
            setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
            return;
        }

        setSortKey(nextSortKey);
        setSortDirection("asc");
    }

    function sortIndicator(targetSortKey: CategorySortKey) {
        if (sortKey !== targetSortKey) {
            return "";
        }

        return sortDirection === "asc" ? " ^" : " v";
    }

    return (
        <section className="page-section category-page">
            <PageHeader
                eyebrow="Cadastros"
                title="Categorias"
                description="Organize os grupos de autopecas do catalogo."
            />
            <div className="supplier-stats-row category-stats-row">
                <div className="metric-card supplier-metric-card category-metric-card success">
                    <Layers3 size={18} aria-hidden="true" />
                    <span>Categorias Ativas</span>
                    <strong className={categoryStats.activeCount === 0 ? "is-muted" : undefined}>
                        {categoryStats.activeCount === 0 ? "Nenhuma categoria ativa" : categoryCountLabel(categoryStats.activeCount)}
                    </strong>
                    <small>Disponiveis para utilizacao.</small>
                </div>
                <div className="metric-card supplier-metric-card category-metric-card">
                    <PackageCheck size={18} aria-hidden="true" />
                    <span>Produtos Vinculados</span>
                    <strong className={categoryStats.productCount === 0 ? "is-muted" : undefined}>
                        {productSummaryText(categoryStats.productCount)}
                    </strong>
                    <small>Distribuidos entre categorias.</small>
                </div>
                <div className={`metric-card supplier-metric-card category-metric-card${categoryStats.emptyCount > 0 ? " warning" : ""}`}>
                    <PackageX size={18} aria-hidden="true" />
                    <span>Categorias sem Produtos</span>
                    <strong className={categoryStats.emptyCount === 0 ? "is-muted" : undefined}>
                        {categoryStats.emptyCount === 0 ? "Nenhuma categoria vazia" : categoryCountLabel(categoryStats.emptyCount)}
                    </strong>
                    <small>{categoryStats.emptyCount > 0 ? "Requer atencao no catalogo." : "Catalogo bem distribuido."}</small>
                </div>
                <div className="metric-card supplier-metric-card category-metric-card">
                    {categoryStats.disabledCount === 0 ? <CircleCheck size={18} aria-hidden="true" /> : <X size={18} aria-hidden="true" />}
                    <span>Categorias Desativadas</span>
                    <strong className={categoryStats.disabledCount === 0 ? "is-muted" : undefined}>
                        {categoryStats.disabledCount === 0 ? "Nenhuma categoria desativada" : categoryCountLabel(categoryStats.disabledCount)}
                    </strong>
                    <small>{categoryStats.disabledCount === 0 ? "Todos os grupos estao disponiveis." : "Fora de uso no catalogo."}</small>
                </div>
            </div>
            <div className="supplier-filter-panel category-filter-panel">
                <div className="supplier-filter-panel__search category-filter-panel__search">
                    <SearchInput value={search} onChange={setSearch} placeholder="Pesquisar categoria..." />
                    <span>Mostrando {filteredCategories.length} categorias</span>
                </div>
                <div className="supplier-filter-panel__actions">
                    <label className="checkbox-field supplier-filter-panel__toggle">
                        <input type="checkbox" checked={showInactive} onChange={(event) => setShowInactive(event.target.checked)} />
                        Mostrar registros desativados
                    </label>
                    {canEditCategory && (
                        <button type="button" className="primary-button" onClick={() => setShowForm(true)}>
                            <Plus size={20} aria-hidden="true" />
                            Nova categoria
                        </button>
                    )}
                </div>
            </div>
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
            ) : filteredCategories.length === 0 ? (
                <EmptyState
                    message={search ? "Nenhuma categoria encontrada." : "Nenhuma categoria cadastrada."}
                    description={
                        search
                            ? "Ajuste a pesquisa ou os filtros para localizar uma categoria."
                            : 'Clique em "Nova Categoria" para comecar.'
                    }
                    actionLabel={canEditCategory ? "Nova Categoria" : undefined}
                    onAction={canEditCategory ? () => setShowForm(true) : undefined}
                />
            ) : (
                <div className="table-wrap category-table-wrap">
                    <table className="data-table category-table">
                        <thead>
                            <tr>
                                <th><button type="button" className="table-sort-button" onClick={() => handleSort("name")}>Categoria{sortIndicator("name")}</button></th>
                                <th>Descricao</th>
                                <th><button type="button" className="table-sort-button" onClick={() => handleSort("products")}>Produtos{sortIndicator("products")}</button></th>
                                <th><button type="button" className="table-sort-button" onClick={() => handleSort("status")}>Status{sortIndicator("status")}</button></th>
                                <th>Acoes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedCategories.map((category) => (
                                <CategoryTableRow
                                    key={category.id}
                                    category={category}
                                    productCount={productsByCategory[category.id]?.length ?? 0}
                                    selected={selectedCategoryId === category.id}
                                    canEdit={canEditCategory}
                                    canRemove={canDeleteCategory}
                                    onView={handleViewClick}
                                    onEdit={handleEditClick}
                                    onDelete={handleDeleteClick}
                                />
                            ))}
                        </tbody>
                    </table>
                    <div className="supplier-pagination category-pagination">
                        <span>Mostrando {pageStart}-{pageEnd} de {filteredCategories.length} categorias</span>
                        <label>
                            Registros por pagina
                            <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
                                {[20, 50, 100].map((size) => (
                                    <option key={size} value={size}>{size}</option>
                                ))}
                            </select>
                        </label>
                        <div className="supplier-pagination__pages" aria-label="Paginacao de categorias">
                            <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={currentPage === 1}>
                                &lt;
                            </button>
                            {visiblePages.map((pageNumber) => (
                                <button
                                    key={pageNumber}
                                    type="button"
                                    className={pageNumber === currentPage ? "active" : undefined}
                                    onClick={() => setPage(pageNumber)}
                                >
                                    {pageNumber}
                                </button>
                            ))}
                            <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={currentPage === totalPages}>
                                &gt;
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <ConfirmDeleteModal
                isOpen={categoryToDelete !== null}
                title="Excluir categoria"
                itemName={categoryToDelete?.name}
                prompt={hasCategoryProductsToDelete ? `Esta categoria possui ${productCountLabel(categoryProductsToDelete.length)} vinculados.` : undefined}
                description={
                    hasCategoryProductsToDelete
                        ? "Para exclui-la e necessario mover os produtos para outra categoria ou remove-los."
                        : "Esta acao nao podera ser desfeita."
                }
                dependencyDescription={
                    hasCategoryProductsToDelete
                        ? "Deseja desativar esta categoria ao inves de exclui-la?"
                        : undefined
                }
                confirmLabel="Excluir categoria"
                isLoading={isDeleting}
                error={deleteError}
                dependencyItemsTitle="Produtos encontrados:"
                dependencyItems={hasCategoryProductsToDelete ? categoryProductsToDelete.slice(0, 3).map((product) => product.name) : []}
                report={deletionReport}
                userRole={user?.role}
                onConfirm={handleConfirmDelete}
                onForceConfirm={handleForceDelete}
                onCancel={handleCancelDelete}
            />
            {categoryToView && (
                <div className="supplier-drawer-overlay" role="presentation" onMouseDown={(event) => {
                    if (event.target === event.currentTarget) {
                        setCategoryToView(null);
                    }
                }}>
                    <aside className="supplier-detail-drawer category-detail-drawer" role="dialog" aria-modal="true" aria-label="Visualizar categoria">
                        <div className="supplier-detail-modal__header">
                            <div>
                                <span>Visualizar categoria</span>
                                <h2>{categoryToView.name}</h2>
                            </div>
                            <button
                                type="button"
                                className="table-action-button tooltip-button"
                                aria-label="Fechar detalhes"
                                title="Fechar"
                                data-tooltip="Fechar"
                                onClick={() => setCategoryToView(null)}
                            >
                                <X size={19} aria-hidden="true" />
                            </button>
                        </div>
                        <section className="supplier-detail-section">
                            <h3>Resumo</h3>
                            <dl className="supplier-detail-grid">
                                <div><dt>Nome</dt><dd>{categoryToView.name}</dd></div>
                                <div><dt>Quantidade de produtos</dt><dd>{productCountLabel(viewedCategoryProducts.length)}</dd></div>
                                <div className="span-2"><dt>Descricao</dt><dd>{categoryToView.description || "-"}</dd></div>
                                <div><dt>Data de criacao</dt><dd>{formatDateTime(categoryToView.createdAt)}</dd></div>
                                <div><dt>Ultima atualizacao</dt><dd>Nao disponivel</dd></div>
                                <div><dt>Responsavel</dt><dd>Nao disponivel</dd></div>
                                <div><dt>Status</dt><dd><StatusBadge label={categoryStatus(categoryToView).label} tone={categoryStatus(categoryToView).tone} /></dd></div>
                            </dl>
                        </section>
                        <section className="supplier-detail-section">
                            <h3>Produtos vinculados</h3>
                            <ul className="category-linked-products">
                                {viewedCategoryProducts.length === 0 ? (
                                    <li>Nenhum produto vinculado.</li>
                                ) : visibleDrawerProducts.map((product) => (
                                    <li key={product.id}>{product.name}</li>
                                ))}
                            </ul>
                            {viewedCategoryProducts.length > 10 && (
                                <button
                                    type="button"
                                    className="secondary-button category-drawer-more"
                                    onClick={() => setShowAllDrawerProducts((current) => !current)}
                                >
                                    {showAllDrawerProducts ? "Mostrar menos" : `Ver todos (${viewedCategoryProducts.length})`}
                                </button>
                            )}
                        </section>
                    </aside>
                </div>
            )}
        </section>
    );
}

export default CategoryList;
