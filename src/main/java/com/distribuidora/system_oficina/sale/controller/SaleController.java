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
@Tag(name = "sales", description = "Operations related to Sales")
public class SaleController {
    
    private final SaleService saleService;

    @PostMapping
    @Operation(summary = "fazer vendas", description = "sale a new Product")
    public ResponseEntity<SaleResponseDTO> createSale(@Valid @RequestBody SaleRequestDTO dto){
        return ResponseEntity.status(HttpStatus.CREATED).body(saleService.createSale(dto));
    }
    @GetMapping
    @Operation(summary = "List sales", description = "Get a list of all Sales")
    public ResponseEntity<List<SaleResponseDTO>> listSales() {
        return ResponseEntity.ok(saleService.listSales());
    }
    @GetMapping("/{id}")
    @Operation(summary = "Get Sale by ID", description = "Retrieve a sale by their unique identifier")
    public ResponseEntity<SaleResponseDTO> getSaleById(@PathVariable Integer id) {
        return ResponseEntity.ok(saleService.getSaleById(id));
    }
    @PatchMapping("/finalize/{id}")
    @Operation(summary = "finalize buy", description = "finalize buy a product")
    public ResponseEntity<SaleResponseDTO> finalizeSale(@PathVariable Integer id, @RequestBody @Valid SaleRequestDTO dto) {
        return ResponseEntity.ok(saleService.finalizeSale(id));

    }
    @PatchMapping("/cancel/{id}")
    @Operation(summary = "cancel buy", description = "cancel buy a product")
    public ResponseEntity<SaleResponseDTO> cancelSale(@PathVariable Integer id, @RequestBody @Valid SaleRequestDTO dto) {
        return ResponseEntity.ok(saleService.cancelSale(id));
    }
}
