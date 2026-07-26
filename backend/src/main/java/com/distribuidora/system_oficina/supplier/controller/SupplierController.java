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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import java.util.List;
import com.distribuidora.system_oficina.deletion.DeletionReportDTO;
import com.distribuidora.system_oficina.deletion.DeletionResultDTO;
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
    public ResponseEntity<List<SupplierResponseDTO>> listSupplier(@RequestParam(defaultValue = "false") boolean includeInactive) {
        return ResponseEntity.ok(supplierService.listSupplier(includeInactive));
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
    public ResponseEntity<DeletionResultDTO> deleteSupplier(@PathVariable Integer id) {
        return ResponseEntity.ok(supplierService.deleteSupplier(id));
    }

    @DeleteMapping("/{id}/force")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Force delete a supplier", description = "Deletes the supplier and its dependent records")
    public ResponseEntity<DeletionResultDTO> forceDeleteSupplier(@PathVariable Integer id) {
        return ResponseEntity.ok(supplierService.forceDeleteSupplier(id));
    }

    @GetMapping("/{id}/deletion-report")
    @Operation(summary = "Get supplier deletion report", description = "Returns the dependencies that affect supplier deletion")
    public ResponseEntity<DeletionReportDTO> getDeletionReport(@PathVariable Integer id) {
        return ResponseEntity.ok(supplierService.getDeletionReport(id));
    }
}
