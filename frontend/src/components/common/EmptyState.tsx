interface EmptyStateProps {
    message?: string;
}

export function EmptyState({ message = "Nenhum registro encontrado." }: EmptyStateProps) {
    return <div className="empty-state">{message}</div>;
}

export default EmptyState;
