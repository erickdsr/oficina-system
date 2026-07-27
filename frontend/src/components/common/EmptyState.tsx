import { PackageOpen } from "lucide-react";

interface EmptyStateProps {
    message?: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
}

export function EmptyState({
    message = "Nenhum registro encontrado.",
    description = "Ajuste os filtros ou cadastre um novo item para continuar.",
    actionLabel,
    onAction,
}: EmptyStateProps) {
    return (
        <div className="empty-state">
            <div className="empty-state__icon" aria-hidden="true">
                <PackageOpen size={24} />
            </div>
            <strong>{message}</strong>
            <span>{description}</span>
            {actionLabel && onAction && (
                <button type="button" className="primary-button" onClick={onAction}>
                    {actionLabel}
                </button>
            )}
        </div>
    );
}

export default EmptyState;
