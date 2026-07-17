import { useCallback, useState } from "react";
import { toast } from "sonner";
import { getApiErrorMessage } from "../services/api";
import productService from "../services/product.service";
import type { ApiId } from "../types/api.types";
import type { ProductRequest, ProductResponse } from "../types/product.types";

export function useProduct() {
    const [products, setProducts] = useState<ProductResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadProducts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await productService.list();
            setProducts(data);
            return data;
        } catch (loadError) {
            const message = getApiErrorMessage(loadError, "Nao foi possivel carregar produtos.");
            setError(message);
            toast.error(message);
            throw loadError;
        } finally {
            setLoading(false);
        }
    }, []);

    const createProduct = useCallback(async (product: ProductRequest) => {
        const data = await productService.create(product);
        toast.success("Produto criado com sucesso.");
        return data;
    }, []);
    const updateProduct = useCallback(async (id: ApiId, product: ProductRequest) => {
        const data = await productService.update(id, product);
        toast.success("Produto atualizado com sucesso.");
        return data;
    }, []);
    const removeProduct = useCallback(async (id: ApiId) => {
        await productService.remove(id);
        toast.success("Produto removido com sucesso.");
    }, []);

    return {
        products,
        loading,
        error,
        setError,
        fetchAll: loadProducts,
        create: createProduct,
        update: updateProduct,
        remove: removeProduct,
        loadProducts,
        createProduct,
        updateProduct,
        removeProduct,
    };
}

export default useProduct;
