import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
    Boxes,
    Eye,
    Layers3,
    PackageCheck,
    PackageX,
    Pencil,
    Plus,
    Trash2,
    X,
} from "lucide-react";
import EmptyState from "../../components/common/EmptyState";
import ConfirmDeleteModal from "../../components/common/ConfirmDeleteModal";
import { ActiveFilterChips, FilterPanel, FilterResultSummary, FilterSegmentedControl, FilterSelect } from "../../components/common/FilterPanel";
import LoadingState from "../../components/common/LoadingState";
import PageHeader from "../../components/common/PageHeader";
import StatusBadge from "../../components/common/StatusBadge";
import { useAuth } from "../../context/auth.context";
import { getApiErrorMessage } from "../../services/api";
import categoryService from "../../services/category.service";
import useProduct from "../../hooks/useProduct";
import supplierService from "../../services/supplier.service";
import productService from "../../services/product.service";
import stockService from "../../services/stock.service";
import type { DeletionReport } from "../../types/api.types";
import type { Category } from "../../types/category.types";
import type { ProductRequest, ProductResponse, Unit } from "../../types/product.types";
import type { StockRequest, StockResponse } from "../../types/stock.types";
import type { Supplier } from "../../types/supplier.types";
import { formatCurrency, formatDateTime } from "../../utils/formatters";
import { canDelete, canManage } from "../../utils/permissions";
import { normalizeSearch } from "../../utils/text";
import ProductForm, { type ProductFormPayload } from "./ProductForm";

type ProductSortKey = "name" | "code" | "price" | "stockDesc" | "stockAsc" | "sold";
type StockFilter = "all" | "with" | "without" | "low";
type SortDirection = "asc" | "desc";
type ProductStatusFilter = "all" | "active" | "inactive";

interface ProductFilters {
    search: string;
    categoryFilter: string;
    supplierFilter: string;
    statusFilter: ProductStatusFilter;
    brandFilter: string;
    unitFilter: string;
    stockFilter: StockFilter;
    sortKey: ProductSortKey;
    sortDirection: SortDirection;
}

const defaultProductFilters: ProductFilters = {
    search: "",
    categoryFilter: "all",
    supplierFilter: "all",
    statusFilter: "all",
    brandFilter: "all",
    unitFilter: "all",
    stockFilter: "all",
    sortKey: "name",
    sortDirection: "asc",
};

interface ProductTableRowProps {
    product: ProductResponse;
    stock?: StockResponse;
    selected: boolean;
    canEdit: boolean;
    canRemove: boolean;
    onView: (product: ProductResponse) => void;
    onEdit: (product: ProductResponse) => void;
    onDelete: (product: ProductResponse) => void;
}

function internalCode(product: ProductResponse) {
    return product.internalCode || `PROD-${String(product.id).padStart(6, "0")}`;
}

function productBrand(product: ProductResponse) {
    return product.brand?.trim() || "-";
}

function productStatus(product: ProductResponse) {
    return product.status
        ? { label: "Ativo", tone: "success" as const }
        : { label: "Inativo", tone: "muted" as const };
}

function stockStatus(stock?: StockResponse) {
    if (!stock || stock.quantity <= 0) {
        return "empty";
    }

    if (stock.quantity <= stock.minQuantity) {
        return "low";
    }

    return "normal";
}

function stockPercent(stock?: StockResponse) {
    if (!stock || stock.quantity <= 0) {
        return 0;
    }

    const reference = Math.max(stock.minQuantity * 2, stock.quantity, 1);
    return Math.min(100, Math.round((stock.quantity / reference) * 100));
}

function stockLabel(stock?: StockResponse) {
    const quantity = stock?.quantity ?? 0;
    return `${quantity.toLocaleString("pt-BR")} ${quantity === 1 ? "unidade" : "unidades"}`;
}

function marginPercent(product: ProductResponse) {
    if (!product.costPrice) {
        return 0;
    }

    return ((product.salePrice - product.costPrice) / product.costPrice) * 100;
}

function descriptionSummary(description?: string) {
    if (!description?.trim()) {
        return "Sem descricao cadastrada";
    }

    return description.length > 58 ? `${description.slice(0, 58).trim()}...` : description;
}

function toStockRequest(productId: number, payload: ProductFormPayload): StockRequest | null {
    if (payload.quantity <= 0 && payload.minQuantity <= 0 && !payload.location.trim()) {
        return null;
    }

    return {
        productId,
        quantity: Math.max(0, payload.quantity),
        minQuantity: Math.max(0, payload.minQuantity),
        location: payload.location.trim(),
    };
}

const ProductTableRow = memo(function ProductTableRow({
    product,
    stock,
    selected,
    canEdit,
    canRemove,
    onView,
    onEdit,
    onDelete,
}: ProductTableRowProps) {
    const status = productStatus(product);
    const currentStockStatus = stockStatus(stock);

    return (
        <tr className={`product-row${selected ? " product-row--selected" : ""}`} onClick={() => onView(product)}>
            <td>
                <div className="product-name-cell">
                    <strong>{product.name}</strong>
                    <span>{descriptionSummary(product.description)}</span>
                </div>
            </td>
            <td>
                <div className="product-code-cell">
                    <strong>{internalCode(product)}</strong>
                    <span>{product.partNumber || "-"}</span>
                </div>
            </td>
            <td><span className="product-soft-badge">{product.categoryName}</span></td>
            <td>{product.supplierName ?? "-"}</td>
            <td><span className="product-unit-badge">{product.unit}</span></td>
            <td className="product-cost">{formatCurrency(product.costPrice)}</td>
            <td className="product-sale">{formatCurrency(product.salePrice)}</td>
            <td>
                <div className={`product-stock-cell ${currentStockStatus}`}>
                    <strong>{stockLabel(stock)}</strong>
                    <span className="product-stock-bar" aria-hidden="true">
                        <span style={{ width: `${stockPercent(stock)}%` }} />
                    </span>
                </div>
            </td>
            <td><StatusBadge label={status.label} tone={status.tone} /></td>
            <td className="product-actions-cell">
                <div className="table-actions product-actions">
                    <button
                        type="button"
                        className="table-action-button tooltip-button"
                        aria-label={`Visualizar produto ${product.name}`}
                        title="Visualizar produto"
                        data-tooltip="Visualizar"
                        onClick={(event) => {
                            event.stopPropagation();
                            onView(product);
                        }}
                    >
                        <Eye size={22} strokeWidth={2.3} aria-hidden="true" />
                    </button>
                    {canEdit && (
                        <button
                            type="button"
                            className="table-action-button table-action-button--edit tooltip-button"
                            aria-label={`Editar produto ${product.name}`}
                            title="Editar produto"
                            data-tooltip="Editar"
                            onClick={(event) => {
                                event.stopPropagation();
                                onEdit(product);
                            }}
                        >
                            <Pencil size={22} strokeWidth={2.3} aria-hidden="true" />
                        </button>
                    )}
                    {canRemove && (
                        <button
                            type="button"
                            className="table-action-button table-action-button--delete tooltip-button"
                            aria-label={`Excluir produto ${product.name}`}
                            title="Excluir produto"
                            data-tooltip="Excluir"
                            onClick={(event) => {
                                event.stopPropagation();
                                onDelete(product);
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

export function ProductList() {
    const { user } = useAuth();
    const { products, loading, error, setError, loadProducts, createProduct, updateProduct, removeProduct, forceDeleteProduct } = useProduct();
    const [categories, setCategories] = useState<Category[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [stocks, setStocks] = useState<StockResponse[]>([]);
    const [appliedFilters, setAppliedFilters] = useState<ProductFilters>(defaultProductFilters);
    const [draftFilters, setDraftFilters] = useState<ProductFilters>(defaultProductFilters);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [isApplyingFilters, setIsApplyingFilters] = useState(false);
    const sortKey = appliedFilters.sortKey;
    const sortDirection = appliedFilters.sortDirection;
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [editingProduct, setEditingProduct] = useState<ProductResponse | null>(null);
    const [productToDelete, setProductToDelete] = useState<ProductResponse | null>(null);
    const [productToView, setProductToView] = useState<ProductResponse | null>(null);
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [deletionReport, setDeletionReport] = useState<DeletionReport | null>(null);
    const [showForm, setShowForm] = useState(false);

    const canEditProduct = canManage(user?.role, ["ADMIN", "MANAGER", "STOCK"]);
    const canDeleteProduct = canDelete(user?.role, ["ADMIN", "MANAGER", "STOCK"]);

    const loadData = useCallback(async () => {
        setError(null);
        try {
            const [categoryData, supplierData, stockData] = await Promise.all([
                categoryService.list(),
                supplierService.list(),
                stockService.list(),
            ]);
            await loadProducts(appliedFilters.statusFilter !== "active");
            setCategories(categoryData);
            setSuppliers(supplierData);
            setStocks(stockData);
        } catch (loadError) {
            setError(getApiErrorMessage(loadError, "Nao foi possivel carregar produtos."));
        }
    }, [appliedFilters.statusFilter, loadProducts, setError]);

    useEffect(() => {
        void loadData().catch(() => undefined);
    }, [loadData]);

    const stockByProduct = useMemo(() => {
        return stocks.reduce<Record<number, StockResponse>>((accumulator, stock) => {
            if (stock.productId !== null) {
                accumulator[stock.productId] = stock;
            }
            return accumulator;
        }, {});
    }, [stocks]);

    const brands = useMemo(() => {
        return Array.from(new Set(products.map(productBrand).filter((brand) => brand !== "-"))).sort((left, right) =>
            left.localeCompare(right, "pt-BR", { sensitivity: "base" }),
        );
    }, [products]);

    const productStats = useMemo(() => {
        const activeCount = products.filter((product) => product.status).length;
        const inactiveCount = products.length - activeCount;
        const lowStockCount = products.filter((product) => stockStatus(stockByProduct[product.id]) === "low").length;
        const totalStockValue = products.reduce((total, product) => {
            const quantity = stockByProduct[product.id]?.quantity ?? 0;
            return total + quantity * product.costPrice;
        }, 0);

        return {
            activeCount,
            inactiveCount,
            lowStockCount,
            totalStockValue,
        };
    }, [products, stockByProduct]);

    const filteredProducts = useMemo(() => {
        const term = normalizeSearch(appliedFilters.search);

        return [...products]
            .filter((product) => {
                const stock = stockByProduct[product.id];
                const fields = [
                    product.name,
                    product.description,
                    internalCode(product),
                    product.partNumber,
                    product.barCode,
                    productBrand(product),
                    product.categoryName,
                    product.supplierName ?? "",
                ].map(normalizeSearch);

                if (term && !fields.some((field) => field.includes(term))) {
                    return false;
                }

                if (appliedFilters.categoryFilter !== "all" && String(product.categoryId) !== appliedFilters.categoryFilter) {
                    return false;
                }

                if (appliedFilters.supplierFilter !== "all" && String(product.supplierId ?? "none") !== appliedFilters.supplierFilter) {
                    return false;
                }

                if (appliedFilters.statusFilter === "active" && !product.status) {
                    return false;
                }

                if (appliedFilters.statusFilter === "inactive" && product.status) {
                    return false;
                }

                if (appliedFilters.brandFilter !== "all" && productBrand(product) !== appliedFilters.brandFilter) {
                    return false;
                }

                if (appliedFilters.unitFilter !== "all" && product.unit !== appliedFilters.unitFilter) {
                    return false;
                }

                if (appliedFilters.stockFilter === "with" && (stock?.quantity ?? 0) <= 0) {
                    return false;
                }

                if (appliedFilters.stockFilter === "without" && (stock?.quantity ?? 0) > 0) {
                    return false;
                }

                if (appliedFilters.stockFilter === "low" && stockStatus(stock) !== "low") {
                    return false;
                }

                return true;
            })
            .sort((left, right) => {
                let comparison: number;

                if (sortKey === "code") {
                    comparison = internalCode(left).localeCompare(internalCode(right));
                } else if (sortKey === "price") {
                    comparison = left.salePrice - right.salePrice;
                } else if (sortKey === "stockDesc" || sortKey === "stockAsc") {
                    comparison = (stockByProduct[left.id]?.quantity ?? 0) - (stockByProduct[right.id]?.quantity ?? 0);
                    return sortKey === "stockDesc" ? -comparison : comparison;
                } else if (sortKey === "sold") {
                    comparison = 0;
                } else {
                    comparison = left.name.localeCompare(right.name, "pt-BR", { sensitivity: "base" });
                }

                return sortDirection === "asc" ? comparison : -comparison;
            });
    }, [appliedFilters.brandFilter, appliedFilters.categoryFilter, appliedFilters.search, appliedFilters.statusFilter, appliedFilters.stockFilter, appliedFilters.supplierFilter, appliedFilters.unitFilter, products, sortDirection, sortKey, stockByProduct]);

    useEffect(() => {
        setPage(1);
    }, [appliedFilters, pageSize]);

    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const pageStart = filteredProducts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const pageEnd = Math.min(currentPage * pageSize, filteredProducts.length);
    const paginatedProducts = useMemo(
        () => filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [currentPage, filteredProducts, pageSize],
    );
    const visiblePages = useMemo(() => {
        const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
        const end = Math.min(totalPages, start + 4);
        return Array.from({ length: end - start + 1 }, (_, index) => start + index);
    }, [currentPage, totalPages]);

    const formProduct = editingProduct;
    const formStock = editingProduct ? stockByProduct[editingProduct.id] : undefined;
    const viewedStock = productToView ? stockByProduct[productToView.id] : undefined;

    async function syncStock(productId: number, payload: ProductFormPayload) {
        const stockRequest = toStockRequest(productId, payload);
        if (!stockRequest) {
            return;
        }

        const existingStock = stockByProduct[productId];
        if (existingStock) {
            await stockService.update(existingStock.id, stockRequest);
            return;
        }

        await stockService.create(stockRequest);
    }

    async function handleSubmit(payload: ProductFormPayload) {
        setSubmitting(true);
        setFormError(null);
        try {
            const productPayload: ProductRequest = {
                name: payload.name,
                description: payload.description,
                partNumber: payload.partNumber,
                barCode: payload.barCode,
                brand: payload.brand,
                categoryId: payload.categoryId,
                supplierId: payload.supplierId,
                costPrice: payload.costPrice,
                salePrice: payload.salePrice,
                unit: payload.unit,
                status: payload.status,
                allowSaleBelowCost: payload.allowSaleBelowCost,
            };

            const savedProduct = editingProduct
                ? await updateProduct(editingProduct.id, productPayload)
                : await createProduct(productPayload);

            await syncStock(savedProduct.id, payload);
            setShowForm(false);
            setEditingProduct(null);
            await loadData();
        } catch (submitError) {
            setFormError(getApiErrorMessage(submitError, "Nao foi possivel salvar o produto."));
        } finally {
            setSubmitting(false);
        }
    }

    const handleViewClick = useCallback((product: ProductResponse) => {
        setSelectedProductId(product.id);
        setProductToView(product);
    }, []);

    const handleEditClick = useCallback((product: ProductResponse) => {
        setEditingProduct(product);
        setShowForm(true);
    }, []);

    async function handleDeleteClick(product: ProductResponse) {
        setDeleteError(null);
        setError(null);
        setProductToDelete(product);
        setDeletionReport(null);
        try {
            setDeletionReport(await productService.getDeletionReport(product.id));
        } catch (reportError) {
            setDeleteError(getApiErrorMessage(reportError, "Nao foi possivel carregar os vinculos do produto."));
        }
    }

    async function handleConfirmDelete() {
        if (!productToDelete || isDeleting) {
            return;
        }

        setIsDeleting(true);
        setDeleteError(null);
        try {
            await removeProduct(productToDelete.id);
            await loadData();
            setProductToDelete(null);
            setDeletionReport(null);
        } catch (removeError) {
            setDeleteError(getApiErrorMessage(removeError, "Nao foi possivel excluir o produto. Tente novamente."));
        } finally {
            setIsDeleting(false);
        }
    }

    async function handleForceDelete() {
        if (!productToDelete || isDeleting) {
            return;
        }

        setIsDeleting(true);
        setDeleteError(null);
        try {
            await forceDeleteProduct(productToDelete.id);
            await loadData();
            setProductToDelete(null);
            setDeletionReport(null);
        } catch (removeError) {
            setDeleteError(getApiErrorMessage(removeError, "Nao foi possivel excluir definitivamente o produto."));
        } finally {
            setIsDeleting(false);
        }
    }

    function handleCancelDelete() {
        if (isDeleting) {
            return;
        }

        setProductToDelete(null);
        setDeleteError(null);
        setDeletionReport(null);
    }

    function closeForm() {
        setShowForm(false);
        setEditingProduct(null);
    }

    function resetFilters() {
        setDraftFilters(defaultProductFilters);
        setAppliedFilters(defaultProductFilters);
        setIsApplyingFilters(false);
    }

    function applyFilters() {
        setIsApplyingFilters(true);
        setAppliedFilters(draftFilters);
        setPage(1);
        window.setTimeout(() => setIsApplyingFilters(false), 180);
    }

    const activeFilterCount = useMemo(() => {
        return [
            appliedFilters.search.trim() !== "",
            appliedFilters.categoryFilter !== defaultProductFilters.categoryFilter,
            appliedFilters.supplierFilter !== defaultProductFilters.supplierFilter,
            appliedFilters.statusFilter !== defaultProductFilters.statusFilter,
            appliedFilters.brandFilter !== defaultProductFilters.brandFilter,
            appliedFilters.unitFilter !== defaultProductFilters.unitFilter,
            appliedFilters.stockFilter !== defaultProductFilters.stockFilter,
            appliedFilters.sortKey !== defaultProductFilters.sortKey || appliedFilters.sortDirection !== defaultProductFilters.sortDirection,
        ].filter(Boolean).length;
    }, [appliedFilters]);

    const draftActiveFilterCount = useMemo(() => {
        return [
            draftFilters.search.trim() !== "",
            draftFilters.categoryFilter !== defaultProductFilters.categoryFilter,
            draftFilters.supplierFilter !== defaultProductFilters.supplierFilter,
            draftFilters.statusFilter !== defaultProductFilters.statusFilter,
            draftFilters.brandFilter !== defaultProductFilters.brandFilter,
            draftFilters.unitFilter !== defaultProductFilters.unitFilter,
            draftFilters.stockFilter !== defaultProductFilters.stockFilter,
            draftFilters.sortKey !== defaultProductFilters.sortKey || draftFilters.sortDirection !== defaultProductFilters.sortDirection,
        ].filter(Boolean).length;
    }, [draftFilters]);

    const hasActiveFilters = activeFilterCount > 0;

    return (
        <section className="page-section product-page">
            <PageHeader
                eyebrow="Catalogo"
                title="Produtos"
                description="Gerencie o catalogo de produtos, precos, estoque e fornecedores."
            />

            <div className="supplier-stats-row product-stats-row">
                <div className="metric-card supplier-metric-card product-metric-card success">
                    <PackageCheck size={18} aria-hidden="true" />
                    <span>Produtos Ativos</span>
                    <strong>{productStats.activeCount.toLocaleString("pt-BR")}</strong>
                </div>
                <div className="metric-card supplier-metric-card product-metric-card">
                    <PackageX size={18} aria-hidden="true" />
                    <span>Produtos Inativos</span>
                    <strong>{productStats.inactiveCount.toLocaleString("pt-BR")}</strong>
                </div>
                <div className="metric-card supplier-metric-card product-metric-card">
                    <Boxes size={18} aria-hidden="true" />
                    <span>Valor Total em Estoque</span>
                    <strong>{formatCurrency(productStats.totalStockValue)}</strong>
                </div>
                <div className={`metric-card supplier-metric-card product-metric-card${productStats.lowStockCount > 0 ? " warning" : ""}`}>
                    <Layers3 size={18} aria-hidden="true" />
                    <span>Estoque Baixo</span>
                    <strong>{productStats.lowStockCount.toLocaleString("pt-BR")}</strong>
                </div>
            </div>

            <FilterPanel
                search={draftFilters.search}
                searchPlaceholder="Pesquisar por nome, codigo, numero da peca ou fornecedor..."
                filtersOpen={filtersOpen}
                activeFilterCount={activeFilterCount}
                isApplying={isApplyingFilters}
                hasActiveFilters={hasActiveFilters}
                onSearchChange={(search) => setDraftFilters((current) => ({ ...current, search }))}
                onSearchSubmit={applyFilters}
                onToggleFilters={() => setFiltersOpen((current) => !current)}
                onClearFilters={resetFilters}
                onApplyFilters={applyFilters}
                chips={draftActiveFilterCount > 0 && (
                    <ActiveFilterChips>
                        {draftFilters.statusFilter !== "all" && <button type="button" onClick={() => setDraftFilters((current) => ({ ...current, statusFilter: "all" }))}>{draftFilters.statusFilter === "active" ? "Ativos" : "Inativos"} <X size={13} aria-hidden="true" /></button>}
                        {draftFilters.stockFilter !== "all" && <button type="button" onClick={() => setDraftFilters((current) => ({ ...current, stockFilter: "all" }))}>Estoque <X size={13} aria-hidden="true" /></button>}
                        {draftFilters.categoryFilter !== "all" && <button type="button" onClick={() => setDraftFilters((current) => ({ ...current, categoryFilter: "all" }))}>Categoria <X size={13} aria-hidden="true" /></button>}
                        {draftFilters.supplierFilter !== "all" && <button type="button" onClick={() => setDraftFilters((current) => ({ ...current, supplierFilter: "all" }))}>Fornecedor <X size={13} aria-hidden="true" /></button>}
                    </ActiveFilterChips>
                )}
                primaryAction={canEditProduct && (
                        <button type="button" className="primary-button" onClick={() => { setEditingProduct(null); setShowForm(true); }}>
                            <Plus size={20} aria-hidden="true" />
                            Novo produto
                        </button>
                )}
            >
                <FilterSelect label="Ordenacao" value={draftFilters.sortKey} onChange={(sortKey) => setDraftFilters((current) => ({ ...current, sortKey }))} options={[
                    { value: "name", label: "Nome" },
                    { value: "code", label: "Codigo" },
                    { value: "price", label: "Preco" },
                    { value: "stockDesc", label: "Maior estoque" },
                    { value: "stockAsc", label: "Menor estoque" },
                    { value: "sold", label: "Mais vendidos" },
                ]} />
                <FilterSegmentedControl label="Status" value={draftFilters.statusFilter} onChange={(statusFilter) => setDraftFilters((current) => ({ ...current, statusFilter }))} options={[
                    { value: "all", label: "Todos" },
                    { value: "active", label: "Ativos" },
                    { value: "inactive", label: "Inativos" },
                ]} />
                <FilterSelect label="Categoria" value={draftFilters.categoryFilter} onChange={(categoryFilter) => setDraftFilters((current) => ({ ...current, categoryFilter }))} options={[
                    { value: "all", label: "Todas" },
                    ...categories.map((category) => ({ value: String(category.id), label: category.name })),
                ]} />
                <FilterSelect label="Fornecedor" value={draftFilters.supplierFilter} onChange={(supplierFilter) => setDraftFilters((current) => ({ ...current, supplierFilter }))} options={[
                    { value: "all", label: "Todos" },
                    { value: "none", label: "Sem fornecedor" },
                    ...suppliers.map((supplier) => ({ value: String(supplier.id), label: supplier.tradeName || supplier.name })),
                ]} />
                <FilterSelect label="Estoque" value={draftFilters.stockFilter} onChange={(stockFilter) => setDraftFilters((current) => ({ ...current, stockFilter }))} options={[
                    { value: "all", label: "Todos" },
                    { value: "with", label: "Disponivel" },
                    { value: "without", label: "Sem estoque" },
                    { value: "low", label: "Baixo" },
                ]} />
                <FilterSelect label="Marca" value={draftFilters.brandFilter} onChange={(brandFilter) => setDraftFilters((current) => ({ ...current, brandFilter }))} options={[
                    { value: "all", label: "Todas" },
                    ...brands.map((brand) => ({ value: brand, label: brand })),
                ]} />
                <FilterSelect label="Unidade" value={draftFilters.unitFilter} onChange={(unitFilter) => setDraftFilters((current) => ({ ...current, unitFilter }))} options={[
                    { value: "all", label: "Todas" },
                    ...(["UN", "CX", "KT"] satisfies Unit[]).map((unit) => ({ value: unit, label: unit })),
                ]} />
            </FilterPanel>

            {showForm && (
                <ProductForm
                    product={formProduct}
                    stock={formStock}
                    categories={categories}
                    suppliers={suppliers}
                    loading={submitting}
                    error={formError}
                    onCancel={closeForm}
                    onSubmit={handleSubmit}
                />
            )}
            {error && <div className="form-error">{error}</div>}
            {loading ? <LoadingState /> : filteredProducts.length === 0 ? (
                <EmptyState
                    message={hasActiveFilters ? "Nenhum produto encontrado com os filtros atuais." : "Nenhum produto cadastrado."}
                    description={hasActiveFilters ? "Ajuste a pesquisa ou os filtros para localizar um item do catalogo." : "Cadastre produtos para compor o catalogo comercial."}
                    actionLabel={hasActiveFilters ? "Limpar filtros" : canEditProduct ? "Novo produto" : undefined}
                    onAction={hasActiveFilters ? resetFilters : canEditProduct ? () => setShowForm(true) : undefined}
                />
            ) : (
                <>
                <FilterResultSummary total={filteredProducts.length} noun="produtos" hasActiveFilters={hasActiveFilters} />
                <div className="table-wrap product-table-wrap">
                    <table className="data-table product-table">
                        <thead>
                            <tr>
                                <th>Produto</th>
                                <th>Codigo</th>
                                <th>Categoria</th>
                                <th>Fornecedor</th>
                                <th>Unidade</th>
                                <th>Custo</th>
                                <th>Venda</th>
                                <th>Estoque</th>
                                <th>Status</th>
                                <th>Acoes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedProducts.map((product) => (
                                <ProductTableRow
                                    key={product.id}
                                    product={product}
                                    stock={stockByProduct[product.id]}
                                    selected={selectedProductId === product.id}
                                    canEdit={canEditProduct}
                                    canRemove={canDeleteProduct}
                                    onView={handleViewClick}
                                    onEdit={handleEditClick}
                                    onDelete={handleDeleteClick}
                                />
                            ))}
                        </tbody>
                    </table>
                    <div className="supplier-pagination product-pagination">
                        <span>Mostrando {pageStart}-{pageEnd} de {filteredProducts.length.toLocaleString("pt-BR")} produtos</span>
                        <label>
                            <select aria-label="Registros por pagina" value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
                                {[10, 20, 50, 100].map((size) => (
                                    <option key={size} value={size}>{size}</option>
                                ))}
                            </select>
                        </label>
                        <div className="supplier-pagination__pages" aria-label="Paginacao de produtos">
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
                </>
            )}

            <ConfirmDeleteModal
                isOpen={productToDelete !== null}
                title="Excluir produto"
                itemName={productToDelete?.name}
                description="Esta acao nao podera ser desfeita."
                confirmLabel="Excluir produto"
                isLoading={isDeleting}
                error={deleteError}
                report={deletionReport}
                userRole={user?.role}
                onConfirm={handleConfirmDelete}
                onForceConfirm={handleForceDelete}
                onCancel={handleCancelDelete}
            />

            {productToView && (
                <div className="modal-overlay" role="presentation" onMouseDown={(event) => {
                    if (event.target === event.currentTarget) {
                        setProductToView(null);
                    }
                }}>
                    <aside className="product-detail-modal" role="dialog" aria-modal="true" aria-label="Visualizar produto">
                        <div className="supplier-detail-modal__header">
                            <div>
                                <span>Visualizar produto</span>
                                <h2>{productToView.name}</h2>
                            </div>
                            <button
                                type="button"
                                className="table-action-button tooltip-button"
                                aria-label="Fechar detalhes"
                                title="Fechar"
                                data-tooltip="Fechar"
                                onClick={() => setProductToView(null)}
                            >
                                <X size={19} aria-hidden="true" />
                            </button>
                        </div>
                        <dl className="supplier-detail-grid product-detail-grid">
                            <div><dt>Codigo interno</dt><dd>{internalCode(productToView)}</dd></div>
                            <div><dt>Numero da peca</dt><dd>{productToView.partNumber || "-"}</dd></div>
                            <div><dt>Codigo de barras</dt><dd>{productToView.barCode || "-"}</dd></div>
                            <div><dt>Marca</dt><dd>{productBrand(productToView)}</dd></div>
                            <div className="span-2"><dt>Nome</dt><dd>{productToView.name}</dd></div>
                            <div className="span-2"><dt>Descricao</dt><dd>{productToView.description || "-"}</dd></div>
                            <div><dt>Categoria</dt><dd>{productToView.categoryName}</dd></div>
                            <div><dt>Fornecedor</dt><dd>{productToView.supplierName ?? "-"}</dd></div>
                            <div><dt>Unidade</dt><dd><span className="product-unit-badge">{productToView.unit}</span></dd></div>
                            <div><dt>Preco de custo</dt><dd>{formatCurrency(productToView.costPrice)}</dd></div>
                            <div><dt>Preco de venda</dt><dd>{formatCurrency(productToView.salePrice)}</dd></div>
                            <div><dt>Margem</dt><dd>{marginPercent(productToView).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</dd></div>
                            <div><dt>Estoque</dt><dd>{stockLabel(viewedStock)}</dd></div>
                            <div><dt>Estoque minimo</dt><dd>{viewedStock?.minQuantity ?? 0}</dd></div>
                            <div><dt>Localizacao</dt><dd>{viewedStock?.location || "-"}</dd></div>
                            <div><dt>Status</dt><dd><StatusBadge label={productStatus(productToView).label} tone={productStatus(productToView).tone} /></dd></div>
                            <div><dt>Data de criacao</dt><dd>{formatDateTime(productToView.createdAt)}</dd></div>
                            <div><dt>Ultima atualizacao</dt><dd>{formatDateTime(productToView.updatedAt)}</dd></div>
                        </dl>
                    </aside>
                </div>
            )}

        </section>
    );
}

export default ProductList;
