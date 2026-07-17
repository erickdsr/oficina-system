import { useCallback, useState } from "react";
import { toast } from "sonner";
import { getApiErrorMessage } from "../services/api";
import categoryService from "../services/category.service";
import type { ApiId } from "../types/api.types";
import type { Category, CategoryRequest } from "../types/category.types";

export function useCategory() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadCategories = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await categoryService.list();
            setCategories(data);
            return data;
        } catch (loadError) {
            const message = getApiErrorMessage(loadError, "Nao foi possivel carregar categorias.");
            setError(message);
            toast.error(message);
            throw loadError;
        } finally {
            setLoading(false);
        }
    }, []);

    const createCategory = useCallback(async (category: CategoryRequest) => {
        const data = await categoryService.create(category);
        toast.success("Categoria criada com sucesso.");
        return data;
    }, []);
    const updateCategory = useCallback(async (id: ApiId, category: CategoryRequest) => {
        const data = await categoryService.update(id, category);
        toast.success("Categoria atualizada com sucesso.");
        return data;
    }, []);
    const removeCategory = useCallback(async (id: ApiId) => {
        await categoryService.remove(id);
        toast.success("Categoria removida com sucesso.");
    }, []);

    return {
        categories,
        loading,
        error,
        setError,
        fetchAll: loadCategories,
        create: createCategory,
        update: updateCategory,
        remove: removeCategory,
        loadCategories,
        createCategory,
        updateCategory,
        removeCategory,
    };
}

export default useCategory;
