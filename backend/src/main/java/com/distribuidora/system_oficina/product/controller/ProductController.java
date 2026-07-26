package com.distribuidora.system_oficina.product.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import com.distribuidora.system_oficina.product.dto.ProductRequestDTO;
import com.distribuidora.system_oficina.product.dto.ProductResponseDTO;
import com.distribuidora.system_oficina.product.service.ProductService;
import com.distribuidora.system_oficina.deletion.DeletionReportDTO;
import com.distribuidora.system_oficina.deletion.DeletionResultDTO;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.web.bind.annotation.RequestBody;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/products")
@Tag(name = "Products", description = "Product management endpoints")
public class ProductController {

    private final ProductService productService;

    @GetMapping
    @Operation(summary = "List all products", description = "Returns all registered products")
    public ResponseEntity<List<ProductResponseDTO>> listProducts(@RequestParam(defaultValue = "false") boolean includeInactive) {
        return ResponseEntity.ok(productService.listProducts(includeInactive));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get product by ID", description = "Returns the product matching the provided identifier")
    public ResponseEntity<ProductResponseDTO> getProductById(@PathVariable Integer id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    @PostMapping
    @Operation(summary = "Create a new product", description = "Creates a new product with the supplied information")
    public ResponseEntity<ProductResponseDTO> createProduct(@Valid @RequestBody ProductRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.createProduct(dto));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a product", description = "Updates the existing product information for the specified identifier")
    public ResponseEntity<ProductResponseDTO> updateProduct(@PathVariable Integer id, @RequestBody @Valid ProductRequestDTO dto) {
        return ResponseEntity.ok(productService.updateProduct(id, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a product", description = "Deletes the product identified by the provided ID")
    public ResponseEntity<DeletionResultDTO> deleteProduct(@PathVariable Integer id) {
        return ResponseEntity.ok(productService.deleteProduct(id));
    }

    @DeleteMapping("/{id}/force")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Force delete a product", description = "Deletes the product and its dependent records")
    public ResponseEntity<DeletionResultDTO> forceDeleteProduct(@PathVariable Integer id) {
        return ResponseEntity.ok(productService.forceDeleteProduct(id));
    }

    @GetMapping("/{id}/deletion-report")
    @Operation(summary = "Get product deletion report", description = "Returns the dependencies that affect product deletion")
    public ResponseEntity<DeletionReportDTO> getDeletionReport(@PathVariable Integer id) {
        return ResponseEntity.ok(productService.getDeletionReport(id));
    }
}
