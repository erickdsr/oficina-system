import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
    Boxes,
    Eye,
    Layers3,
    ListFilter,
    PackageCheck,
    PackageX,
    Pencil,
    Plus,
    Trash2,
    X,
} from "lucide-react";
import EmptyState from "../../components/common/EmptyState";
import ConfirmDeleteModal from "../../components/common/ConfirmDeleteModal";
import LoadingState from "../../components/common/LoadingState";
import PageHeader from "../../components/common/PageHeader";
import SearchInput from "../../components/common/SearchInput";
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
    const [search, setSearch] = useState("");
    const [showInactive, setShowInactive] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [supplierFilter, setSupplierFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [brandFilter, setBrandFilter] = useState("all");
    const [unitFilter, setUnitFilter] = useState("all");
    const [stockFilter, setStockFilter] = useState<StockFilter>("all");
    const [sortKey, setSortKey] = useState<ProductSortKey>("name");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
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
            await loadProducts(showInactive);
            setCategories(categoryData);
            setSuppliers(supplierData);
            setStocks(stockData);
        } catch (loadError) {
            setError(getApiErrorMessage(loadError, "Nao foi possivel carregar produtos."));
        }
    }, [loadProducts, setError, showInactive]);

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
        const term = normalizeSearch(search);

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

                if (categoryFilter !== "all" && String(product.categoryId) !== categoryFilter) {
                    return false;
                }

                if (supplierFilter !== "all" && String(product.supplierId ?? "none") !== supplierFilter) {
                    return false;
                }

                if (statusFilter === "active" && !product.status) {
                    return false;
                }

                if (statusFilter === "inactive" && product.status) {
                    return false;
                }

                if (brandFilter !== "all" && productBrand(product) !== brandFilter) {
                    return false;
                }

                if (unitFilter !== "all" && product.unit !== unitFilter) {
                    return false;
                }

                if (stockFilter === "with" && (stock?.quantity ?? 0) <= 0) {
                    return false;
                }

                if (stockFilter === "without" && (stock?.quantity ?? 0) > 0) {
                    return false;
                }

                if (stockFilter === "low" && stockStatus(stock) !== "low") {
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
    }, [brandFilter, categoryFilter, products, search, sortDirection, sortKey, statusFilter, stockByProduct, stockFilter, supplierFilter, unitFilter]);

    useEffect(() => {
        setPage(1);
    }, [brandFilter, categoryFilter, pageSize, search, showInactive, sortDirection, sortKey, statusFilter, stockFilter, supplierFilter, unitFilter]);

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
        setSearch("");
        setCategoryFilter("all");
        setSupplierFilter("all");
        setStatusFilter("all");
        setBrandFilter("all");
        setUnitFilter("all");
        setStockFilter("all");
        setSortKey("name");
        setSortDirection("asc");
    }

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

            <div className="supplier-filter-panel product-filter-panel">
                <div className="supplier-filter-panel__search product-filter-panel__search">
                    <SearchInput value={search} onChange={setSearch} placeholder="Pesquisar produto, codigo, peca, barras ou marca..." />
                    <span>{filteredProducts.length.toLocaleString("pt-BR")} produtos encontrados</span>
                </div>
                <div className="supplier-filter-panel__actions product-filter-panel__actions">
                    <label className="checkbox-field supplier-filter-panel__toggle">
                        <input type="checkbox" checked={showInactive} onChange={(event) => setShowInactive(event.target.checked)} />
                        Mostrar registros desativados
                    </label>
                    {canEditProduct && (
                        <button type="button" className="primary-button" onClick={() => { setEditingProduct(null); setShowForm(true); }}>
                            <Plus size={20} aria-hidden="true" />
                            Novo produto
                        </button>
                    )}
                </div>
            </div>

            <div className="product-filter-grid">
                <label>
                    Categoria
                    <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                        <option value="all">Todas</option>
                        {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                    </select>
                </label>
                <label>
                    Fornecedor
                    <select value={supplierFilter} onChange={(event) => setSupplierFilter(event.target.value)}>
                        <option value="all">Todos</option>
                        <option value="none">Sem fornecedor</option>
                        {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.tradeName || supplier.name}</option>)}
                    </select>
                </label>
                <label>
                    Status
                    <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                        <option value="all">Todos</option>
                        <option value="active">Ativos</option>
                        <option value="inactive">Inativos</option>
                    </select>
                </label>
                <label>
                    Marca
                    <select value={brandFilter} onChange={(event) => setBrandFilter(event.target.value)}>
                        <option value="all">Todas</option>
                        {brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
                    </select>
                </label>
                <label>
                    Unidade
                    <select value={unitFilter} onChange={(event) => setUnitFilter(event.target.value)}>
                        <option value="all">Todas</option>
                        {(["UN", "CX", "KT"] satisfies Unit[]).map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                    </select>
                </label>
                <label>
                    Estoque
                    <select value={stockFilter} onChange={(event) => setStockFilter(event.target.value as StockFilter)}>
                        <option value="all">Todos</option>
                        <option value="with">Com estoque</option>
                        <option value="without">Sem estoque</option>
                        <option value="low">Estoque baixo</option>
                    </select>
                </label>
                <label>
                    Ordenacao
                    <select value={sortKey} onChange={(event) => setSortKey(event.target.value as ProductSortKey)}>
                        <option value="name">Nome</option>
                        <option value="code">Codigo</option>
                        <option value="price">Preco</option>
                        <option value="stockDesc">Maior estoque</option>
                        <option value="stockAsc">Menor estoque</option>
                        <option value="sold">Mais vendidos</option>
                    </select>
                </label>
                <button type="button" className="secondary-button product-filter-reset" onClick={resetFilters}>
                    <ListFilter size={18} aria-hidden="true" />
                    Limpar filtros
                </button>
            </div>

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
                    message={search ? "Nenhum produto encontrado." : "Nenhum produto cadastrado."}
                    description={search ? "Ajuste a pesquisa ou os filtros para localizar um item do catalogo." : "Cadastre produtos para compor o catalogo comercial."}
                    actionLabel={canEditProduct ? "Novo produto" : undefined}
                    onAction={canEditProduct ? () => setShowForm(true) : undefined}
                />
            ) : (
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
                            Registros por pagina
                            <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
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
