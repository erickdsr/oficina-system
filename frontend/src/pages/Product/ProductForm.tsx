import { useEffect, useState, type FormEvent } from "react";
import type { Category } from "../../types/category.types";
import type { ProductRequest, ProductResponse, Unit } from "../../types/product.types";
import type { Supplier } from "../../types/supplier.types";

interface ProductFormProps {
    product?: ProductResponse | null;
    categories: Category[];
    suppliers: Supplier[];
    loading?: boolean;
    error?: string | null;
    onCancel: () => void;
    onSubmit: (product: ProductRequest) => Promise<void>;
}

const initialForm: ProductRequest = {
    name: "",
    description: "",
    partNumber: "",
    barCode: "",
    categoryId: 0,
    supplierId: null,
    costPrice: 0,
    salePrice: 0,
    unit: "UN",
    status: true,
};

export function ProductForm({ product, categories, suppliers, loading = false, error, onCancel, onSubmit }: ProductFormProps) {
    const [form, setForm] = useState<ProductRequest>(initialForm);
    const [validationError, setValidationError] = useState<string | null>(null);

    useEffect(() => {
        setForm(
            product
                ? {
                      name: product.name,
                      description: product.description,
                      partNumber: product.partNumber,
                      barCode: product.barCode,
                      categoryId: product.categoryId,
                      supplierId: product.supplierId,
                      costPrice: product.costPrice,
                      salePrice: product.salePrice,
                      unit: product.unit,
                      status: product.status,
                  }
                : { ...initialForm, categoryId: categories[0]?.id ?? 0, supplierId: suppliers[0]?.id ?? null },
        );
        setValidationError(null);
    }, [categories, product, suppliers]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!form.name.trim() || !form.partNumber.trim() || form.categoryId <= 0) {
            setValidationError("Informe nome, codigo da peca e categoria.");
            return;
        }
        if (form.salePrice <= 0) {
            setValidationError("Informe um preco de venda valido.");
            return;
        }
        setValidationError(null);
        await onSubmit(form);
    }

    return (
        <form className="entity-form" onSubmit={handleSubmit} noValidate>
            <h3>{product ? "Editar produto" : "Novo produto"}</h3>
            <div className="form-grid">
                <label className="form-field">
                    <span>Nome</span>
                    <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                </label>
                <label className="form-field">
                    <span>Codigo da peca</span>
                    <input value={form.partNumber} onChange={(event) => setForm({ ...form, partNumber: event.target.value })} />
                </label>
                <label className="form-field">
                    <span>Codigo de barras</span>
                    <input value={form.barCode} onChange={(event) => setForm({ ...form, barCode: event.target.value })} />
                </label>
                <label className="form-field">
                    <span>Unidade</span>
                    <select value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value as Unit })}>
                        <option value="UN">Unidade</option>
                        <option value="CX">Caixa</option>
                        <option value="KT">Kit</option>
                    </select>
                </label>
                <label className="form-field">
                    <span>Categoria</span>
                    <select value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: Number(event.target.value) })}>
                        <option value={0}>Selecione</option>
                        {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                    </select>
                </label>
                <label className="form-field">
                    <span>Fornecedor</span>
                    <select value={form.supplierId ?? ""} onChange={(event) => setForm({ ...form, supplierId: event.target.value ? Number(event.target.value) : null })}>
                        <option value="">Sem fornecedor</option>
                        {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
                    </select>
                </label>
                <label className="form-field">
                    <span>Custo</span>
                    <input type="number" min="0" step="0.01" value={form.costPrice} onChange={(event) => setForm({ ...form, costPrice: Number(event.target.value) })} />
                </label>
                <label className="form-field">
                    <span>Venda</span>
                    <input type="number" min="0" step="0.01" value={form.salePrice} onChange={(event) => setForm({ ...form, salePrice: Number(event.target.value) })} />
                </label>
                <label className="form-field span-2">
                    <span>Descricao</span>
                    <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
                </label>
                <label className="checkbox-field">
                    <input type="checkbox" checked={form.status} onChange={(event) => setForm({ ...form, status: event.target.checked })} />
                    Ativo
                </label>
            </div>
            {(validationError || error) && <div className="form-error">{validationError ?? error}</div>}
            <div className="form-actions">
                <button type="button" className="secondary-button" onClick={onCancel}>Cancelar</button>
                <button type="submit" className="primary-button" disabled={loading}>{loading ? "Salvando..." : "Salvar"}</button>
            </div>
        </form>
    );
}

export default ProductForm;
