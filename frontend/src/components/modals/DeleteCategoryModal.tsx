import { Loader2, Trash2, TriangleAlert } from "lucide-react";
import type { MouseEvent } from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Category } from "../../types/category.types";

interface DeleteCategoryModalProps {
    isOpen: boolean;
    category: Category | null;
    isLoading: boolean;
    error: string | null;
    linkedProductsCount?: number;
    onCancel: () => void;
    onConfirm: () => Promise<void> | void;
    onForceDelete: () => Promise<void> | void;
}

export function DeleteCategoryModal({
    isOpen,
    category,
    isLoading,
    error,
    linkedProductsCount,
    onCancel,
    onConfirm,
    onForceDelete,
}: DeleteCategoryModalProps) {
    const titleId = useId();
    const descriptionId = useId();
    const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
    const previousActiveElementRef = useRef<Element | null>(null);
    const [confirmationText, setConfirmationText] = useState("");
    const isForceMode = linkedProductsCount !== undefined;
    const canForceDelete = confirmationText.trim().toUpperCase() === "EXCLUIR";

    const title = isForceMode ? "Categoria com produtos vinculados" : "Excluir categoria";
    const itemName = category?.name ?? "esta categoria";
    const description = useMemo(() => {
        if (isForceMode) {
            return `A categoria "${itemName}" possui produtos vinculados. A exclusao forcada apagara tambem os produtos e todos os registros dependentes relacionados a eles. Essa acao e permanente e nao podera ser desfeita.`;
        }

        return `Tem certeza de que deseja excluir a categoria "${itemName}"?`;
    }, [isForceMode, itemName]);

    useEffect(() => {
        if (!isOpen) {
            setConfirmationText("");
            return;
        }

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
        setConfirmationText("");
    }, [category?.id, isForceMode]);

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

    if (!isOpen || !category) {
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
                className="confirm-modal delete-category-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
            >
                <div className={`confirm-modal__icon ${isForceMode ? "confirm-modal__icon--danger" : ""}`} aria-hidden="true">
                    {isForceMode ? <TriangleAlert size={22} /> : <Trash2 size={22} />}
                </div>

                <div className="confirm-modal__content">
                    <h2 id={titleId}>{title}</h2>
                    <p id={descriptionId}>{description}</p>
                    {!isForceMode && (
                        <div className="confirm-modal__notice">
                            <TriangleAlert size={16} aria-hidden="true" />
                            <span>Esta acao nao podera ser desfeita.</span>
                        </div>
                    )}
                    {isForceMode && (
                        <>
                            <div className="confirm-modal__notice confirm-modal__notice--danger">
                                <TriangleAlert size={16} aria-hidden="true" />
                                <span>Produtos vinculados: {linkedProductsCount}</span>
                            </div>
                            <label className="force-confirm-field">
                                <span>Digite EXCLUIR para confirmar</span>
                                <input
                                    type="text"
                                    value={confirmationText}
                                    onChange={(event) => setConfirmationText(event.target.value)}
                                    placeholder='Digite "EXCLUIR" para confirmar'
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
                    {isForceMode ? (
                        <button type="button" className="danger-button" onClick={onForceDelete} disabled={isLoading || !canForceDelete}>
                            {isLoading && <Loader2 className="confirm-modal__spinner" size={16} aria-hidden="true" />}
                            {isLoading ? "Excluindo registros..." : "Excluir categoria e produtos"}
                        </button>
                    ) : (
                        <button type="button" className="primary-button" onClick={onConfirm} disabled={isLoading}>
                            {isLoading && <Loader2 className="confirm-modal__spinner" size={16} aria-hidden="true" />}
                            {isLoading ? "Excluindo..." : "Excluir categoria"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default DeleteCategoryModal;
