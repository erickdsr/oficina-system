import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import { useAuth } from "../../context/auth.context";
import { getApiErrorMessage } from "../../services/api";
import clientService from "../../services/client.service";
import useSale from "../../hooks/useSale";
import paymentMethodService from "../../services/payment-method.service";
import productService from "../../services/product.service";
import type { Client } from "../../types/client.types";
import type { PaymentMethod } from "../../types/payment-method.types";
import type { ProductResponse } from "../../types/product.types";
import type { SaleItem, SalePayment, SaleRequest } from "../../types/sale.types";
import { formatCurrency } from "../../utils/formatters";

const initialItem: SaleItem = {
    productId: null,
    quantity: 1,
    unitPrice: 0,
    discount: 0,
    subtotal: 0,
};

const initialPayment: SalePayment = {
    paymentMethodId: 1,
    amount: 0,
};

export function SaleForm() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { createSale } = useSale();
    const [clients, setClients] = useState<Client[]>([]);
    const [products, setProducts] = useState<ProductResponse[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [clientId, setClientId] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [notes, setNotes] = useState("");
    const [items, setItems] = useState<SaleItem[]>([{ ...initialItem }]);
    const [payments, setPayments] = useState<SalePayment[]>([{ ...initialPayment }]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                const [clientData, productData, paymentMethodData] = await Promise.all([
                    clientService.list(),
                    productService.list(),
                    paymentMethodService.list(),
                ]);
                setClients(clientData);
                setProducts(productData);
                setPaymentMethods(paymentMethodData);
                setClientId(clientData[0]?.id ?? 0);
                setPayments([{ paymentMethodId: paymentMethodData[0]?.id ?? 1, amount: 0 }]);
            } catch (loadError) {
                setError(getApiErrorMessage(loadError, "Nao foi possivel carregar dados da venda."));
            }
        }

        void loadData();
    }, []);

    const totalItems = useMemo(() => items.reduce((sum, item) => sum + Math.max(item.quantity * item.unitPrice - item.discount, 0), 0), [items]);
    const total = Math.max(totalItems - discount, 0);
    const paid = payments.reduce((sum, payment) => sum + payment.amount, 0);

    function updateItem(index: number, patch: Partial<SaleItem>) {
        setItems((currentItems) =>
            currentItems.map((item, itemIndex) => {
                if (itemIndex !== index) {
                    return item;
                }
                const selectedProduct = patch.productId ? products.find((product) => product.id === patch.productId) : undefined;
                const updatedItem = {
                    ...item,
                    ...patch,
                    unitPrice: patch.unitPrice ?? selectedProduct?.salePrice ?? item.unitPrice,
                };
                return { ...updatedItem, subtotal: Math.max(updatedItem.quantity * updatedItem.unitPrice - updatedItem.discount, 0) };
            }),
        );
    }

    function updatePayment(index: number, patch: Partial<SalePayment>) {
        setPayments((currentPayments) => currentPayments.map((payment, paymentIndex) => paymentIndex === index ? { ...payment, ...patch } : payment));
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (clientId <= 0 || items.some((item) => !item.productId || item.quantity <= 0 || item.unitPrice <= 0)) {
            setError("Informe cliente e itens validos.");
            return;
        }
        if (payments.some((payment) => payment.amount <= 0) || paid + 0.01 < total) {
            setError("Informe pagamentos que cubram o total da venda.");
            return;
        }

        const payload: SaleRequest = {
            clientId,
            employeeId: user?.employeeId ?? 0,
            discount,
            notes: notes || null,
            items,
            payments,
        };

        setLoading(true);
        setError(null);
        try {
            const sale = await createSale(payload);
            navigate(`/sales/${sale.id}`);
        } catch (submitError) {
            setError(getApiErrorMessage(submitError, "Nao foi possivel criar a venda."));
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="page-section">
            <PageHeader eyebrow="Vendas" title="Nova venda" description="Venda com itens e formas de pagamento." />
            <form className="entity-form" onSubmit={handleSubmit} noValidate>
                <div className="form-grid">
                    <label className="form-field">
                        <span>Cliente</span>
                        <select value={clientId} onChange={(event) => setClientId(Number(event.target.value))}>
                            <option value={0}>Selecione</option>
                            {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                        </select>
                    </label>
                    <label className="form-field">
                        <span>Desconto geral</span>
                        <input type="number" min="0" step="0.01" value={discount} onChange={(event) => setDiscount(Number(event.target.value))} />
                    </label>
                    <label className="form-field span-2">
                        <span>Observacoes</span>
                        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
                    </label>
                </div>
                <div className="items-panel">
                    <div className="items-panel__header"><h3>Itens</h3><button type="button" className="secondary-button" onClick={() => setItems([...items, { ...initialItem }])}>Adicionar item</button></div>
                    {items.map((item, index) => (
                        <div className="item-row" key={index}>
                            <label className="form-field"><span>Produto</span><select value={item.productId ?? ""} onChange={(event) => updateItem(index, { productId: event.target.value ? Number(event.target.value) : null })}><option value="">Selecione</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
                            <label className="form-field"><span>Qtd.</span><input type="number" min="1" value={item.quantity} onChange={(event) => updateItem(index, { quantity: Number(event.target.value) })} /></label>
                            <label className="form-field"><span>Preco</span><input type="number" min="0" step="0.01" value={item.unitPrice} onChange={(event) => updateItem(index, { unitPrice: Number(event.target.value) })} /></label>
                            <label className="form-field"><span>Desc.</span><input type="number" min="0" step="0.01" value={item.discount} onChange={(event) => updateItem(index, { discount: Number(event.target.value) })} /></label>
                            <strong>{formatCurrency(item.subtotal)}</strong>
                            <button type="button" className="danger-button" onClick={() => setItems(items.filter((_, itemIndex) => itemIndex !== index))} disabled={items.length === 1}>Remover</button>
                        </div>
                    ))}
                </div>
                <div className="items-panel">
                    <div className="items-panel__header"><h3>Pagamentos</h3><button type="button" className="secondary-button" onClick={() => setPayments([...payments, { paymentMethodId: paymentMethods[0]?.id ?? initialPayment.paymentMethodId, amount: 0 }])}>Adicionar pagamento</button></div>
                    {payments.map((payment, index) => (
                        <div className="payment-row" key={index}>
                            <label className="form-field"><span>Metodo</span><select value={payment.paymentMethodId} onChange={(event) => updatePayment(index, { paymentMethodId: Number(event.target.value) })}>{paymentMethods.map((method) => <option key={method.id} value={method.id}>{method.name}</option>)}</select></label>
                            <label className="form-field"><span>Valor</span><input type="number" min="0" step="0.01" value={payment.amount} onChange={(event) => updatePayment(index, { amount: Number(event.target.value) })} /></label>
                            <button type="button" className="danger-button" onClick={() => setPayments(payments.filter((_, paymentIndex) => paymentIndex !== index))} disabled={payments.length === 1}>Remover</button>
                        </div>
                    ))}
                </div>
                <div className="total-row">Total: <strong>{formatCurrency(total)}</strong> Pago: <strong>{formatCurrency(paid)}</strong></div>
                {error && <div className="form-error">{error}</div>}
                <div className="form-actions">
                    <button type="button" className="secondary-button" onClick={() => navigate("/sales")}>Cancelar</button>
                    <button type="submit" className="primary-button" disabled={loading}>{loading ? "Salvando..." : "Salvar venda"}</button>
                </div>
            </form>
        </section>
    );
}

export default SaleForm;
