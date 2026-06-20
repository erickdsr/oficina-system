package com.distribuidora.system_oficina.stock.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.distribuidora.system_oficina.stock.dto.StockMovementDTO;
import com.distribuidora.system_oficina.stock.dto.StockRequestDTO;
import com.distribuidora.system_oficina.stock.dto.StockResponseDTO;
import com.distribuidora.system_oficina.stock.service.StockService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/stock")
@Tag(name = "stock", description = "Proucts stock")
public class StockController {
    
      private final StockService stockService;

    @GetMapping
    @Operation(summary = "List stocks", description = "Get a list of all stocks")
    public ResponseEntity<List<StockResponseDTO>> listStock() {
        return ResponseEntity.ok(stockService.listStock());
    }
    @GetMapping("/{id}")
    @Operation(summary = "Get stock by ID", description = "Retrieve a stock by their unique identifier")
    public ResponseEntity<StockResponseDTO> getStockById(@PathVariable Integer id) {
        return ResponseEntity.ok(stockService.getStockById(id));
    }
    @GetMapping("/{low}")
    @Operation(summary = "Low stock", description = "Alert a stock low")
    public ResponseEntity<List<StockResponseDTO>> listLowStock() {
        return ResponseEntity.ok(stockService.listLowStock());
    }
    @PatchMapping("/{id}")
    @Operation(summary = "Update stock", description = "Update an existing stock")
    public ResponseEntity<StockResponseDTO> updatestock(@PathVariable Integer id, @RequestBody @Valid StockRequestDTO dto) {
        return ResponseEntity.ok(stockService.updateStock(id, dto));
    }
    @GetMapping("/{movements}")
    @Operation(summary = "Movements stock", description = "Get a list of all movements stocks")
    public ResponseEntity<List<StockMovementDTO>> listMovementStock() {
        return ResponseEntity.ok(stockService.listMovementStock());
    }    
    @GetMapping("/movements/{productId}")
    @Operation(summary = "Movement product", description = "Get a movement product")
    public ResponseEntity<List<StockMovementDTO>> listMovementProduct(@PathVariable Integer productId) {
        return ResponseEntity.ok(stockService.listMovementProduct(productId));
    }
}