package com.distribuidora.system_oficina.stock.dto;

import java.sql.Timestamp;
import com.distribuidora.system_oficina.stock.entity.Stock;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockResponseDTO {
    
    @Schema(description = "id do stock")
    private Integer id;

    @Schema(description = "id do product")
    private Integer productId;

    @Schema(description = "quantidade do product")
    private Integer quantity;

    @Schema(description = "quantidade minima do produto")
    private Integer minQuantity;

    @Schema(description = "local do stock")
    private String location;

    @Schema(description = "Data de atualização do stock")
    private Timestamp updatedAt;

    public static StockResponseDTO fromEntity(Stock stock) {
        return StockResponseDTO.builder()
                .id(stock.getId())
                .productId(stock.getProduct() != null? stock.getProduct().getId() : null)
                .quantity(stock.getQuantity())
                .minQuantity(stock.getMinQuantity())
                .location(stock.getLocation())
                .updatedAt(stock.getUpdatedAt())
                .build();
    
    }
}
