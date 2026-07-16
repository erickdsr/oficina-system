import { useCallback, useState } from "react";
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
            throw loadError;
        } finally {
            setLoading(false);
        }
    }, []);

    const createProduct = useCallback((product: ProductRequest) => productService.create(product), []);
    const updateProduct = useCallback((id: ApiId, product: ProductRequest) => productService.update(id, product), []);
    const removeProduct = useCallback((id: ApiId) => productService.remove(id), []);

    return { products, loading, error, setError, loadProducts, createProduct, updateProduct, removeProduct };
}

export default useProduct;
