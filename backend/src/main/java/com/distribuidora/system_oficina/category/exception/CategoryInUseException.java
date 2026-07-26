package com.distribuidora.system_oficina.category.exception;

import com.distribuidora.system_oficina.config.ResourceInUseException;
import java.util.Map;

public class CategoryInUseException extends ResourceInUseException {

    private final Integer categoryId;
    private final long linkedProducts;

    public CategoryInUseException(Integer categoryId, long linkedProducts) {
        super(
                "CATEGORY_IN_USE",
                "CATEGORY",
                "A categoria possui produtos vinculados.",
                Map.of("products", linkedProducts, "categoryId", categoryId));
        this.categoryId = categoryId;
        this.linkedProducts = linkedProducts;
    }

    public Integer getCategoryId() {
        return categoryId;
    }

    public long getLinkedProducts() {
        return linkedProducts;
    }
}
