package com.distribuidora.system_oficina.product.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.distribuidora.system_oficina.category.entity.Category;
import com.distribuidora.system_oficina.category.repository.CategoryRepository;
import com.distribuidora.system_oficina.deletion.DeletionReportDTO;
import com.distribuidora.system_oficina.deletion.DeletionResource;
import com.distribuidora.system_oficina.deletion.DeletionResultDTO;
import com.distribuidora.system_oficina.deletion.DeletionService;
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
    private final DeletionService deletionService;

    private Product toEntity(ProductRequestDTO dto) {
        Product entity = new Product();
        entity.setInternalCode(generateTemporaryInternalCode());
        updateEntityFromDto(entity, dto);
        return entity;
    }

    private void updateEntityFromDto(Product entity, ProductRequestDTO dto) {
        Category category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Category not found with id: " + dto.getCategoryId()));
        Supplier supplier = supplierRepository.findById(dto.getSupplierId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Supplier not found with id: " + dto.getSupplierId()));

        String partNumber = normalizeRequired(dto.getPartNumber(), "O numero da peca e obrigatorio");
        String barCode = normalizeOptional(dto.getBarCode());
        String brand = normalizeRequired(dto.getBrand(), "A marca e obrigatoria");
        validateBusinessRules(entity.getId(), partNumber, barCode, dto);

        entity.setName(normalizeRequired(dto.getName(), "O nome e obrigatorio"));
        entity.setDescription(normalizeOptional(dto.getDescription()));
        entity.setPartNumber(partNumber);
        entity.setBarCode(barCode);
        entity.setBrand(brand);
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

    public List<ProductResponseDTO> listProducts(boolean includeInactive) {
        return (includeInactive ? productRepository.findAll() : productRepository.findAllByStatus(true)).stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }
    public List<ProductResponseDTO> listProducts() {
        return listProducts(false);
    }

    public ProductResponseDTO getProductById(Integer id) {
        return toResponseDTO(productRepository.findById(id).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found with id: " + id)));
    }

    public ProductResponseDTO createProduct(ProductRequestDTO dto) {
        Product saved = productRepository.save(toEntity(dto));
        saved.setInternalCode(generateInternalCode(saved.getId()));
        return toResponseDTO(productRepository.save(saved));
    }

    public ProductResponseDTO updateProduct(Integer id, ProductRequestDTO dto) {
        Product entity = productRepository.findById(id).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found with id: " + id));
        updateEntityFromDto(entity, dto);
        return toResponseDTO(productRepository.save(entity));
    }

    private void validateBusinessRules(Integer currentProductId, String partNumber, String barCode, ProductRequestDTO dto) {
        ensureUniquePartNumber(currentProductId, partNumber);
        ensureUniqueBarCode(currentProductId, barCode);

        if (dto.getCostPrice() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O preco de custo e obrigatorio.");
        }

        if (dto.getSalePrice() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O preco de venda e obrigatorio.");
        }

        if (dto.getCostPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O preco de custo nao pode ser negativo.");
        }

        if (dto.getSalePrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O preco de venda nao pode ser negativo.");
        }

        if (dto.getSalePrice().compareTo(dto.getCostPrice()) < 0 && !Boolean.TRUE.equals(dto.getAllowSaleBelowCost())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "O preco de venda esta abaixo do custo. Confirme a autorizacao para salvar.");
        }
    }

    private void ensureUniquePartNumber(Integer currentProductId, String partNumber) {
        productRepository.findByPartNumberIgnoreCase(partNumber)
                .filter(product -> !product.getId().equals(currentProductId))
                .ifPresent(product -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Numero da peca ja cadastrado.");
                });
    }

    private void ensureUniqueBarCode(Integer currentProductId, String barCode) {
        Optional.ofNullable(barCode)
                .flatMap(productRepository::findByBarCode)
                .filter(product -> !product.getId().equals(currentProductId))
                .ifPresent(product -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Codigo de barras ja cadastrado.");
                });
    }

    private String normalizeRequired(String value, String message) {
        String normalized = normalizeOptional(value);
        if (normalized == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
        return normalized;
    }

    private String normalizeOptional(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }

    private String generateInternalCode(Integer id) {
        return "PROD-%06d".formatted(id);
    }

    private String generateTemporaryInternalCode() {
        return "TMP-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
    }

    @Transactional
    public DeletionResultDTO deleteProduct(Integer id) {
        return deletionService.delete(DeletionResource.PRODUCT, id);
    }

    @Transactional
    public DeletionResultDTO forceDeleteProduct(Integer id) {
        return deletionService.forceDelete(DeletionResource.PRODUCT, id);
    }

    public DeletionReportDTO getDeletionReport(Integer id) {
        return deletionService.report(DeletionResource.PRODUCT, id);
    }
}
