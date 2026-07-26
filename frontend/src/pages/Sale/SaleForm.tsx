import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { MoneyInput, NumericInput } from "../../components/common/NumericInput";
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
import {
    clampMoney,
    normalizeMoney,
    normalizeMoneyString,
    normalizeQuantity,
    normalizeQuantityString,
    parseNumericInput,
    toMoneyInputValue,
    type NumericInputValue,
} from "../../utils/numeric-values";

interface SaleItemForm {
    productId: number | null;
    quantity: NumericInputValue;
    unitPrice: NumericInputValue;
    discount: NumericInputValue;
}

interface SalePaymentForm {
    paymentMethodId: number;
    amount: NumericInputValue;
}

interface FormErrors {
    clientId?: string;
    discount?: string;
    items?: Record<number, Partial<Record<"productId" | "quantity" | "unitPrice" | "discount", string>>>;
    payments?: Record<number, Partial<Record<"paymentMethodId" | "amount", string>>>;
}

const initialItem: SaleItemForm = {
    productId: null,
    quantity: "1",
    unitPrice: "0",
    discount: "0",
};

const initialPayment: SalePaymentForm = {
    paymentMethodId: 0,
    amount: "",
};

export function SaleForm() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { createSale } = useSale();
    const [clients, setClients] = useState<Client[]>([]);
    const [products, setProducts] = useState<ProductResponse[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [clientId, setClientId] = useState(0);
    const [discount, setDiscount] = useState<NumericInputValue>("0");
    const [notes, setNotes] = useState("");
    const [items, setItems] = useState<SaleItemForm[]>([{ ...initialItem }]);
    const [payments, setPayments] = useState<SalePaymentForm[]>([{ ...initialPayment }]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<FormErrors>({});

    useEffect(() => {
        async function loadData() {
            const errors: string[] = [];
            try {
                const clientData = await clientService.list();
                setClients(clientData);
                setClientId(clientData[0]?.id ?? 0);
            } catch (loadError) {
                errors.push(getApiErrorMessage(loadError, "Nao foi possivel carregar clientes."));
            }

            try {
                const productData = await productService.list();
                setProducts(productData);
            } catch (loadError) {
                errors.push(getApiErrorMessage(loadError, "Nao foi possivel carregar produtos."));
            }

            try {
                const paymentMethodData = await paymentMethodService.list();
                setPaymentMethods(paymentMethodData);
                setPayments([{ paymentMethodId: paymentMethodData[0]?.id ?? initialPayment.paymentMethodId, amount: "" }]);
            } catch (loadError) {
                errors.push(getApiErrorMessage(loadError, "Nao foi possivel carregar formas de pagamento."));
            }

            if (errors.length > 0) {
                setError(errors.join(" "));
            }
        }

        void loadData();
    }, []);

    const normalizedItems = useMemo(() => items.map(normalizeItem), [items]);
    const totalItems = useMemo(
        () => normalizedItems.reduce((sum, item) => sum + item.subtotal, 0),
        [normalizedItems],
    );
    const normalizedDiscount = clampMoney(discount, totalItems);
    const total = Math.max(0, totalItems - normalizedDiscount);
    const paid = payments.reduce((sum, payment) => sum + normalizeMoney(payment.amount), 0);
    const remaining = Math.max(0, total - paid);
    const change = Math.max(0, paid - total);

    function normalizeItem(item: SaleItemForm): SaleItem {
        const quantity = normalizeQuantity(item.quantity);
        const unitPrice = normalizeMoney(item.unitPrice);
        const rawDiscount = normalizeMoney(item.discount);
        const subtotalBeforeDiscount = quantity * unitPrice;
        const itemDiscount = Math.min(rawDiscount, subtotalBeforeDiscount);

        return {
            productId: item.productId,
            quantity,
            unitPrice,
            discount: itemDiscount,
            subtotal: Math.max(0, subtotalBeforeDiscount - itemDiscount),
        };
    }

    function normalizePayment(payment: SalePaymentForm): SalePayment {
        return {
            paymentMethodId: payment.paymentMethodId,
            amount: normalizeMoney(payment.amount),
        };
    }

    function updateItem(index: number, patch: Partial<SaleItemForm>) {
        setItems((currentItems) =>
            currentItems.map((item, itemIndex) => {
                if (itemIndex !== index) {
                    return item;
                }

                const selectedProduct = patch.productId
                    ? products.find((product) => product.id === patch.productId)
                    : undefined;

                return {
                    ...item,
                    ...patch,
                    unitPrice: patch.unitPrice ?? (selectedProduct ? toMoneyInputValue(selectedProduct.salePrice) : item.unitPrice),
                };
            }),
        );
    }

    function updatePayment(index: number, patch: Partial<SalePaymentForm>) {
        setPayments((currentPayments) =>
            currentPayments.map((payment, paymentIndex) => (paymentIndex === index ? { ...payment, ...patch } : payment)),
        );
    }

    function validateForm() {
        const nextErrors: FormErrors = {};
        const itemErrors: FormErrors["items"] = {};
        const paymentErrors: FormErrors["payments"] = {};

        if (clientId <= 0) {
            nextErrors.clientId = "Selecione um cliente.";
        }

        if (!Number.isFinite(parseNumericInput(discount)) || normalizeMoney(discount) > totalItems) {
            nextErrors.discount = "O desconto geral nao pode exceder o total dos itens.";
        }

        normalizedItems.forEach((item, index) => {
            const subtotalBeforeDiscount = item.quantity * item.unitPrice;
            const errors: Partial<Record<"productId" | "quantity" | "unitPrice" | "discount", string>> = {};
            if (!item.productId) {
                errors.productId = "Selecione um produto.";
            }
            if (!Number.isInteger(item.quantity) || item.quantity < 1) {
                errors.quantity = "Informe uma quantidade inteira maior ou igual a 1.";
            }
            if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) {
                errors.unitPrice = "Informe um preco valido.";
            }
            if (normalizeMoney(items[index].discount) > subtotalBeforeDiscount) {
                errors.discount = "O desconto nao pode exceder o subtotal.";
            }
            if (Object.keys(errors).length > 0) {
                itemErrors[index] = errors;
            }
        });

        if (paymentMethods.length === 0) {
            nextErrors.payments = { 0: { paymentMethodId: "Cadastre ou carregue uma forma de pagamento." } };
        }

        payments.map(normalizePayment).forEach((payment, index) => {
            const errors: Partial<Record<"paymentMethodId" | "amount", string>> = {};
            if (payment.paymentMethodId <= 0) {
                errors.paymentMethodId = "Selecione uma forma de pagamento.";
            }
            if (!Number.isFinite(payment.amount) || payment.amount <= 0) {
                errors.amount = "Informe um valor de pagamento maior que zero.";
            }
            if (Object.keys(errors).length > 0) {
                paymentErrors[index] = errors;
            }
        });

        if (paid + 0.01 < total) {
            paymentErrors[0] = {
                ...paymentErrors[0],
                amount: `Pagamentos insuficientes. Falta ${formatCurrency(remaining)}.`,
            };
        }

        if (Object.keys(itemErrors).length > 0) {
            nextErrors.items = itemErrors;
        }
        if (Object.keys(paymentErrors).length > 0) {
            nextErrors.payments = paymentErrors;
        }

        setFieldErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        if (!validateForm()) {
            setError("Revise os campos destacados antes de finalizar a venda.");
            return;
        }

        const payload: SaleRequest = {
            clientId,
            employeeId: user?.employeeId ?? 0,
            discount: normalizedDiscount,
            notes: notes || null,
            items: normalizedItems,
            payments: payments.map(normalizePayment),
        };

        setLoading(true);
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
                        {fieldErrors.clientId && <small>{fieldErrors.clientId}</small>}
                    </label>
                    <label className="form-field">
                        <span>Desconto geral</span>
                        <MoneyInput
                            value={discount}
                            onChange={setDiscount}
                            onBlur={() => setDiscount(String(clampMoney(discount, totalItems)))}
                            aria-invalid={Boolean(fieldErrors.discount)}
                        />
                        {fieldErrors.discount && <small>{fieldErrors.discount}</small>}
                    </label>
                    <label className="form-field span-2">
                        <span>Observacoes</span>
                        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
                    </label>
                </div>
                <div className="items-panel">
                    <div className="items-panel__header">
                        <h3>Itens</h3>
                        <button type="button" className="secondary-button" onClick={() => setItems([...items, { ...initialItem }])}>
                            Adicionar item
                        </button>
                    </div>
                    {items.map((item, index) => {
                        const itemError = fieldErrors.items?.[index];
                        const itemSubtotal = normalizedItems[index]?.subtotal ?? 0;
                        const itemGross = normalizeQuantity(item.quantity) * normalizeMoney(item.unitPrice);

                        return (
                            <div className="item-row" key={index}>
                                <label className="form-field">
                                    <span>Produto</span>
                                    <select
                                        value={item.productId ?? ""}
                                        onChange={(event) => updateItem(index, { productId: event.target.value ? Number(event.target.value) : null })}
                                        aria-invalid={Boolean(itemError?.productId)}
                                    >
                                        <option value="">Selecione</option>
                                        {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                                    </select>
                                    {itemError?.productId && <small>{itemError.productId}</small>}
                                </label>
                                <label className="form-field">
                                    <span>Qtd.</span>
                                    <NumericInput
                                        min="1"
                                        step="1"
                                        value={item.quantity}
                                        onChange={(value) => updateItem(index, { quantity: value })}
                                        onBlur={() => updateItem(index, { quantity: normalizeQuantityString(item.quantity) })}
                                        aria-invalid={Boolean(itemError?.quantity)}
                                    />
                                    {itemError?.quantity && <small>{itemError.quantity}</small>}
                                </label>
                                <label className="form-field">
                                    <span>Preco</span>
                                    <MoneyInput
                                        value={item.unitPrice}
                                        onChange={(value) => updateItem(index, { unitPrice: value })}
                                        onBlur={() => updateItem(index, { unitPrice: normalizeMoneyString(item.unitPrice) })}
                                        aria-invalid={Boolean(itemError?.unitPrice)}
                                    />
                                    {itemError?.unitPrice && <small>{itemError.unitPrice}</small>}
                                </label>
                                <label className="form-field">
                                    <span>Desc.</span>
                                    <MoneyInput
                                        value={item.discount}
                                        onChange={(value) => updateItem(index, { discount: value })}
                                        onBlur={() => updateItem(index, { discount: String(clampMoney(item.discount, itemGross)) })}
                                        aria-invalid={Boolean(itemError?.discount)}
                                    />
                                    {itemError?.discount && <small>{itemError.discount}</small>}
                                </label>
                                <strong>{formatCurrency(itemSubtotal)}</strong>
                                <button
                                    type="button"
                                    className="danger-button"
                                    onClick={() => setItems(items.filter((_, itemIndex) => itemIndex !== index))}
                                    disabled={items.length === 1}
                                >
                                    Remover
                                </button>
                            </div>
                        );
                    })}
                </div>
                <div className="items-panel">
                    <div className="items-panel__header">
                        <h3>Pagamentos</h3>
                        <button
                            type="button"
                            className="secondary-button"
                            onClick={() => setPayments([...payments, { paymentMethodId: paymentMethods[0]?.id ?? initialPayment.paymentMethodId, amount: "" }])}
                            disabled={paymentMethods.length === 0}
                        >
                            Adicionar pagamento
                        </button>
                    </div>
                    {payments.map((payment, index) => {
                        const paymentError = fieldErrors.payments?.[index];

                        return (
                            <div className="payment-row" key={index}>
                                <label className="form-field">
                                    <span>Metodo</span>
                                    <select
                                        value={payment.paymentMethodId}
                                        onChange={(event) => updatePayment(index, { paymentMethodId: Number(event.target.value) })}
                                        aria-invalid={Boolean(paymentError?.paymentMethodId)}
                                    >
                                        <option value={0}>{paymentMethods.length === 0 ? "Nenhuma forma carregada" : "Selecione"}</option>
                                        {paymentMethods.map((method) => <option key={method.id} value={method.id}>{method.name}</option>)}
                                    </select>
                                    {paymentError?.paymentMethodId && <small>{paymentError.paymentMethodId}</small>}
                                </label>
                                <label className="form-field">
                                    <span>Valor</span>
                                    <MoneyInput
                                        value={payment.amount}
                                        onChange={(value) => updatePayment(index, { amount: value })}
                                        onBlur={() => updatePayment(index, { amount: normalizeMoneyString(payment.amount) })}
                                        aria-invalid={Boolean(paymentError?.amount)}
                                    />
                                    {paymentError?.amount && <small>{paymentError.amount}</small>}
                                </label>
                                <button
                                    type="button"
                                    className="danger-button"
                                    onClick={() => setPayments(payments.filter((_, paymentIndex) => paymentIndex !== index))}
                                    disabled={payments.length === 1}
                                >
                                    Remover
                                </button>
                            </div>
                        );
                    })}
                </div>
                <div className="total-row">
                    Total: <strong>{formatCurrency(total)}</strong>
                    Pago: <strong>{formatCurrency(paid)}</strong>
                    Restante: <strong>{formatCurrency(remaining)}</strong>
                    Troco: <strong>{formatCurrency(change)}</strong>
                </div>
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
