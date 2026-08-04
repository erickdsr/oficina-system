import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Area,
    Bar,
    BarChart,
    CartesianGrid,
    ComposedChart,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import {
    AlertTriangle,
    ArrowUpRight,
    Banknote,
    Boxes,
    Clock3,
    CreditCard,
    DollarSign,
    PackageX,
    RefreshCcw,
    ShoppingCart,
    TrendingUp,
    Users,
    WalletCards,
} from "lucide-react";
import EmptyState from "../../components/common/EmptyState";
import StatusBadge from "../../components/common/StatusBadge";
import {
    ChartContainer,
    ChartLegend,
    getYAxisDomain,
} from "../../components/common/ChartKit";
import { useAuth } from "../../context/auth.context";
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

type SalesPeriod = "today" | "7d" | "30d" | "month" | "year";
type ProductPeriod = "today" | "week" | "month" | "year";
type ChartType = "line" | "column";

interface MetricCardData {
    title: string;
    value: string;
    description: string;
    variation: string;
    tone?: "success" | "warning" | "danger" | "muted";
    icon: typeof DollarSign;
}

interface SaleChartPoint {
    label: string;
    period: string;
    total: number;
    salesCount: number;
    start: Date;
    end: Date;
}

interface SalesTooltipPayload {
    payload?: SaleChartPoint;
}

interface SalesTooltipProps {
    active?: boolean;
    payload?: SalesTooltipPayload[];
}

interface TopProduct {
    productId: number;
    product: string;
    quantity: number;
    total: number;
    share: number;
}

interface Activity {
    id: string;
    title: string;
    description: string;
    date: string;
    tone?: "success" | "warning" | "muted";
}

const salesPeriods: Array<{ id: SalesPeriod; label: string }> = [
    { id: "today", label: "Hoje" },
    { id: "7d", label: "7 dias" },
    { id: "30d", label: "30 dias" },
    { id: "month", label: "Mensal" },
    { id: "year", label: "Anual" },
];

const productPeriods: Array<{ id: ProductPeriod; label: string }> = [
    { id: "today", label: "Hoje" },
    { id: "week", label: "Semana" },
    { id: "month", label: "Mes" },
    { id: "year", label: "Ano" },
];

const chartTypes: Array<{ id: ChartType; label: string }> = [
    { id: "line", label: "Linha" },
    { id: "column", label: "Colunas" },
];

const monthLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function startOfDay(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(date: Date, reference: Date) {
    return date.getFullYear() === reference.getFullYear() && date.getMonth() === reference.getMonth() && date.getDate() === reference.getDate();
}

function isSameMonth(date: Date, reference: Date) {
    return date.getFullYear() === reference.getFullYear() && date.getMonth() === reference.getMonth();
}

function isSameYear(date: Date, reference: Date) {
    return date.getFullYear() === reference.getFullYear();
}

function daysAgo(days: number) {
    const date = startOfDay(new Date());
    date.setDate(date.getDate() - days);
    return date;
}

function addDays(date: Date, days: number) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
}

function addMonths(date: Date, months: number) {
    const next = new Date(date);
    next.setMonth(next.getMonth() + months);
    return next;
}

function startOfMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfYear(date: Date) {
    return new Date(date.getFullYear(), 0, 1);
}

function inProductPeriod(value: string, period: ProductPeriod) {
    const date = new Date(value);
    const now = new Date();

    if (period === "today") {
        return isSameDay(date, now);
    }

    if (period === "week") {
        return date >= daysAgo(6);
    }

    if (period === "month") {
        return isSameMonth(date, now);
    }

    return isSameYear(date, now);
}

function inRange(value: string, start: Date, end: Date) {
    const date = new Date(value);
    return date >= start && date < end;
}

function variation(current: number, previous: number) {
    if (previous === 0 && current === 0) {
        return "0%";
    }

    if (previous === 0) {
        return "+100%";
    }

    const value = ((current - previous) / previous) * 100;
    return `${value >= 0 ? "+" : ""}${value.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%`;
}

function greeting() {
    const hour = new Date().getHours();
    if (hour < 12) {
        return "Bom dia";
    }

    if (hour < 18) {
        return "Boa tarde";
    }

    return "Boa noite";
}

function firstName(name?: string) {
    return name?.trim().split(/\s+/)[0] || "Usuario";
}

function paymentLabel(sale: SaleResponse) {
    if (sale.payments.length === 0) {
        return "-";
    }

    return sale.payments.length === 1 ? "Pagamento unico" : `${sale.payments.length} pagamentos`;
}

function productLabel(productId: number | null, productNameById: Map<number, string>) {
    if (!productId) {
        return "Produto nao informado";
    }

    return productNameById.get(productId) ?? `Produto #${productId}`;
}

function periodLabel(period: SalesPeriod) {
    if (period === "today") {
        return "Hoje";
    }

    if (period === "7d") {
        return "Ultimos 7 dias";
    }

    if (period === "30d") {
        return "Ultimos 30 dias";
    }

    if (period === "month") {
        return "Mes a mes";
    }

    return "Ano a ano";
}

function compactCurrency(value: number) {
    if (value >= 1_000_000) {
        return `R$ ${(value / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`;
    }

    if (value >= 1_000) {
        return `R$ ${(value / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
    }

    return formatCurrency(value);
}

function saleCountLabel(count: number) {
    return `${count.toLocaleString("pt-BR")} ${count === 1 ? "venda" : "vendas"}`;
}

function buildSalesBuckets(period: SalesPeriod, reference: Date): SaleChartPoint[] {
    if (period === "today") {
        const start = startOfDay(reference);
        return Array.from({ length: reference.getHours() + 1 }, (_, hour) => {
            const bucketStart = new Date(start);
            bucketStart.setHours(hour, 0, 0, 0);
            const bucketEnd = new Date(start);
            bucketEnd.setHours(hour + 1, 0, 0, 0);
            return {
                label: `${String(hour).padStart(2, "0")}h`,
                period: `${String(hour).padStart(2, "0")}:00`,
                total: 0,
                salesCount: 0,
                start: bucketStart,
                end: bucketEnd,
            };
        });
    }

    if (period === "7d" || period === "30d") {
        const days = period === "7d" ? 7 : 30;
        const firstDay = addDays(startOfDay(reference), -(days - 1));
        return Array.from({ length: days }, (_, index) => {
            const start = addDays(firstDay, index);
            const end = addDays(start, 1);
            return {
                label: new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(start),
                period: new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long" }).format(start),
                total: 0,
                salesCount: 0,
                start,
                end,
            };
        });
    }

    if (period === "month") {
        const currentMonth = startOfMonth(reference);
        const firstMonth = addMonths(currentMonth, -7);
        return Array.from({ length: 8 }, (_, index) => {
            const start = addMonths(firstMonth, index);
            const end = addMonths(start, 1);
            return {
                label: monthLabels[start.getMonth()],
                period: new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(start),
                total: 0,
                salesCount: 0,
                start,
                end,
            };
        });
    }

    const currentYear = startOfYear(reference).getFullYear();
    const firstYear = currentYear - 3;
    return Array.from({ length: 4 }, (_, index) => {
        const year = firstYear + index;
        const start = new Date(year, 0, 1);
        const end = new Date(year + 1, 0, 1);
        return {
            label: String(year),
            period: String(year),
            total: 0,
            salesCount: 0,
            start,
            end,
        };
    });
}

function buildSalesChartData(sales: SaleResponse[], period: SalesPeriod, reference: Date): SaleChartPoint[] {
    const buckets = buildSalesBuckets(period, reference);

    sales.forEach((sale) => {
        const saleDate = new Date(sale.createdAt);
        const bucket = buckets.find((item) => saleDate >= item.start && saleDate < item.end);
        if (!bucket) {
            return;
        }

        bucket.total += sale.total;
        bucket.salesCount += 1;
    });

    if (period === "today") {
        const firstDataIndex = buckets.findIndex((bucket) => bucket.salesCount > 0 || bucket.total > 0);
        if (firstDataIndex === -1) {
            return [];
        }

        return buckets.slice(Math.max(0, firstDataIndex - 1));
    }

    return buckets;
}

function SalesChartTooltip({ active, payload }: SalesTooltipProps) {
    const point = payload?.[0]?.payload;
    if (!active || !point) {
        return null;
    }

    return (
        <div className="chart-tooltip home-chart-tooltip">
            <span>{point.period}</span>
            <strong>{formatCurrency(point.total)}</strong>
            <small>{saleCountLabel(point.salesCount)}</small>
        </div>
    );
}

export function HomePage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [sales, setSales] = useState<SaleResponse[]>([]);
    const [lowStock, setLowStock] = useState<StockResponse[]>([]);
    const [products, setProducts] = useState<ProductResponse[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [purchases, setPurchases] = useState<PurchaseResponse[]>([]);
    const [referenceDate, setReferenceDate] = useState(() => new Date());
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [salesPeriod, setSalesPeriod] = useState<SalesPeriod>("7d");
    const [productPeriod, setProductPeriod] = useState<ProductPeriod>("month");
    const [chartType, setChartType] = useState<ChartType>("column");

    const loadHome = useCallback(async (silent = false) => {
        if (silent) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
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
            setReferenceDate(new Date());
        } catch (loadError) {
            setError(getApiErrorMessage(loadError, "Nao foi possivel carregar a Home."));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        void loadHome();

        const interval = window.setInterval(() => {
            void loadHome(true);
        }, 60_000);

        const handleFocus = () => {
            void loadHome(true);
        };

        const handleDashboardRefresh = () => {
            void loadHome(true);
        };

        window.addEventListener("focus", handleFocus);
        window.addEventListener("garageos:refresh-dashboard", handleDashboardRefresh);
        return () => {
            window.clearInterval(interval);
            window.removeEventListener("focus", handleFocus);
            window.removeEventListener("garageos:refresh-dashboard", handleDashboardRefresh);
        };
    }, [loadHome]);

    const productNameById = useMemo(() => new Map(products.map((product) => [product.id, product.name])), [products]);
    const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
    const finalizedSales = useMemo(() => sales.filter((sale) => sale.status === "FINALIZADA"), [sales]);
    const now = referenceDate;

    const metrics = useMemo<MetricCardData[]>(() => {
        const todaySales = finalizedSales.filter((sale) => isSameDay(new Date(sale.createdAt), now));
        const yesterdaySales = finalizedSales.filter((sale) => inRange(sale.createdAt, daysAgo(1), startOfDay(now)));
        const monthSales = finalizedSales.filter((sale) => isSameMonth(new Date(sale.createdAt), now));
        const previousMonthSales = finalizedSales.filter((sale) => inRange(sale.createdAt, new Date(now.getFullYear(), now.getMonth() - 1, 1), new Date(now.getFullYear(), now.getMonth(), 1)));
        const monthPurchases = purchases.filter((purchase) => isSameMonth(new Date(purchase.createdAt), now) && purchase.status !== "CANCELADA");
        const previousMonthPurchases = purchases.filter((purchase) => inRange(purchase.createdAt, new Date(now.getFullYear(), now.getMonth() - 1, 1), new Date(now.getFullYear(), now.getMonth(), 1)) && purchase.status !== "CANCELADA");
        const todayTotal = todaySales.reduce((sum, sale) => sum + sale.total, 0);
        const yesterdayTotal = yesterdaySales.reduce((sum, sale) => sum + sale.total, 0);
        const monthTotal = monthSales.reduce((sum, sale) => sum + sale.total, 0);
        const previousMonthTotal = previousMonthSales.reduce((sum, sale) => sum + sale.total, 0);
        const ticketAverage = monthSales.length > 0 ? monthTotal / monthSales.length : 0;
        const previousTicket = previousMonthSales.length > 0 ? previousMonthTotal / previousMonthSales.length : 0;
        const pendingSales = sales.filter((sale) => sale.status === "PENDENTE").length;
        const previousPurchaseTotal = previousMonthPurchases.reduce((sum, purchase) => sum + purchase.total, 0);
        const purchaseTotal = monthPurchases.reduce((sum, purchase) => sum + purchase.total, 0);
        const inactiveProducts = products.filter((product) => !product.status).length;

        return [
            { title: "Vendas do dia", value: formatCurrency(todayTotal), description: "Receita finalizada hoje", variation: variation(todayTotal, yesterdayTotal), tone: "success", icon: DollarSign },
            { title: "Vendas do mes", value: formatCurrency(monthTotal), description: "Receita finalizada no mes", variation: variation(monthTotal, previousMonthTotal), tone: "success", icon: TrendingUp },
            { title: "Ticket medio", value: formatCurrency(ticketAverage), description: "Media das vendas do mes", variation: variation(ticketAverage, previousTicket), icon: CreditCard },
            { title: "Clientes cadastrados", value: clients.length.toLocaleString("pt-BR"), description: "Base ativa para relacionamento", variation: "+0%", icon: Users },
            { title: "Compras do mes", value: formatCurrency(purchaseTotal), description: "Entradas e reposicoes", variation: variation(purchaseTotal, previousPurchaseTotal), icon: ShoppingCart },
            { title: "Estoque baixo", value: lowStock.length.toLocaleString("pt-BR"), description: "Itens abaixo do minimo", variation: lowStock.length > 0 ? "Atencao" : "Estavel", tone: lowStock.length > 0 ? "warning" : "success", icon: Boxes },
            { title: "Produtos inativos", value: inactiveProducts.toLocaleString("pt-BR"), description: "Itens fora do catalogo ativo", variation: inactiveProducts > 0 ? "Revisar" : "0%", tone: inactiveProducts > 0 ? "warning" : "muted", icon: PackageX },
            { title: "Vendas pendentes", value: pendingSales.toLocaleString("pt-BR"), description: "Aguardando conclusao", variation: pendingSales > 0 ? "Acompanhar" : "0%", tone: pendingSales > 0 ? "warning" : "success", icon: Clock3 },
        ];
    }, [clients.length, finalizedSales, lowStock.length, products, purchases, sales, now]);

    const salesChartData = useMemo(() => buildSalesChartData(finalizedSales, salesPeriod, now), [finalizedSales, now, salesPeriod]);
    const salesChartVisibleData = useMemo(() => salesChartData.filter((item) => item.salesCount > 0 || item.total > 0), [salesChartData]);
    const salesMaxValue = Math.max(...salesChartData.map((item) => item.total), 0);
    const salesChartTotal = salesChartVisibleData.reduce((sum, item) => sum + item.total, 0);
    const salesChartCount = salesChartVisibleData.reduce((sum, item) => sum + item.salesCount, 0);

    const topProducts = useMemo<TopProduct[]>(() => {
        const items = new Map<number, { quantity: number; total: number }>();
        const periodSales = finalizedSales.filter((sale) => inProductPeriod(sale.createdAt, productPeriod));

        periodSales.forEach((sale) => {
            sale.items.forEach((item) => {
                if (!item.productId) {
                    return;
                }
                const current = items.get(item.productId) ?? { quantity: 0, total: 0 };
                items.set(item.productId, {
                    quantity: current.quantity + item.quantity,
                    total: current.total + (item.subtotal ?? item.quantity * item.unitPrice),
                });
            });
        });

        const totalSold = Array.from(items.values()).reduce((sum, item) => sum + item.total, 0);
        const limit = items.size > 5 ? 10 : 5;

        return Array.from(items.entries())
            .map(([productId, item]) => ({
                productId,
                product: productNameById.get(productId) ?? `Produto #${productId}`,
                quantity: item.quantity,
                total: item.total,
                share: totalSold > 0 ? (item.total / totalSold) * 100 : 0,
            }))
            .sort((first, second) => second.total - first.total)
            .slice(0, limit);
    }, [finalizedSales, productNameById, productPeriod]);

    const latestSales = useMemo(
        () => [...sales].sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()).slice(0, 6),
        [sales],
    );

    const financialSummary = useMemo(() => {
        const monthRevenue = finalizedSales.filter((sale) => isSameMonth(new Date(sale.createdAt), now)).reduce((sum, sale) => sum + sale.total, 0);
        const monthExpenses = purchases.filter((purchase) => isSameMonth(new Date(purchase.createdAt), now) && purchase.status !== "CANCELADA").reduce((sum, purchase) => sum + purchase.total, 0);
        const profit = monthRevenue - monthExpenses;
        const margin = monthRevenue > 0 ? (profit / monthRevenue) * 100 : 0;

        return [
            { label: "Receita", value: formatCurrency(monthRevenue), icon: Banknote, tone: "success" },
            { label: "Despesas", value: formatCurrency(monthExpenses), icon: WalletCards, tone: "warning" },
            { label: "Lucro", value: formatCurrency(profit), icon: TrendingUp, tone: profit >= 0 ? "success" : "danger" },
            { label: "Margem", value: `${margin.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`, icon: ArrowUpRight, tone: margin >= 0 ? "success" : "danger" },
        ];
    }, [finalizedSales, purchases, now]);

    const activities = useMemo<Activity[]>(() => {
        return [
            ...sales.map((sale) => ({
                id: `sale-${sale.id}`,
                title: "Venda realizada",
                description: `${sale.clientName ?? "Cliente nao informado"} - ${formatCurrency(sale.total)}`,
                date: sale.createdAt,
                tone: sale.status === "FINALIZADA" ? "success" as const : "warning" as const,
            })),
            ...purchases.map((purchase) => ({
                id: `purchase-${purchase.id}`,
                title: purchase.status === "RECEBIDA" ? "Compra recebida" : "Compra registrada",
                description: `${purchase.supplierName ?? "Fornecedor nao informado"} - ${formatCurrency(purchase.total)}`,
                date: purchase.updatedAt ?? purchase.createdAt,
                tone: purchase.status === "RECEBIDA" ? "success" as const : "warning" as const,
            })),
            ...clients.map((client) => ({
                id: `client-${client.id}`,
                title: "Cliente cadastrado",
                description: client.name,
                date: client.createdAt,
                tone: "muted" as const,
            })),
            ...products.map((product) => ({
                id: `product-${product.id}`,
                title: "Produto editado",
                description: product.name,
                date: product.updatedAt,
                tone: product.status ? "muted" as const : "warning" as const,
            })),
        ]
            .sort((first, second) => new Date(second.date).getTime() - new Date(first.date).getTime())
            .slice(0, 8);
    }, [clients, products, purchases, sales]);

    const nextActions = useMemo(() => {
        const criticalStock = lowStock.filter((stock) => stock.quantity <= stock.minQuantity / 2).length;
        const pendingPurchases = purchases.filter((purchase) => purchase.status === "PENDENTE").length;
        const pendingSales = sales.filter((sale) => sale.status === "PENDENTE").length;
        const inactiveFor90Days = products.filter((product) => {
            const updatedAt = new Date(product.updatedAt).getTime();
            return now.getTime() - updatedAt > 90 * 86_400_000;
        }).length;

        return [
            { label: `${criticalStock} produtos com estoque critico`, tone: criticalStock > 0 ? "warning" : "success" },
            { label: `${pendingPurchases} compras pendentes`, tone: pendingPurchases > 0 ? "warning" : "success" },
            { label: `${pendingSales} vendas aguardando pagamento`, tone: pendingSales > 0 ? "warning" : "success" },
            { label: `${inactiveFor90Days} produtos sem movimentacao ha 90 dias`, tone: inactiveFor90Days > 0 ? "warning" : "success" },
        ];
    }, [lowStock, now, products, purchases, sales]);

    function renderSalesChart() {
        if (salesChartVisibleData.length === 0) {
            return <EmptyState message="Todavia nao existem vendas nesse periodo." description="As vendas aparecerao aqui automaticamente." />;
        }

        const chartProps = {
            data: salesChartData,
            margin: { top: 20, right: 18, bottom: 0, left: 0 },
        };

        const grid = <CartesianGrid stroke="rgba(148,163,184,.12)" strokeDasharray="3 8" vertical={false} />;
        const xAxis = (
            <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                interval={salesPeriod === "30d" ? 2 : 0}
                minTickGap={10}
                padding={{ left: salesChartData.length <= 2 ? 90 : 18, right: salesChartData.length <= 2 ? 90 : 18 }}
                tick={{ fill: "#94A3B8", fontSize: 12, fontWeight: 700 }}
            />
        );
        const yAxis = (
            <YAxis
                width={68}
                domain={getYAxisDomain(salesMaxValue)}
                axisLine={false}
                tickLine={false}
                tickCount={5}
                tickFormatter={compactCurrency}
                tick={{ fill: "#64748B", fontSize: 11, fontWeight: 700 }}
            />
        );
        const tooltip = (
            <Tooltip
                content={<SalesChartTooltip />}
                cursor={chartType === "column" ? { fill: "rgba(37,99,235,.08)" } : { stroke: "rgba(59,130,246,.22)", strokeWidth: 1 }}
            />
        );

        return (
            <>
                <div className="chart-stage home-chart-stage">
                    <ResponsiveContainer width="100%" height={328}>
                        {chartType === "column" ? (
                            <BarChart {...chartProps}>
                                {grid}
                                {xAxis}
                                {yAxis}
                                {tooltip}
                                <Bar
                                    dataKey="total"
                                    fill="#2563EB"
                                    radius={[8, 8, 3, 3]}
                                    maxBarSize={salesChartData.length <= 2 ? 54 : 34}
                                    minPointSize={salesChartVisibleData.length === 1 ? 4 : 0}
                                    isAnimationActive
                                    animationDuration={720}
                                    animationEasing="ease-out"
                                />
                            </BarChart>
                        ) : (
                            <ComposedChart {...chartProps}>
                                <defs>
                                    <linearGradient id="homeSalesLineFill" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.22} />
                                        <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.01} />
                                    </linearGradient>
                                </defs>
                                {grid}
                                {xAxis}
                                {yAxis}
                                {tooltip}
                                <Area type="monotone" dataKey="total" fill="url(#homeSalesLineFill)" stroke="transparent" activeDot={false} isAnimationActive animationDuration={820} animationEasing="ease-out" />
                                <Line type="monotone" dataKey="total" stroke="#60A5FA" strokeWidth={3} dot={{ r: 3, fill: "#0F172A", strokeWidth: 2, stroke: "#60A5FA" }} activeDot={{ r: 6, fill: "#2563EB", stroke: "#BFDBFE", strokeWidth: 2 }} isAnimationActive animationDuration={820} animationEasing="ease-out" />
                            </ComposedChart>
                        )}
                    </ResponsiveContainer>
                </div>
                <ChartLegend items={[{ label: periodLabel(salesPeriod), color: "#2563EB", value: `${formatCurrency(salesChartTotal)} - ${saleCountLabel(salesChartCount)}` }]} />
            </>
        );
    }

    if (loading) {
        return (
            <section className="page-section home-page">
                <HomeSkeleton />
            </section>
        );
    }

    if (error) {
        return (
            <section className="page-section home-page">
                <div className="home-hero">
                    <div>
                        <h2>Central operacional do sistema.</h2>
                        <p>Bem-vindo ao GarageOS. Aqui voce acompanha tudo que esta acontecendo na empresa.</p>
                    </div>
                    <button type="button" className="primary-button" onClick={() => loadHome()}>
                        <RefreshCcw size={18} aria-hidden="true" />
                        Atualizar dados
                    </button>
                </div>
                <div className="form-error">{error}</div>
            </section>
        );
    }

    return (
        <section className="page-section home-page">
            <div className="home-hero">
                <div>
                    <h2>{greeting()}, {firstName(user?.name)} 👋</h2>
                    <p>Bem-vindo ao GarageOS. Aqui voce acompanha tudo que esta acontecendo na empresa.</p>
                </div>
                {refreshing && <RefreshCcw className="loading-state__spinner home-hero__refresh" size={18} aria-label="Atualizando dados" />}
            </div>

            <div className="home-metric-grid">
                {metrics.map((metric) => {
                    const Icon = metric.icon;
                    return (
                        <div key={metric.title} className={`metric-card home-metric-card ${metric.tone ?? ""}`}>
                            <Icon size={19} aria-hidden="true" />
                            <span>{metric.title}</span>
                            <strong>{metric.value}</strong>
                            <small>{metric.variation} · {metric.description}</small>
                        </div>
                    );
                })}
            </div>

            <div className="home-section-grid home-main-grid">
                <ChartContainer
                    title="Grafico de vendas"
                    description="Receita finalizada por periodo, com alternancia de visualizacao."
                    action={
                        <div className="home-chart-controls">
                            <div className="home-segmented-control" aria-label="Periodo do grafico de vendas">
                                {salesPeriods.map((period) => (
                                    <button key={period.id} type="button" className={salesPeriod === period.id ? "active" : undefined} onClick={() => setSalesPeriod(period.id)}>
                                        {period.label}
                                    </button>
                                ))}
                            </div>
                            <div className="home-segmented-control" aria-label="Tipo do grafico de vendas">
                                {chartTypes.map((type) => (
                                    <button key={type.id} type="button" className={chartType === type.id ? "active" : undefined} onClick={() => setChartType(type.id)}>
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    }
                >
                    {renderSalesChart()}
                </ChartContainer>

                <div className="chart-panel home-products-panel">
                    <div className="chart-panel__header">
                        <div>
                            <h3>Produtos mais vendidos</h3>
                            <p>Top {topProducts.length > 5 ? 10 : 5} por valor vendido e participacao.</p>
                        </div>
                        <div className="home-segmented-control compact" aria-label="Periodo de produtos mais vendidos">
                            {productPeriods.map((period) => (
                                <button key={period.id} type="button" className={productPeriod === period.id ? "active" : undefined} onClick={() => setProductPeriod(period.id)}>
                                    {period.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    {topProducts.length === 0 ? (
                        <EmptyState message="Sem produtos vendidos no periodo." description="Quando houver vendas finalizadas, os produtos mais vendidos aparecerao aqui." />
                    ) : (
                        <div className="home-ranking-list">
                            {topProducts.map((product) => (
                                <div className="home-ranking-item" key={product.productId}>
                                    <div>
                                        <strong>{product.product}</strong>
                                        <span>{product.quantity.toLocaleString("pt-BR")} un. · {formatCurrency(product.total)}</span>
                                    </div>
                                    <div className="home-ranking-share">
                                        <span>{product.share.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</span>
                                        <i style={{ width: `${Math.max(6, product.share)}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="home-section-grid home-section-grid--balanced">
                <div className="chart-panel home-table-panel">
                    <div className="chart-panel__header">
                        <div>
                            <h3>Ultimas vendas</h3>
                            <p>Atividade comercial recente com status operacional.</p>
                        </div>
                    </div>
                    {latestSales.length === 0 ? (
                        <EmptyState message="Nenhuma venda encontrada." description="Assim que uma venda for criada, ela aparecera nesta lista." />
                    ) : (
                        <div className="home-sale-list">
                            {latestSales.map((sale) => (
                                <button type="button" className="home-sale-row" key={sale.id} onClick={() => navigate(`/sales/${sale.id}`)}>
                                    <div><strong>{sale.clientName ?? "Cliente nao informado"}</strong><span>{formatDateTime(sale.createdAt)}</span></div>
                                    <div><strong>{formatCurrency(sale.total)}</strong><span>{paymentLabel(sale)}</span></div>
                                    <div><strong>{sale.employeeName ?? "Funcionario nao informado"}</strong><StatusBadge label={sale.status} /></div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="chart-panel home-table-panel">
                    <div className="chart-panel__header">
                        <div>
                            <h3>Estoque baixo</h3>
                            <p>Itens que precisam de reposicao.</p>
                        </div>
                    </div>
                    {lowStock.length === 0 ? (
                        <EmptyState message="Estoque saudavel." description="Nenhum item abaixo do minimo no momento." />
                    ) : (
                        <div className="home-stock-list">
                            {lowStock.slice(0, 8).map((stock) => {
                                const product = stock.productId ? productById.get(stock.productId) : undefined;
                                return (
                                    <div className="home-stock-row" key={stock.id}>
                                        <div>
                                            <strong>{productLabel(stock.productId, productNameById)}</strong>
                                            <span>{product?.supplierName ?? "Fornecedor nao informado"}</span>
                                        </div>
                                        <div><strong>{stock.quantity.toLocaleString("pt-BR")}</strong><span>Min. {stock.minQuantity.toLocaleString("pt-BR")}</span></div>
                                        <Link className="secondary-button" to={`/purchases/new?productId=${stock.productId ?? ""}`}>
                                            <ShoppingCart size={16} aria-hidden="true" />
                                            Comprar
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <div className="home-financial-grid">
                {financialSummary.map((item) => {
                    const Icon = item.icon;
                    return (
                        <div key={item.label} className={`metric-card home-financial-card ${item.tone}`}>
                            <Icon size={18} aria-hidden="true" />
                            <span>{item.label}</span>
                            <strong>{item.value}</strong>
                            <small>Preparado para modulo financeiro</small>
                        </div>
                    );
                })}
            </div>

            <div className="home-section-grid home-section-grid--balanced">
                <div className="chart-panel">
                    <div className="chart-panel__header">
                        <div>
                            <h3>Atividades recentes</h3>
                            <p>Linha do tempo operacional em ordem cronologica.</p>
                        </div>
                    </div>
                    {activities.length === 0 ? (
                        <EmptyState message="Nenhuma atividade recente." description="As movimentacoes do ERP serao exibidas automaticamente aqui." />
                    ) : (
                        <div className="home-activity-timeline">
                            {activities.map((activity) => (
                                <div className={`home-activity-item ${activity.tone ?? "muted"}`} key={activity.id}>
                                    <i aria-hidden="true" />
                                    <div>
                                        <strong>{activity.title}</strong>
                                        <span>{activity.description}</span>
                                    </div>
                                    <time>{formatDateTime(activity.date)}</time>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="chart-panel">
                    <div className="chart-panel__header">
                        <div>
                            <h3>Proximas acoes</h3>
                            <p>Alertas praticos para orientar a operacao.</p>
                        </div>
                    </div>
                    <div className="home-action-list">
                        {nextActions.map((action) => (
                            <div className={`home-action-item ${action.tone}`} key={action.label}>
                                <AlertTriangle size={17} aria-hidden="true" />
                                <span>{action.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

function HomeSkeleton() {
    return (
        <>
            <div className="home-skeleton hero" />
            <div className="home-metric-grid">
                {Array.from({ length: 8 }, (_, index) => <div className="home-skeleton card" key={index} />)}
            </div>
            <div className="home-section-grid">
                <div className="home-skeleton panel" />
                <div className="home-skeleton panel" />
            </div>
        </>
    );
}

export default HomePage;
