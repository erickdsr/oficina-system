

package com.distribuidora.system_oficina.product;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import com.distribuidora.system_oficina.category.entity.Category;
import com.distribuidora.system_oficina.category.repository.CategoryRepository;
import com.distribuidora.system_oficina.product.dto.ProductRequestDTO;
import com.distribuidora.system_oficina.product.dto.ProductResponseDTO;
import com.distribuidora.system_oficina.product.entity.Product;
import com.distribuidora.system_oficina.product.entity.Unit;
import com.distribuidora.system_oficina.product.repository.ProductRepository;
import com.distribuidora.system_oficina.product.service.ProductService;
import com.distribuidora.system_oficina.supplier.entity.Supplier;
import com.distribuidora.system_oficina.supplier.repository.SupplierRepository;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private SupplierRepository supplierRepository;

    @InjectMocks
    private ProductService productService;

    @Test
    @DisplayName("createProduct com dados válidos deve criar o produto corretamente")
    void createProduct_dadosValidos_deveCriarProdutoCorretamente() {
        // Arrange
        Category category = new Category();
        category.setId(1);
        category.setName("Peças");
        Supplier supplier = new Supplier();
        supplier.setId(2);
        supplier.setName("Fornecedor A");

        ProductRequestDTO request = ProductRequestDTO.builder()
                .name("Filtro de Óleo")
                .description("Filtro automotivo")
                .partNumber("PN-001")
                .barCode("ABC123")
                .categoryId(1)
                .supplierId(2)
                .costPrice(new BigDecimal("10.00"))
                .salePrice(new BigDecimal("15.00"))
                .unit(Unit.UN)
                .status(true)
                .build();

        when(categoryRepository.findById(1)).thenReturn(Optional.of(category));
        when(supplierRepository.findById(2)).thenReturn(Optional.of(supplier));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        ProductResponseDTO result = productService.createProduct(request);

        // Assert
        assertThat(result.getName()).isEqualTo("Filtro de Óleo");
        assertThat(result.getCategoryName()).isEqualTo("Peças");
        assertThat(result.getSupplierName()).isEqualTo("Fornecedor A");
        verify(productRepository).save(any(Product.class));
    }

    @Test
    @DisplayName("createProduct com categoria inexistente deve lançar exceção")
    void createProduct_categoriaNaoEncontrada_deveLancarExcecao() {
        // Arrange
        ProductRequestDTO request = ProductRequestDTO.builder()
                .categoryId(99)
                .supplierId(2)
                .name("Filtro")
                .status(true)
                .build();

        when(categoryRepository.findById(99)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () -> productService.createProduct(request));
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    @DisplayName("getProductById com id inexistente deve lançar exceção")
    void getProductById_idNaoExistente_deveLancarExcecao() {
        // Arrange
        when(productRepository.findById(99)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResponseStatusException.class, () -> productService.getProductById(99));
    }
}
