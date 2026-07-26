import { Loader2, Trash2, TriangleAlert } from "lucide-react";
import type { MouseEvent } from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { DeletionReport } from "../../types/api.types";
import { normalizeRole } from "../../utils/permissions";

interface ConfirmDeleteModalProps {
    isOpen: boolean;
    title?: string;
    itemName?: string;
    description?: string;
    confirmLabel?: string;
    loadingLabel?: string;
    isLoading?: boolean;
    error?: string | null;
    details?: Array<{ label: string; value: string }>;
    report?: DeletionReport | null;
    userRole?: string;
    onConfirm: () => void | Promise<void>;
    onForceConfirm?: () => void | Promise<void>;
    onCancel: () => void;
}

const dependencyLabels: Record<string, string> = {
    products: "produtos",
    purchases: "compras",
    purchaseItems: "itens de compra",
    sales: "vendas",
    saleItems: "itens de venda",
    salePayments: "pagamentos",
    stock: "estoque",
    movements: "movimentacoes",
};

export function ConfirmDeleteModal({
    isOpen,
    title = "Excluir registro",
    itemName,
    description = "Esta acao nao podera ser desfeita.",
    confirmLabel = "Excluir",
    loadingLabel = "Processando...",
    isLoading = false,
    error,
    details = [],
    report,
    userRole,
    onConfirm,
    onForceConfirm,
    onCancel,
}: ConfirmDeleteModalProps) {
    const titleId = useId();
    const descriptionId = useId();
    const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
    const previousActiveElementRef = useRef<Element | null>(null);
    const [forceConfirmation, setForceConfirmation] = useState("");
    const isAdmin = normalizeRole(userRole) === "ADMIN";
    const dependencyEntries = useMemo(
        () => Object.entries(report?.dependencies ?? {}).filter(([, count]) => count > 0),
        [report],
    );
    const hasDependencies = dependencyEntries.length > 0;
    const canForceDelete = Boolean(onForceConfirm && isAdmin && hasDependencies);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        setForceConfirmation("");
        previousActiveElementRef.current = document.activeElement;
        cancelButtonRef.current?.focus();

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = originalOverflow;
            if (previousActiveElementRef.current instanceof HTMLElement) {
                previousActiveElementRef.current.focus();
            }
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !isLoading) {
                onCancel();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isLoading, isOpen, onCancel]);

    if (!isOpen) {
        return null;
    }

    function handleOverlayClick(event: MouseEvent<HTMLDivElement>) {
        if (event.target === event.currentTarget && !isLoading) {
            onCancel();
        }
    }

    return (
        <div className="modal-overlay" role="presentation" onMouseDown={handleOverlayClick}>
            <div
                className="confirm-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
            >
                <div className="confirm-modal__icon" aria-hidden="true">
                    <Trash2 size={22} />
                </div>

                <div className="confirm-modal__content">
                    <h2 id={titleId}>{title}</h2>
                    <p id={descriptionId}>
                        Tem certeza de que deseja excluir{itemName ? ` "${itemName}"` : " este registro"}?
                    </p>
                    {details.length > 0 && (
                        <dl className="delete-details">
                            {details.map((detail) => (
                                <div key={detail.label}>
                                    <dt>{detail.label}</dt>
                                    <dd>{detail.value}</dd>
                                </div>
                            ))}
                        </dl>
                    )}
                    {hasDependencies && (
                        <div className="dependency-report">
                            <strong>Foram encontrados vinculos:</strong>
                            <ul>
                                {dependencyEntries.map(([key, count]) => (
                                    <li key={key}>
                                        <span>{count}</span>
                                        {dependencyLabels[key] ?? key}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <div className="confirm-modal__notice">
                        <TriangleAlert size={16} aria-hidden="true" />
                        <span>
                            {hasDependencies
                                ? "Para preservar a integridade do historico, o registro sera apenas desativado."
                                : description}
                        </span>
                    </div>
                    {canForceDelete && (
                        <>
                            <div className="confirm-modal__notice confirm-modal__notice--danger">
                                <TriangleAlert size={16} aria-hidden="true" />
                                <span>
                                    A exclusao definitiva removera todos os registros vinculados. Esta acao e irreversivel.
                                </span>
                            </div>
                            <label className="force-confirm-field">
                                <span>Digite EXCLUIR para liberar a exclusao definitiva</span>
                                <input
                                    value={forceConfirmation}
                                    onChange={(event) => setForceConfirmation(event.target.value)}
                                    placeholder="EXCLUIR"
                                    disabled={isLoading}
                                />
                            </label>
                        </>
                    )}
                    {error && (
                        <div role="alert" className="delete-error">
                            {error}
                        </div>
                    )}
                </div>

                <div className="confirm-modal__actions">
                    <button
                        ref={cancelButtonRef}
                        type="button"
                        className="secondary-button"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        Cancelar
                    </button>
                    <button type="button" className="danger-button" onClick={onConfirm} disabled={isLoading}>
                        {isLoading && <Loader2 className="confirm-modal__spinner" size={16} aria-hidden="true" />}
                        {isLoading ? loadingLabel : hasDependencies ? "Desativar" : confirmLabel}
                    </button>
                    {canForceDelete && (
                        <button
                            type="button"
                            className="danger-button"
                            onClick={onForceConfirm}
                            disabled={isLoading || forceConfirmation !== "EXCLUIR"}
                        >
                            Excluir definitivamente
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ConfirmDeleteModal;
