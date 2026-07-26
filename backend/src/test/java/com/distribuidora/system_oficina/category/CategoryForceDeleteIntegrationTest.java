package com.distribuidora.system_oficina.category;

import static org.assertj.core.api.Assertions.assertThat;

import com.distribuidora.system_oficina.category.entity.Category;
import com.distribuidora.system_oficina.category.repository.CategoryRepository;
import com.distribuidora.system_oficina.category.service.CategoryService;
import com.distribuidora.system_oficina.product.entity.Product;
import com.distribuidora.system_oficina.product.entity.Unit;
import com.distribuidora.system_oficina.product.repository.ProductRepository;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class CategoryForceDeleteIntegrationTest {

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Test
    void forceDeleteCategoryWithLinkedProductShouldRemoveProductAndCategory() {
        Category category = new Category();
        category.setName("Motor");
        category.setDescription("Pecas de motor");
        category = categoryRepository.save(category);

        Product product = new Product();
        product.setName("Filtro");
        product.setCategory(category);
        product.setUnit(Unit.UN);
        product.setCostPrice(BigDecimal.TEN);
        product.setSalePrice(BigDecimal.valueOf(20));
        product.setStatus(true);
        product = productRepository.save(product);

        categoryService.forceDeleteCategory(category.getId());

        assertThat(productRepository.findById(product.getId())).isEmpty();
        assertThat(categoryRepository.findById(category.getId())).isEmpty();
    }
}
