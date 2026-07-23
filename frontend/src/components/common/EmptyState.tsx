import { PackageOpen } from "lucide-react";

interface EmptyStateProps {
    message?: string;
    description?: string;
}

export function EmptyState({ message = "Nenhum registro encontrado.", description = "Ajuste os filtros ou cadastre um novo item para continuar." }: EmptyStateProps) {
    return (
        <div className="empty-state">
            <div className="empty-state__icon" aria-hidden="true">
                <PackageOpen size={24} />
            </div>
            <strong>{message}</strong>
            <span>{description}</span>
        </div>
    );
}

export default EmptyState;
