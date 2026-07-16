import { useCallback, useState } from "react";
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
            throw loadError;
        } finally {
            setLoading(false);
        }
    }, []);

    const createCategory = useCallback((category: CategoryRequest) => categoryService.create(category), []);
    const updateCategory = useCallback((id: ApiId, category: CategoryRequest) => categoryService.update(id, category), []);
    const removeCategory = useCallback((id: ApiId) => categoryService.remove(id), []);

    return { categories, loading, error, setError, loadCategories, createCategory, updateCategory, removeCategory };
}

export default useCategory;
