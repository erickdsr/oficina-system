package com.distribuidora.system_oficina.stock.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
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
@Tag(name = "Stock", description = "Stock and inventory management endpoints")
public class StockController {

    private final StockService stockService;

    @PostMapping
    @Operation(summary = "Create stock entry", description = "Creates a new stock record for a product")
    public ResponseEntity<StockResponseDTO> createStock(@Valid @RequestBody StockRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(stockService.createStock(dto));
    }

    @GetMapping
    @Operation(summary = "List all stock items", description = "Returns all stock records")
    public ResponseEntity<List<StockResponseDTO>> listStock() {
        return ResponseEntity.ok(stockService.listStock());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get stock by ID", description = "Returns the stock record matching the provided identifier")
    public ResponseEntity<StockResponseDTO> getStockById(@PathVariable Integer id) {
        return ResponseEntity.ok(stockService.getStockById(id));
    }

    @GetMapping("/low")
    @Operation(summary = "List low stock items", description = "Returns products whose current stock is below the minimum threshold")
    public ResponseEntity<List<StockResponseDTO>> listLowStock() {
        return ResponseEntity.ok(stockService.listLowStock());
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Update stock information", description = "Updates the stock record for the specified product")
    public ResponseEntity<StockResponseDTO> updateStock(@PathVariable Integer id, @RequestBody @Valid StockRequestDTO dto) {
        return ResponseEntity.ok(stockService.updateStock(id, dto));
    }

    @GetMapping("/movements")
    @Operation(summary = "List stock movements", description = "Returns all stock movement records")
    public ResponseEntity<List<StockMovementDTO>> listMovementStock() {
        return ResponseEntity.ok(stockService.listMovementStock());
    }

    @GetMapping("/movements/{productId}")
    @Operation(summary = "List movements by product", description = "Returns the movement history for a specific product")
    public ResponseEntity<List<StockMovementDTO>> listMovementProduct(@PathVariable Integer productId) {
        return ResponseEntity.ok(stockService.listMovementProduct(productId));
    }
}