import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import { useAuth } from "../../context/auth.context";
import { getApiErrorMessage } from "../../services/api";
import usePurchase from "../../hooks/usePurchase";
import productService from "../../services/product.service";
import supplierService from "../../services/supplier.service";
import type { ProductResponse } from "../../types/product.types";
import type { PurchaseItem, PurchaseRequest } from "../../types/purchase.types";
import type { Supplier } from "../../types/supplier.types";
import { formatCurrency } from "../../utils/formatters";

const initialItem: PurchaseItem = {
    productId: null,
    quantity: 1,
    unitCost: 0,
    subtotal: 0,
};

export function PurchaseForm() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { createPurchase } = usePurchase();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<ProductResponse[]>([]);
    const [supplierId, setSupplierId] = useState(0);
    const [notes, setNotes] = useState("");
    const [items, setItems] = useState<PurchaseItem[]>([{ ...initialItem }]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                const [supplierData, productData] = await Promise.all([supplierService.list(), productService.list()]);
                setSuppliers(supplierData);
                setProducts(productData);
                setSupplierId(supplierData[0]?.id ?? 0);
            } catch (loadError) {
                setError(getApiErrorMessage(loadError, "Nao foi possivel carregar dados da compra."));
            }
        }

        void loadData();
    }, []);

    const total = useMemo(() => items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0), [items]);

    function updateItem(index: number, patch: Partial<PurchaseItem>) {
        setItems((currentItems) =>
            currentItems.map((item, itemIndex) => {
                if (itemIndex !== index) {
                    return item;
                }
                const updatedItem = { ...item, ...patch };
                return { ...updatedItem, subtotal: updatedItem.quantity * updatedItem.unitCost };
            }),
        );
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (supplierId <= 0 || items.some((item) => !item.productId || item.quantity <= 0 || item.unitCost <= 0)) {
            setError("Informe fornecedor e itens validos.");
            return;
        }

        const payload: PurchaseRequest = {
            supplierId,
            employeeId: user?.employeeId ?? 0,
            notes: notes || null,
            items,
        };

        setLoading(true);
        setError(null);
        try {
            const purchase = await createPurchase(payload);
            navigate(`/purchases/${purchase.id}`);
        } catch (submitError) {
            setError(getApiErrorMessage(submitError, "Nao foi possivel criar a compra."));
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="page-section">
            <PageHeader eyebrow="Compras" title="Nova compra" description="Registre uma compra com multiplos produtos." />
            <form className="entity-form" onSubmit={handleSubmit} noValidate>
                <div className="form-grid">
                    <label className="form-field">
                        <span>Fornecedor</span>
                        <select value={supplierId} onChange={(event) => setSupplierId(Number(event.target.value))}>
                            <option value={0}>Selecione</option>
                            {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
                        </select>
                    </label>
                    <label className="form-field span-2">
                        <span>Observacoes</span>
                        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
                    </label>
                </div>
                <div className="items-panel">
                    <div className="items-panel__header">
                        <h3>Itens</h3>
                        <button type="button" className="secondary-button" onClick={() => setItems([...items, { ...initialItem }])}>Adicionar item</button>
                    </div>
                    {items.map((item, index) => (
                        <div className="item-row" key={index}>
                            <label className="form-field">
                                <span>Produto</span>
                                <select value={item.productId ?? ""} onChange={(event) => updateItem(index, { productId: event.target.value ? Number(event.target.value) : null })}>
                                    <option value="">Selecione</option>
                                    {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                                </select>
                            </label>
                            <label className="form-field">
                                <span>Qtd.</span>
                                <input type="number" min="1" value={item.quantity} onChange={(event) => updateItem(index, { quantity: Number(event.target.value) })} />
                            </label>
                            <label className="form-field">
                                <span>Custo</span>
                                <input type="number" min="0" step="0.01" value={item.unitCost} onChange={(event) => updateItem(index, { unitCost: Number(event.target.value) })} />
                            </label>
                            <strong>{formatCurrency(item.quantity * item.unitCost)}</strong>
                            <button type="button" className="danger-button" onClick={() => setItems(items.filter((_, itemIndex) => itemIndex !== index))} disabled={items.length === 1}>Remover</button>
                        </div>
                    ))}
                    <div className="total-row">Total: <strong>{formatCurrency(total)}</strong></div>
                </div>
                {error && <div className="form-error">{error}</div>}
                <div className="form-actions">
                    <button type="button" className="secondary-button" onClick={() => navigate("/purchases")}>Cancelar</button>
                    <button type="submit" className="primary-button" disabled={loading}>{loading ? "Salvando..." : "Salvar compra"}</button>
                </div>
            </form>
        </section>
    );
}

export default PurchaseForm;
