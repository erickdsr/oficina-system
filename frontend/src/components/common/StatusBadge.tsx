interface StatusBadgeProps {
    active: boolean;
}

export function StatusBadge({ active }: StatusBadgeProps) {
    return <span className={active ? "status-badge active" : "status-badge inactive"}>{active ? "Ativo" : "Inativo"}</span>;
}

export default StatusBadge;
