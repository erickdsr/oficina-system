package com.distribuidora.system_oficina.sale.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.distribuidora.system_oficina.sale.dto.SaleRequestDTO;
import com.distribuidora.system_oficina.sale.dto.SaleResponseDTO;
import com.distribuidora.system_oficina.sale.service.SaleService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.RequestMapping;


@RestController
@RequestMapping("/sales")
@RequiredArgsConstructor
@Tag(name = "Sales", description = "Sales management endpoints")
public class SaleController {

    private final SaleService saleService;

    @PostMapping
    @Operation(summary = "Create a new sale", description = "Registers a new sale with items and payment information")
    public ResponseEntity<SaleResponseDTO> createSale(@Valid @RequestBody SaleRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(saleService.createSale(dto));
    }

    @GetMapping
    @Operation(summary = "List all sales", description = "Returns all registered sales")
    public ResponseEntity<List<SaleResponseDTO>> listSales() {
        return ResponseEntity.ok(saleService.listSales());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get sale by ID", description = "Returns the sale matching the provided identifier")
    public ResponseEntity<SaleResponseDTO> getSaleById(@PathVariable Integer id) {
        return ResponseEntity.ok(saleService.getSaleById(id));
    }

    @PatchMapping("/finalize/{id}")
    @Operation(summary = "Finalize a sale", description = "Finalizes the sale identified by the provided ID")
    public ResponseEntity<SaleResponseDTO> finalizeSale(@PathVariable Integer id, @RequestBody @Valid SaleRequestDTO dto) {
        return ResponseEntity.ok(saleService.finalizeSale(id));
    }

    @PatchMapping("/cancel/{id}")
    @Operation(summary = "Cancel a sale", description = "Cancels the sale identified by the provided ID")
    public ResponseEntity<SaleResponseDTO> cancelSale(@PathVariable Integer id, @RequestBody @Valid SaleRequestDTO dto) {
        return ResponseEntity.ok(saleService.cancelSale(id));
    }
}
