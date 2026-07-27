import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Category } from "../../types/category.types";
import type { ProductRequest, ProductResponse, Unit } from "../../types/product.types";
import type { StockResponse } from "../../types/stock.types";
import type { Supplier } from "../../types/supplier.types";

export interface ProductFormPayload extends ProductRequest {
    margin: number;
    quantity: number;
    minQuantity: number;
    location: string;
    brand: string;
}

interface ProductFormProps {
    product?: ProductResponse | null;
    stock?: StockResponse | null;
    categories: Category[];
    suppliers: Supplier[];
    loading?: boolean;
    error?: string | null;
    onCancel: () => void;
    onSubmit: (product: ProductFormPayload) => Promise<void>;
}

const initialForm: ProductFormPayload = {
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
    margin: 0,
    quantity: 0,
    minQuantity: 0,
    location: "",
    brand: "",
};

function calculateMargin(costPrice: number, salePrice: number) {
    if (costPrice <= 0) {
        return 0;
    }

    return Number((((salePrice - costPrice) / costPrice) * 100).toFixed(2));
}

function calculateSalePrice(costPrice: number, margin: number) {
    return Number((costPrice + costPrice * (margin / 100)).toFixed(2));
}

function generatedCode(product?: ProductResponse | null) {
    return product?.id ? `PROD-${String(product.id).padStart(6, "0")}` : "Gerado automaticamente";
}

export function ProductForm({ product, stock, categories, suppliers, loading = false, error, onCancel, onSubmit }: ProductFormProps) {
    const [form, setForm] = useState<ProductFormPayload>(initialForm);
    const [validationError, setValidationError] = useState<string | null>(null);

    useEffect(() => {
        if (product) {
            setForm({
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
                margin: calculateMargin(product.costPrice, product.salePrice),
                quantity: stock?.quantity ?? 0,
                minQuantity: stock?.minQuantity ?? 0,
                location: stock?.location ?? "",
                brand: product.name.trim().split(/\s+/)[0] ?? "",
            });
        } else {
            setForm({
                ...initialForm,
                categoryId: categories[0]?.id ?? 0,
                supplierId: suppliers[0]?.id ?? null,
            });
        }
        setValidationError(null);
    }, [categories, product, stock, suppliers]);

    const grossProfit = useMemo(() => Math.max(0, form.salePrice - form.costPrice), [form.costPrice, form.salePrice]);

    function updateField<K extends keyof ProductFormPayload>(field: K, value: ProductFormPayload[K]) {
        setForm((current) => ({ ...current, [field]: value }));
    }

    function updateCost(value: number) {
        setForm((current) => ({
            ...current,
            costPrice: value,
            salePrice: current.margin > 0 ? calculateSalePrice(value, current.margin) : current.salePrice,
        }));
    }

    function updateMargin(value: number) {
        setForm((current) => ({
            ...current,
            margin: value,
            salePrice: calculateSalePrice(current.costPrice, value),
        }));
    }

    function updateSalePrice(value: number) {
        setForm((current) => ({
            ...current,
            salePrice: value,
            margin: calculateMargin(current.costPrice, value),
        }));
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!form.name.trim() || !form.partNumber.trim() || form.categoryId <= 0) {
            setValidationError("Informe nome, numero da peca e categoria.");
            return;
        }

        if (form.salePrice <= 0) {
            setValidationError("Informe um preco de venda valido.");
            return;
        }

        setValidationError(null);
        await onSubmit({
            ...form,
            name: form.name.trim(),
            description: form.description.trim(),
            partNumber: form.partNumber.trim(),
            barCode: form.barCode.trim(),
            location: form.location.trim(),
        });
    }

    return (
        <form className="entity-form product-form" onSubmit={handleSubmit} noValidate>
            <div className="entity-form__header product-form__header">
                <div>
                    <h3>{product?.id ? "Editar produto" : "Novo produto"}</h3>
                    <p>Identificacao, precificacao e parametros de estoque do catalogo.</p>
                </div>
                <span>{generatedCode(product)}</span>
            </div>

            <section className="product-form-section">
                <h4>Identificacao</h4>
                <div className="form-grid">
                    <label className="form-field">
                        <span>Codigo interno</span>
                        <input value={generatedCode(product)} disabled />
                    </label>
                    <label className="form-field">
                        <span>Numero da peca</span>
                        <input value={form.partNumber} onChange={(event) => updateField("partNumber", event.target.value)} />
                    </label>
                    <label className="form-field">
                        <span>Codigo de barras (EAN)</span>
                        <input inputMode="numeric" value={form.barCode} onChange={(event) => updateField("barCode", event.target.value)} />
                    </label>
                    <label className="form-field">
                        <span>Marca</span>
                        <input value={form.brand} onChange={(event) => updateField("brand", event.target.value)} />
                    </label>
                    <label className="form-field span-2">
                        <span>Nome</span>
                        <input value={form.name} onChange={(event) => updateField("name", event.target.value)} />
                    </label>
                    <label className="form-field">
                        <span>Categoria</span>
                        <select value={form.categoryId} onChange={(event) => updateField("categoryId", Number(event.target.value))}>
                            <option value={0}>Selecione</option>
                            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                        </select>
                    </label>
                    <label className="form-field">
                        <span>Fornecedor</span>
                        <select value={form.supplierId ?? ""} onChange={(event) => updateField("supplierId", event.target.value ? Number(event.target.value) : null)}>
                            <option value="">Sem fornecedor</option>
                            {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.tradeName || supplier.name}</option>)}
                        </select>
                    </label>
                    <label className="form-field span-2">
                        <span>Descricao</span>
                        <textarea value={form.description} onChange={(event) => updateField("description", event.target.value)} />
                    </label>
                </div>
            </section>

            <section className="product-form-section">
                <h4>Comercial</h4>
                <div className="form-grid product-commercial-grid">
                    <label className="form-field">
                        <span>Unidade</span>
                        <select value={form.unit} onChange={(event) => updateField("unit", event.target.value as Unit)}>
                            <option value="UN">UN</option>
                            <option value="CX">CX</option>
                            <option value="KT">KIT</option>
                        </select>
                    </label>
                    <label className="form-field">
                        <span>Preco de custo</span>
                        <input type="number" min="0" step="0.01" value={form.costPrice} onChange={(event) => updateCost(Number(event.target.value))} />
                    </label>
                    <label className="form-field">
                        <span>Margem (%)</span>
                        <input type="number" min="0" step="0.01" value={form.margin} onChange={(event) => updateMargin(Number(event.target.value))} />
                    </label>
                    <label className="form-field">
                        <span>Preco de venda</span>
                        <input type="number" min="0" step="0.01" value={form.salePrice} onChange={(event) => updateSalePrice(Number(event.target.value))} />
                    </label>
                    <div className="product-margin-preview">
                        <span>Lucro bruto unitario</span>
                        <strong>{grossProfit.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
                    </div>
                </div>
            </section>

            <section className="product-form-section">
                <h4>Estoque</h4>
                <div className="form-grid">
                    <label className="form-field">
                        <span>Quantidade inicial</span>
                        <input type="number" min="0" step="1" value={form.quantity} onChange={(event) => updateField("quantity", Number(event.target.value))} />
                    </label>
                    <label className="form-field">
                        <span>Estoque minimo</span>
                        <input type="number" min="0" step="1" value={form.minQuantity} onChange={(event) => updateField("minQuantity", Number(event.target.value))} />
                    </label>
                    <label className="form-field">
                        <span>Localizacao</span>
                        <input value={form.location} onChange={(event) => updateField("location", event.target.value)} />
                    </label>
                    <label className="form-field">
                        <span>Rua</span>
                        <input value="" disabled />
                    </label>
                    <label className="form-field">
                        <span>Corredor</span>
                        <input value="" disabled />
                    </label>
                    <label className="form-field">
                        <span>Prateleira</span>
                        <input value="" disabled />
                    </label>
                    <label className="form-field span-2">
                        <span>Observacoes</span>
                        <textarea value="" disabled />
                    </label>
                    <label className="checkbox-field supplier-status-field">
                        <input type="checkbox" checked={form.status} onChange={(event) => updateField("status", event.target.checked)} />
                        Ativo
                    </label>
                </div>
            </section>

            {(validationError || error) && <div className="form-error">{validationError ?? error}</div>}
            <div className="form-actions">
                <button type="button" className="secondary-button" onClick={onCancel} disabled={loading}>Cancelar</button>
                <button type="submit" className="primary-button" disabled={loading}>{loading ? "Salvando..." : "Salvar produto"}</button>
            </div>
        </form>
    );
}

export default ProductForm;
