package com.distribuidora.system_oficina.supplier.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import lombok.RequiredArgsConstructor;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PathVariable;
import java.util.List;
import com.distribuidora.system_oficina.supplier.dto.SupplierRequestDTO;
import com.distribuidora.system_oficina.supplier.dto.SupplierResponseDTO;   
import com.distribuidora.system_oficina.supplier.service.SupplierService;
import jakarta.validation.Valid;



@RestController
@RequiredArgsConstructor
@RequestMapping("/suppliers")
@Tag(name = "Suppliers", description = "Supplier management endpoints")
public class SupplierController {

    private final SupplierService supplierService;

    @GetMapping
    @Operation(summary = "List all suppliers", description = "Returns all registered suppliers")
    public ResponseEntity<List<SupplierResponseDTO>> listSupplier() {
        return ResponseEntity.ok(supplierService.listSupplier());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get supplier by ID", description = "Returns the supplier matching the provided identifier")
    public ResponseEntity<SupplierResponseDTO> getSupplierById(@PathVariable Integer id) {
        return ResponseEntity.ok(supplierService.getSupplierById(id));
    }

    @PostMapping
    @Operation(summary = "Create a new supplier", description = "Creates a new supplier record with the provided details")
    public ResponseEntity<SupplierResponseDTO> createSupplier(@RequestBody @Valid SupplierRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(supplierService.createSupplier(dto));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing supplier", description = "Updates the supplier information for the specified identifier")
    public ResponseEntity<SupplierResponseDTO> updateSupplier(@PathVariable Integer id, @RequestBody @Valid SupplierRequestDTO dto) {
        return ResponseEntity.ok(supplierService.updateSupplier(id, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a supplier", description = "Deletes the supplier identified by the provided ID")
    public ResponseEntity<String> deleteSupplier(@PathVariable Integer id) {
        supplierService.deleteSupplier(id);
        return ResponseEntity.noContent().build();
    }
}
