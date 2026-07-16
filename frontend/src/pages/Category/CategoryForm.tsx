import { useEffect, useState, type FormEvent } from "react";
import type { Category, CategoryRequest } from "../../types/category.types";

interface CategoryFormProps {
    category?: Category | null;
    loading?: boolean;
    error?: string | null;
    onCancel: () => void;
    onSubmit: (category: CategoryRequest) => Promise<void>;
}

const initialForm: CategoryRequest = {
    name: "",
    description: "",
};

export function CategoryForm({ category, loading = false, error, onCancel, onSubmit }: CategoryFormProps) {
    const [form, setForm] = useState<CategoryRequest>(initialForm);
    const [validationError, setValidationError] = useState<string | null>(null);

    useEffect(() => {
        setForm(
            category
                ? {
                      name: category.name,
                      description: category.description,
                  }
                : initialForm,
        );
        setValidationError(null);
    }, [category]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!form.name.trim()) {
            setValidationError("Informe o nome da categoria.");
            return;
        }

        setValidationError(null);
        await onSubmit(form);
    }

    return (
        <form className="entity-form" onSubmit={handleSubmit} noValidate>
            <h3>{category ? "Editar categoria" : "Nova categoria"}</h3>
            <label className="form-field">
                <span>Nome</span>
                <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </label>
            <label className="form-field">
                <span>Descricao</span>
                <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </label>
            {(validationError || error) && <div className="form-error">{validationError ?? error}</div>}
            <div className="form-actions">
                <button type="button" className="secondary-button" onClick={onCancel}>
                    Cancelar
                </button>
                <button type="submit" className="primary-button" disabled={loading}>
                    {loading ? "Salvando..." : "Salvar"}
                </button>
            </div>
        </form>
    );
}

export default CategoryForm;
