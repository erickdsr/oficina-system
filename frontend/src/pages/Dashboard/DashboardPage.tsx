import { useEffect, useMemo, useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import EmptyState from "../../components/common/EmptyState";
import LoadingState from "../../components/common/LoadingState";
import PageHeader from "../../components/common/PageHeader";
import StatusBadge from "../../components/common/StatusBadge";
import { getApiErrorMessage } from "../../services/api";
import productService from "../../services/product.service";
import saleService from "../../services/sale.service";
import stockService from "../../services/stock.service";
import type { ProductResponse } from "../../types/product.types";
import type { SaleResponse } from "../../types/sale.types";
import type { StockResponse } from "../../types/stock.types";
import { formatCurrency, formatDateTime } from "../../utils/formatters";

interface DailySaleChartData {
    day: string;
    total: number;
}

interface ProductChartData {
    product: string;
    quantity: number;
}

function isSameDay(date: Date, reference: Date) {
    return date.getFullYear() === reference.getFullYear() && date.getMonth() === reference.getMonth() && date.getDate() === reference.getDate();
}

function isSameMonth(date: Date, reference: Date) {
    return date.getFullYear() === reference.getFullYear() && date.getMonth() === reference.getMonth();
}

export function DashboardPage() {
    const [sales, setSales] = useState<SaleResponse[]>([]);
    const [lowStock, setLowStock] = useState<StockResponse[]>([]);
    const [products, setProducts] = useState<ProductResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadDashboard() {
            setLoading(true);
            setError(null);
            try {
                const [saleData, lowStockData, productData] = await Promise.all([
                    saleService.list(),
                    stockService.listLowStock(),
                    productService.list(),
                ]);
                setSales(saleData);
                setLowStock(lowStockData);
                setProducts(productData);
            } catch (loadError) {
                setError(getApiErrorMessage(loadError, "Nao foi possivel carregar o dashboard."));
            } finally {
                setLoading(false);
            }
        }

        void loadDashboard();
    }, []);

    const productNameById = useMemo(() => new Map(products.map((product) => [product.id, product.name])), [products]);
    const today = new Date();

    const finalizedSales = useMemo(() => sales.filter((sale) => sale.status === "FINALIZADA"), [sales]);
    const todayTotal = finalizedSales
        .filter((sale) => isSameDay(new Date(sale.createdAt), today))
        .reduce((sum, sale) => sum + sale.total, 0);
    const monthTotal = finalizedSales
        .filter((sale) => isSameMonth(new Date(sale.createdAt), today))
        .reduce((sum, sale) => sum + sale.total, 0);

    const latestSales = useMemo(
        () => [...sales].sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()).slice(0, 5),
        [sales],
    );

    const salesByDay = useMemo<DailySaleChartData[]>(() => {
        const totals = new Map<string, number>();
        finalizedSales.forEach((sale) => {
            const day = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(new Date(sale.createdAt));
            totals.set(day, (totals.get(day) ?? 0) + sale.total);
        });
        return Array.from(totals.entries()).map(([day, total]) => ({ day, total })).slice(-14);
    }, [finalizedSales]);

    const topProducts = useMemo<ProductChartData[]>(() => {
        const quantities = new Map<number, number>();
        finalizedSales.forEach((sale) => {
            sale.items.forEach((item) => {
                if (item.productId) {
                    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
                }
            });
        });
        return Array.from(quantities.entries())
            .map(([productId, quantity]) => ({ product: productNameById.get(productId) ?? `#${productId}`, quantity }))
            .sort((first, second) => second.quantity - first.quantity)
            .slice(0, 8);
    }, [finalizedSales, productNameById]);

    if (loading) {
        return <LoadingState message="Carregando dashboard..." />;
    }

    return (
        <section className="page-section">
            <PageHeader eyebrow="Dashboard" title="Resumo operacional" description="Indicadores de vendas e estoque." />
            {error && <div className="form-error">{error}</div>}
            <div className="metric-row">
                <div className="metric-card"><span>Vendas do dia</span><strong>{formatCurrency(todayTotal)}</strong></div>
                <div className="metric-card"><span>Vendas do mes</span><strong>{formatCurrency(monthTotal)}</strong></div>
                <div className="metric-card warning"><span>Estoque baixo</span><strong>{lowStock.length}</strong></div>
                <div className="metric-card"><span>Ultimas vendas</span><strong>{latestSales.length}</strong></div>
            </div>

            <div className="dashboard-grid">
                <div className="chart-panel">
                    <h3>Vendas por dia</h3>
                    {salesByDay.length === 0 ? <EmptyState message="Sem vendas finalizadas para o grafico." /> : (
                        <ResponsiveContainer width="100%" height={280}>
                            <LineChart data={salesByDay}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" />
                                <YAxis />
                                <Tooltip formatter={(value) => (typeof value === "number" ? formatCurrency(value) : String(value ?? ""))} />
                                <Line type="monotone" dataKey="total" stroke="#1f6feb" strokeWidth={3} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
                <div className="chart-panel">
                    <h3>Produtos mais vendidos</h3>
                    {topProducts.length === 0 ? <EmptyState message="Sem produtos vendidos para o grafico." /> : (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={topProducts}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="product" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="quantity" fill="#198754" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            <div className="table-wrap">
                <table className="data-table">
                    <thead><tr><th>Venda</th><th>Cliente</th><th>Status</th><th>Total</th><th>Criada em</th></tr></thead>
                    <tbody>
                        {latestSales.map((sale) => (
                            <tr key={sale.id}>
                                <td>#{sale.id}</td>
                                <td>{sale.clientName ?? "-"}</td>
                                <td><StatusBadge label={sale.status} /></td>
                                <td>{formatCurrency(sale.total)}</td>
                                <td>{formatDateTime(sale.createdAt)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

export default DashboardPage;
