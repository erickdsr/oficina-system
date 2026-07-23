import { LoaderCircle } from "lucide-react";

interface LoadingStateProps {
    message?: string;
}

export function LoadingState({ message = "Carregando..." }: LoadingStateProps) {
    return (
        <div className="loading-state">
            <LoaderCircle className="loading-state__spinner" size={24} aria-hidden="true" />
            <span>{message}</span>
        </div>
    );
}

export default LoadingState;
