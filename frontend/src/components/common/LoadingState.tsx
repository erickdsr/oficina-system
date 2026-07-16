interface LoadingStateProps {
    message?: string;
}

export function LoadingState({ message = "Carregando..." }: LoadingStateProps) {
    return <div className="loading-state">{message}</div>;
}

export default LoadingState;
