type BadgeTone = "success" | "warning" | "danger" | "muted";

interface StatusBadgeProps {
    active?: boolean;
    label?: string;
    tone?: BadgeTone;
}

function resolveTone(label: string, active?: boolean, tone?: BadgeTone) {
    if (tone) {
        return tone;
    }

    if (active !== undefined) {
        return active ? "success" : "muted";
    }

    const normalizedLabel = label.toUpperCase();

    if (["FINALIZADA", "RECEBIDA", "ENTRADA"].includes(normalizedLabel)) {
        return "success";
    }

    if (["PENDENTE", "AJUSTE"].includes(normalizedLabel)) {
        return "warning";
    }

    if (["CANCELADA", "SAIDA"].includes(normalizedLabel)) {
        return "danger";
    }

    return "muted";
}

export function StatusBadge({ active, label, tone }: StatusBadgeProps) {
    const text = label ?? (active ? "Ativo" : "Inativo");
    return <span className={`status-badge ${resolveTone(text, active, tone)}`}>{text}</span>;
}

export default StatusBadge;
