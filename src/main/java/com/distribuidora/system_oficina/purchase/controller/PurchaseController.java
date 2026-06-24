package com.distribuidora.system_oficina.purchase.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.distribuidora.system_oficina.purchase.dto.PurchaseRequestDTO;
import com.distribuidora.system_oficina.purchase.dto.PurchaseResponseDTO;
import com.distribuidora.system_oficina.purchase.service.PurchaseService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;


@RestController
@RequestMapping("/purchases")
@RequiredArgsConstructor
@Tag(name = "purchases", description = "Operations related to purchases")
public class PurchaseController {
     
    private final PurchaseService purchaseService;

    @PostMapping
    @Operation(summary = "fazer compras", description = "Buy a new Product")
    public ResponseEntity<PurchaseResponseDTO> createPurchase(@Valid @RequestBody PurchaseRequestDTO dto){
        return ResponseEntity.status(HttpStatus.CREATED).body(purchaseService.createPurchase(dto));
    }
    @GetMapping
    @Operation(summary = "List Products", description = "Get a list of all Purchases")
    public ResponseEntity<List<PurchaseResponseDTO>> listPurchases() {
        return ResponseEntity.ok(purchaseService.listPurchases());
    }
    @GetMapping("/{id}")
    @Operation(summary = "Get Purchase by ID", description = "Retrieve a Purchse by their unique identifier")
    public ResponseEntity<PurchaseResponseDTO> getPurchaseById(@PathVariable Integer id) {
        return ResponseEntity.ok(purchaseService.getPurchaseById(id));
    }
    @PatchMapping("/confirm/{id}")
    @Operation(summary = "confirm buy", description = "confirm buy a product")
    public ResponseEntity<PurchaseResponseDTO> confirmPurchase(@PathVariable Integer id, @RequestBody @Valid PurchaseRequestDTO dto) {
        return ResponseEntity.ok(purchaseService.confirmPurchase(id));

    }
    @PatchMapping("/cancel/{id}")
    @Operation(summary = "cancel buy", description = "cancel buy a product")
    public ResponseEntity<PurchaseResponseDTO> cancelPurchase(@PathVariable Integer id, @RequestBody @Valid PurchaseRequestDTO dto) {
        return ResponseEntity.ok(purchaseService.cancelPurchase(id));
    }
}