import { useEffect, useMemo, useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    ResponsiveContainer,
    Scatter,
    ScatterChart,
    Tooltip,
    XAxis,
    YAxis,
    ZAxis,
} from "recharts";
import EmptyState from "../../components/common/EmptyState";
import LoadingState from "../../components/common/LoadingState";
import PageHeader from "../../components/common/PageHeader";
import StatusBadge from "../../components/common/StatusBadge";
import {
    ChartContainer,
    ChartEmpty,
    ChartFewData,
    ChartLegend,
    ChartTooltip,
    getYAxisDomain,
    resolveChartState,
} from "../../components/common/ChartKit";
import { getApiErrorMessage } from "../../services/api";
import clientService from "../../services/client.service";
import productService from "../../services/product.service";
import purchaseService from "../../services/purchase.service";
import saleService from "../../services/sale.service";
import stockService from "../../services/stock.service";
import type { Client } from "../../types/client.types";
import type { ProductResponse } from "../../types/product.types";
import type { PurchaseResponse } from "../../types/purchase.types";
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

function getBarSize(count: number) {
    if (count <= 1) {
        return 46;
    }

    if (count === 2) {
        return 58;
    }

    return 42;
}

export function DashboardPage() {
    const [sales, setSales] = useState<SaleResponse[]>([]);
    const [lowStock, setLowStock] = useState<StockResponse[]>([]);
    const [products, setProducts] = useState<ProductResponse[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [purchases, setPurchases] = useState<PurchaseResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadDashboard() {
            setLoading(true);
            setError(null);
            try {
                const [saleData, lowStockData, productData, clientData, purchaseData] = await Promise.all([
                    saleService.list(),
                    stockService.listLowStock(),
                    productService.list(),
                    clientService.list(),
                    purchaseService.list(),
                ]);
                setSales(saleData);
                setLowStock(lowStockData);
                setProducts(productData);
                setClients(clientData);
                setPurchases(purchaseData);
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
    const todaySales = finalizedSales.filter((sale) => isSameDay(new Date(sale.createdAt), today));
    const monthSales = finalizedSales.filter((sale) => isSameMonth(new Date(sale.createdAt), today));
    const todayTotal = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    const monthTotal = monthSales.reduce((sum, sale) => sum + sale.total, 0);
    const ticketAverage = monthSales.length > 0 ? monthTotal / monthSales.length : 0;
    const pendingSales = sales.filter((sale) => sale.status !== "FINALIZADA" && sale.status !== "CANCELADA").length;
    const unavailableProducts = products.filter((product) => !product.status).length;

    const latestSales = useMemo(
        () => [...sales].sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()).slice(0, 5),
        [sales],
    );

    const latestPurchases = useMemo(
        () => [...purchases].sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()).slice(0, 5),
        [purchases],
    );

    const latestClients = useMemo(
        () => [...clients].sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()).slice(0, 5),
        [clients],
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

    const salesChartState = resolveChartState(salesByDay.length);
    const productChartState = resolveChartState(topProducts.length);
    const salesMaxValue = Math.max(...salesByDay.map((item) => item.total), 0);
    const productsMaxValue = Math.max(...topProducts.map((item) => item.quantity), 0);
    const salesChartData = salesByDay.length === 1 ? [{ ...salesByDay[0], chartIndex: 1 }] : salesByDay.map((item, index) => ({ ...item, chartIndex: index }));
    const productChartData = topProducts.length === 1
        ? [{ product: "", quantity: 0 }, topProducts[0], { product: " ", quantity: 0 }]
        : topProducts;

    if (loading) {
        return <LoadingState message="Carregando dashboard..." />;
    }

    return (
        <section className="page-section">
            <PageHeader eyebrow="Dashboard" title="Resumo operacional" description="Indicadores comerciais, estoque e movimentacoes recentes." />
            {error && <div className="form-error">{error}</div>}

            <div className="metric-row">
                <div className="metric-card"><span>Vendas do dia</span><strong>{formatCurrency(todayTotal)}</strong></div>
                <div className="metric-card"><span>Vendas do mes</span><strong>{formatCurrency(monthTotal)}</strong></div>
                <div className="metric-card success"><span>Ticket medio</span><strong>{formatCurrency(ticketAverage)}</strong></div>
                <div className="metric-card warning"><span>Estoque baixo</span><strong>{lowStock.length}</strong></div>
            </div>

            <div className="metric-row">
                <div className="metric-card"><span>Vendas pendentes</span><strong>{pendingSales}</strong></div>
                <div className="metric-card"><span>Clientes recentes</span><strong>{latestClients.length}</strong></div>
                <div className="metric-card"><span>Compras recentes</span><strong>{latestPurchases.length}</strong></div>
                <div className="metric-card warning"><span>Produtos inativos</span><strong>{unavailableProducts}</strong></div>
            </div>

            <div className="dashboard-grid">
                <ChartContainer
                    title="Vendas por dia"
                    description="Receita finalizada nos ultimos lancamentos."
                    action={<span className="chart-kpi">{finalizedSales.length} vendas</span>}
                >
                    {salesChartState === "empty" ? <ChartEmpty message="Sem vendas finalizadas para o grafico." /> : (
                        <>
                            <div className={salesChartState === "few" ? "chart-stage chart-stage--few" : "chart-stage"}>
                                {salesByDay.length === 1 ? (
                                    <ChartFewData note={`${salesByDay[0].day} - ${formatCurrency(salesByDay[0].total)}`}>
                                        <ResponsiveContainer width="100%" height={310}>
                                            <ScatterChart data={salesChartData} margin={{ top: 28, right: 48, bottom: 24, left: 32 }}>
                                                <CartesianGrid stroke="rgba(255,255,255,.035)" vertical={false} />
                                                <XAxis
                                                    type="number"
                                                    dataKey="chartIndex"
                                                    domain={[0, 2]}
                                                    ticks={[1]}
                                                    tickFormatter={() => salesByDay[0].day}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: "#94A3B8", fontSize: 12 }}
                                                />
                                                <YAxis
                                                    type="number"
                                                    dataKey="total"
                                                    domain={getYAxisDomain(salesMaxValue)}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: "#94A3B8", fontSize: 12 }}
                                                />
                                                <ZAxis range={[190, 190]} />
                                                <Tooltip content={<ChartTooltip valueFormatter={(value) => formatCurrency(value)} />} cursor={{ stroke: "rgba(59,130,246,.16)", strokeWidth: 1 }} />
                                                <Scatter dataKey="total" fill="#2563EB" isAnimationActive animationDuration={700} animationEasing="ease-out">
                                                    <Cell fill="#3B82F6" />
                                                </Scatter>
                                            </ScatterChart>
                                        </ResponsiveContainer>
                                    </ChartFewData>
                                ) : (
                                    <ResponsiveContainer width="100%" height={310}>
                                        <LineChart data={salesChartData} margin={{ top: 24, right: 28, bottom: 10, left: 8 }}>
                                            <CartesianGrid stroke="rgba(255,255,255,.035)" vertical={false} />
                                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 12 }} padding={{ left: 22, right: 22 }} />
                                            <YAxis domain={getYAxisDomain(salesMaxValue)} axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 12 }} />
                                            <Tooltip content={<ChartTooltip valueFormatter={(value) => formatCurrency(value)} />} cursor={{ stroke: "rgba(59,130,246,.18)", strokeWidth: 1 }} />
                                            <Line
                                                type="monotone"
                                                dataKey="total"
                                                stroke="#3B82F6"
                                                strokeWidth={3}
                                                dot={{ r: salesChartState === "few" ? 5 : 4, fill: "#2563EB", strokeWidth: 2, stroke: "#93C5FD" }}
                                                activeDot={{ r: 7 }}
                                                isAnimationActive
                                                animationDuration={850}
                                                animationEasing="ease-out"
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                            <ChartLegend items={[{ label: salesChartState === "few" ? "Amostra inicial" : "Receita finalizada", color: "#2563EB", value: formatCurrency(salesMaxValue) }]} />
                        </>
                    )}
                </ChartContainer>

                <ChartContainer title="Produtos mais vendidos" description="Volume por item em vendas finalizadas.">
                    {productChartState === "empty" ? <ChartEmpty message="Sem produtos vendidos para o grafico." /> : (
                        <>
                            <div className={productChartState === "few" ? "chart-stage chart-stage--few" : "chart-stage"}>
                                <ResponsiveContainer width="100%" height={310}>
                                    <BarChart data={productChartData} margin={{ top: 24, right: 24, bottom: 10, left: 6 }} barCategoryGap={topProducts.length === 1 ? "62%" : topProducts.length === 2 ? "38%" : "24%"}>
                                        <CartesianGrid stroke="rgba(255,255,255,.035)" vertical={false} />
                                        <XAxis dataKey="product" axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 12 }} interval={0} />
                                        <YAxis domain={getYAxisDomain(productsMaxValue)} allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 12 }} />
                                        <Tooltip content={<ChartTooltip valueFormatter={(value) => `${value} un.`} />} cursor={{ fill: "rgba(59,130,246,.055)" }} />
                                        <Bar dataKey="quantity" fill="#2563EB" radius={[6, 6, 0, 0]} barSize={getBarSize(topProducts.length)} isAnimationActive animationDuration={760} animationEasing="ease-out" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <ChartLegend items={[{ label: productChartState === "few" ? "Amostra inicial" : "Unidades vendidas", color: "#2563EB", value: `${productsMaxValue} un.` }]} />
                        </>
                    )}
                </ChartContainer>
            </div>

            <div className="dashboard-grid dashboard-grid--balanced">
                <div className="chart-panel">
                    <div className="chart-panel__header">
                        <div>
                            <h3>Ultimas vendas</h3>
                            <p>Atividade comercial recente.</p>
                        </div>
                    </div>
                    <div className="activity-list">
                        {latestSales.map((sale) => (
                            <div className="activity-item" key={sale.id}>
                                <div>
                                    <strong>Venda #{sale.id}</strong>
                                    <span>{sale.clientName ?? "Cliente nao informado"} - {formatDateTime(sale.createdAt)}</span>
                                </div>
                                <div>
                                    <StatusBadge label={sale.status} />
                                    <small>{formatCurrency(sale.total)}</small>
                                </div>
                            </div>
                        ))}
                        {latestSales.length === 0 && <EmptyState message="Nenhuma venda encontrada." />}
                    </div>
                </div>

                <div className="chart-panel">
                    <div className="chart-panel__header">
                        <div>
                            <h3>Estoque baixo</h3>
                            <p>Itens que precisam de atencao.</p>
                        </div>
                    </div>
                    <div className="activity-list">
                        {lowStock.slice(0, 5).map((stock) => (
                            <div className="activity-item" key={stock.id}>
                                <div>
                                    <strong>{stock.productId ? productNameById.get(stock.productId) ?? `Produto #${stock.productId}` : "Produto nao informado"}</strong>
                                    <span>{stock.location ?? "Sem localizacao"}</span>
                                </div>
                                <div>
                                    <StatusBadge label="PENDENTE" />
                                    <small>{stock.quantity} / min. {stock.minQuantity}</small>
                                </div>
                            </div>
                        ))}
                        {lowStock.length === 0 && <EmptyState message="Estoque saudavel." description="Nenhum item abaixo do minimo no momento." />}
                    </div>
                </div>
            </div>

            <div className="dashboard-grid dashboard-grid--balanced">
                <div className="chart-panel">
                    <div className="chart-panel__header">
                        <div>
                            <h3>Compras recentes</h3>
                            <p>Ultimas entradas registradas.</p>
                        </div>
                    </div>
                    <div className="activity-list">
                        {latestPurchases.map((purchase) => (
                            <div className="activity-item" key={purchase.id}>
                                <div>
                                    <strong>Compra #{purchase.id}</strong>
                                    <span>{purchase.supplierName ?? "Fornecedor nao informado"} - {formatDateTime(purchase.createdAt)}</span>
                                </div>
                                <div>
                                    <StatusBadge label={purchase.status} />
                                    <small>{formatCurrency(purchase.total)}</small>
                                </div>
                            </div>
                        ))}
                        {latestPurchases.length === 0 && <EmptyState message="Nenhuma compra encontrada." />}
                    </div>
                </div>

                <div className="chart-panel">
                    <div className="chart-panel__header">
                        <div>
                            <h3>Clientes recentes</h3>
                            <p>Novos cadastros no sistema.</p>
                        </div>
                    </div>
                    <div className="activity-list">
                        {latestClients.map((client) => (
                            <div className="activity-item" key={client.id}>
                                <div>
                                    <strong>{client.name}</strong>
                                    <span>{client.city || "Cidade nao informada"} - {formatDateTime(client.createdAt)}</span>
                                </div>
                                <StatusBadge active={client.status} />
                            </div>
                        ))}
                        {latestClients.length === 0 && <EmptyState message="Nenhum cliente encontrado." />}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default DashboardPage;
