import type { ReactNode } from "react";
import EmptyState from "./EmptyState";
import LoadingState from "./LoadingState";

type ChartState = "empty" | "few" | "normal" | "large";

interface ChartContainerProps {
    title: string;
    description?: string;
    action?: ReactNode;
    children: ReactNode;
}

interface ChartTooltipProps {
    active?: boolean;
    payload?: Array<{ value?: number; name?: string; color?: string }>;
    label?: string;
    valueFormatter?: (value: number, name?: string) => string;
}

interface ChartLegendProps {
    items: Array<{ label: string; color?: string; value?: string | number }>;
}

export function resolveChartState(count: number): ChartState {
    if (count === 0) {
        return "empty";
    }

    if (count <= 2) {
        return "few";
    }

    if (count > 14) {
        return "large";
    }

    return "normal";
}

export function getYAxisDomain(maxValue: number) {
    if (maxValue <= 0) {
        return [0, 1] as const;
    }

    return [0, Math.ceil(maxValue * 1.18)] as const;
}

export function ChartContainer({ title, description, action, children }: ChartContainerProps) {
    return (
        <div className="chart-panel">
            <div className="chart-panel__header">
                <div>
                    <h3>{title}</h3>
                    {description && <p>{description}</p>}
                </div>
                {action}
            </div>
            {children}
        </div>
    );
}

export function ChartEmpty({ message = "Sem dados para o grafico." }: { message?: string }) {
    return <EmptyState message={message} description="Assim que houver movimentacao suficiente, o grafico sera atualizado automaticamente." />;
}

export function ChartNoData({ message }: { message?: string }) {
    return <ChartEmpty message={message} />;
}

export function ChartLoading({ message = "Carregando grafico..." }: { message?: string }) {
    return <LoadingState message={message} />;
}

export function ChartFewData({ children, note }: { children: ReactNode; note?: string }) {
    return (
        <div className="chart-few-data">
            {children}
            {note && <span>{note}</span>}
        </div>
    );
}

export function ChartLegend({ items }: ChartLegendProps) {
    return (
        <div className="chart-legend">
            {items.map((item) => (
                <span key={item.label}>
                    <i style={{ background: item.color ?? "#2563EB" }} aria-hidden="true" />
                    {item.label}
                    {item.value !== undefined && <strong>{item.value}</strong>}
                </span>
            ))}
        </div>
    );
}

export function ChartTooltip({ active, payload, label, valueFormatter }: ChartTooltipProps) {
    if (!active || !payload?.length) {
        return null;
    }

    const item = payload[0];
    const value = item.value ?? 0;

    return (
        <div className="chart-tooltip">
            <span>{label}</span>
            <strong>{valueFormatter ? valueFormatter(value, item.name) : String(value)}</strong>
        </div>
    );
}
