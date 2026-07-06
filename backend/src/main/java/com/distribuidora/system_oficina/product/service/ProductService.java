package com.distribuidora.system_oficina.product.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.distribuidora.system_oficina.category.entity.Category;
import com.distribuidora.system_oficina.category.repository.CategoryRepository;
import com.distribuidora.system_oficina.product.dto.ProductRequestDTO;
import com.distribuidora.system_oficina.product.dto.ProductResponseDTO;
import com.distribuidora.system_oficina.product.entity.Product;
import com.distribuidora.system_oficina.product.repository.ProductRepository;
import com.distribuidora.system_oficina.supplier.entity.Supplier;
import com.distribuidora.system_oficina.supplier.repository.SupplierRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SupplierRepository supplierRepository;

    private Product toEntity(ProductRequestDTO dto) {
        Product entity = new Product();
        updateEntityFromDto(entity, dto);
        return entity;
    }

    private void updateEntityFromDto(Product entity, ProductRequestDTO dto) {
        Category category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Category not found with id: " + dto.getCategoryId()));
        Supplier supplier = dto.getSupplierId() == null
                ? null
                : supplierRepository.findById(dto.getSupplierId())
                        .orElseThrow(() -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND, "Supplier not found with id: " + dto.getSupplierId()));

        entity.setName(dto.getName());
        entity.setDescription(dto.getDescription());
        entity.setPartNumber(dto.getPartNumber());
        entity.setBarCode(dto.getBarCode());
        entity.setSupplier(supplier);
        entity.setCategory(category);
        entity.setCostPrice(dto.getCostPrice());
        entity.setSalePrice(dto.getSalePrice());
        entity.setUnit(dto.getUnit());
        entity.setStatus(dto.getStatus() != null ? dto.getStatus() : true);
    }

    private ProductResponseDTO toResponseDTO(Product entity) {
        return ProductResponseDTO.fromEntity(entity);
    }

    public List<ProductResponseDTO> listProducts() {
        return productRepository.findAll().stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    public ProductResponseDTO getProductById(Integer id) {
        return toResponseDTO(productRepository.findById(id).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found with id: " + id)));
    }

    public ProductResponseDTO createProduct(ProductRequestDTO dto) {
        return toResponseDTO(productRepository.save(toEntity(dto)));
    }

    public ProductResponseDTO updateProduct(Integer id, ProductRequestDTO dto) {
        Product entity = productRepository.findById(id).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found with id: " + id));
        updateEntityFromDto(entity, dto);
        return toResponseDTO(productRepository.save(entity));
    }

    public void deleteProduct(Integer id) {
        if (!productRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found with id: " + id);
        }
        productRepository.deleteById(id);
    }
}
