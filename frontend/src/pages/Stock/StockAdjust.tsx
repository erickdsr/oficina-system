import { useEffect, useState, type FormEvent } from "react";
import type { ProductResponse } from "../../types/product.types";
import type { StockRequest, StockResponse } from "../../types/stock.types";

interface StockAdjustProps {
    stock?: StockResponse | null;
    products: ProductResponse[];
    loading?: boolean;
    error?: string | null;
    onCancel: () => void;
    onSubmit: (stock: StockRequest, stockId?: number) => Promise<void>;
}

const initialForm: StockRequest = {
    productId: 0,
    quantity: 0,
    minQuantity: 0,
    location: "",
};

export function StockAdjust({ stock, products, loading = false, error, onCancel, onSubmit }: StockAdjustProps) {
    const [form, setForm] = useState<StockRequest>(initialForm);
    const [validationError, setValidationError] = useState<string | null>(null);

    useEffect(() => {
        setForm(
            stock
                ? {
                      productId: stock.productId ?? 0,
                      quantity: stock.quantity,
                      minQuantity: stock.minQuantity,
                      location: stock.location,
                  }
                : { ...initialForm, productId: products[0]?.id ?? 0 },
        );
        setValidationError(null);
    }, [products, stock]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (form.productId <= 0) {
            setValidationError("Selecione um produto.");
            return;
        }
        setValidationError(null);
        await onSubmit(form, stock?.id);
    }

    return (
        <form className="entity-form" onSubmit={handleSubmit} noValidate>
            <h3>{stock ? "Ajustar estoque" : "Criar estoque"}</h3>
            <div className="form-grid">
                <label className="form-field">
                    <span>Produto</span>
                    <select value={form.productId} onChange={(event) => setForm({ ...form, productId: Number(event.target.value) })}>
                        <option value={0}>Selecione</option>
                        {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                    </select>
                </label>
                <label className="form-field">
                    <span>Quantidade</span>
                    <input type="number" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: Number(event.target.value) })} />
                </label>
                <label className="form-field">
                    <span>Quantidade minima</span>
                    <input type="number" min="0" value={form.minQuantity} onChange={(event) => setForm({ ...form, minQuantity: Number(event.target.value) })} />
                </label>
                <label className="form-field">
                    <span>Localizacao</span>
                    <input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
                </label>
            </div>
            {(validationError || error) && <div className="form-error">{validationError ?? error}</div>}
            <div className="form-actions">
                <button type="button" className="secondary-button" onClick={onCancel}>Cancelar</button>
                <button type="submit" className="primary-button" disabled={loading}>{loading ? "Salvando..." : "Salvar ajuste"}</button>
            </div>
        </form>
    );
}

export default StockAdjust;
