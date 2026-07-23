import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import EmptyState from "../../components/common/EmptyState";
import LoadingState from "../../components/common/LoadingState";
import PageHeader from "../../components/common/PageHeader";
import SearchInput from "../../components/common/SearchInput";
import StatusBadge from "../../components/common/StatusBadge";
import { useAuth } from "../../context/auth.context";
import { getApiErrorMessage } from "../../services/api";
import categoryService from "../../services/category.service";
import useProduct from "../../hooks/useProduct";
import supplierService from "../../services/supplier.service";
import type { Category } from "../../types/category.types";
import type { ProductRequest, ProductResponse } from "../../types/product.types";
import type { Supplier } from "../../types/supplier.types";
import { formatCurrency } from "../../utils/formatters";
import { canDelete, canManage } from "../../utils/permissions";
import ProductForm from "./ProductForm";

export function ProductList() {
    const { user } = useAuth();
    const { products, loading, error, setError, loadProducts, createProduct, updateProduct, removeProduct } = useProduct();
    const [categories, setCategories] = useState<Category[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [search, setSearch] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [editingProduct, setEditingProduct] = useState<ProductResponse | null>(null);
    const [showForm, setShowForm] = useState(false);

    const loadData = useCallback(async () => {
        setError(null);
        try {
            const [categoryData, supplierData] = await Promise.all([
                categoryService.list(),
                supplierService.list(),
            ]);
            await loadProducts();
            setCategories(categoryData);
            setSuppliers(supplierData);
        } catch (loadError) {
            setError(getApiErrorMessage(loadError, "Nao foi possivel carregar produtos."));
        }
    }, [loadProducts, setError]);

    useEffect(() => {
        void loadData().catch(() => undefined);
    }, [loadData]);

    const filteredProducts = useMemo(() => {
        const term = search.toLowerCase();
        return products.filter((product) =>
            [product.name, product.partNumber, product.barCode, product.categoryName, product.supplierName ?? ""].some((value) => value.toLowerCase().includes(term)),
        );
    }, [products, search]);

    async function handleSubmit(data: ProductRequest) {
        setSubmitting(true);
        setFormError(null);
        try {
            if (editingProduct) {
                await updateProduct(editingProduct.id, data);
            } else {
                await createProduct(data);
            }
            setShowForm(false);
            setEditingProduct(null);
            await loadData();
        } catch (submitError) {
            setFormError(getApiErrorMessage(submitError, "Nao foi possivel salvar o produto."));
        } finally {
            setSubmitting(false);
        }
    }

    async function handleRemove(product: ProductResponse) {
        if (!window.confirm(`Excluir produto ${product.name}?`)) {
            return;
        }
        try {
            await removeProduct(product.id);
            await loadData();
        } catch (removeError) {
            setError(getApiErrorMessage(removeError, "Nao foi possivel excluir o produto."));
        }
    }

    return (
        <section className="page-section">
            <PageHeader
                eyebrow="Catalogo"
                title="Produtos"
                description="Pecas, codigos e precos de venda."
                action={canManage(user?.role, ["admin", "gerente", "estoquista"]) && <button type="button" className="primary-button" onClick={() => setShowForm(true)}>Novo produto</button>}
            />
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar produto..." />
            {showForm && <ProductForm product={editingProduct} categories={categories} suppliers={suppliers} loading={submitting} error={formError} onCancel={() => { setShowForm(false); setEditingProduct(null); }} onSubmit={handleSubmit} />}
            {error && <div className="form-error">{error}</div>}
            {loading ? <LoadingState /> : filteredProducts.length === 0 ? <EmptyState /> : (
                <div className="table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Produto</th>
                                <th>Codigo</th>
                                <th>Categoria</th>
                                <th>Fornecedor</th>
                                <th>Preco</th>
                                <th>Status</th>
                                <th>Acoes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map((product) => (
                                <tr key={product.id}>
                                    <td>{product.name}</td>
                                    <td>{product.partNumber}</td>
                                    <td>{product.categoryName}</td>
                                    <td>{product.supplierName ?? "-"}</td>
                                    <td>{formatCurrency(product.salePrice)}</td>
                                    <td><StatusBadge active={product.status} /></td>
                                    <td className="table-actions">
                                        {canManage(user?.role, ["admin", "gerente", "estoquista"]) && (
                                            <button
                                                type="button"
                                                className="table-action-button table-action-button--edit"
                                                aria-label={`Editar produto ${product.name}`}
                                                title="Editar"
                                                onClick={() => { setEditingProduct(product); setShowForm(true); }}
                                            >
                                                <Pencil size={20} aria-hidden="true" />
                                            </button>
                                        )}
                                        {canDelete(user?.role) && (
                                            <button
                                                type="button"
                                                className="table-action-button table-action-button--delete"
                                                aria-label={`Excluir produto ${product.name}`}
                                                title="Excluir"
                                                onClick={() => void handleRemove(product)}
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
        </section>
    );
}

export default ProductList;
